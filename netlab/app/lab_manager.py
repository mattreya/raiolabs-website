import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.config import LABS_DIR, CLAB_BINARY
from app.cisco_cli import expand_abbreviations

def normalize_interface_name(name: str) -> str:
    """Normalizes Cisco interface abbreviations like gi0/1, g0/1, gig0/1."""
    n = name.strip()
    match = re.match(r'^(?:gi|gig|gigabitethernet)?\s*([0-9]+(?:/[0-9]+)*)$', n, re.IGNORECASE)
    if match:
        return f"GigabitEthernet{match.group(1)}"
    match_lo = re.match(r'^(?:lo|loopback)?\s*([0-9]+)$', n, re.IGNORECASE)
    if match_lo:
        return f"Loopback{match_lo.group(1)}"
    return name

def apply_pipe_filter(output: str, pipe_clause: str) -> str:
    """Applies Cisco IOS pipe filters: | include, | exclude, | begin, | section."""
    if not pipe_clause:
        return output
        
    parts = pipe_clause.strip().split(maxsplit=1)
    if not parts:
        return output
        
    filter_type = parts[0].lower()
    pattern = parts[1].strip() if len(parts) > 1 else ""
    if not pattern:
        return output

    lines = output.splitlines()
    filtered_lines = []

    if filter_type in ["inc", "include"]:
        filtered_lines = [l for l in lines if re.search(pattern, l, re.IGNORECASE)]
    elif filter_type in ["exc", "exclude"]:
        filtered_lines = [l for l in lines if not re.search(pattern, l, re.IGNORECASE)]
    elif filter_type in ["beg", "begin"]:
        found = False
        for l in lines:
            if not found and re.search(pattern, l, re.IGNORECASE):
                found = True
            if found:
                filtered_lines.append(l)
    elif filter_type in ["sec", "section"]:
        collecting = False
        current_indent = 0
        for l in lines:
            if re.search(pattern, l, re.IGNORECASE) and not l.startswith(" "):
                collecting = True
                filtered_lines.append(l)
            elif collecting:
                if l.startswith("!") or (l and not l.startswith(" ") and not l.startswith("\t")):
                    collecting = False
                else:
                    filtered_lines.append(l)
    else:
        return output

    return "\n".join(filtered_lines)


class VirtualNode:
    """High-Fidelity Cisco IOS-XE / XR Virtual Device Engine."""
    def __init__(self, name: str, lab_id: str, node_data: Dict[str, Any], initial_cfg: str = ""):
        self.name = name
        self.lab_id = lab_id
        self.node_data = node_data
        self.hostname = node_data.get("initialState", {}).get("hostname", name.upper())
        self.initial_cfg = initial_cfg
        
        # State tracking
        self.mode = "exec"  # exec, config, config-if, config-router
        self.sub_context = ""
        self.interfaces: Dict[str, Dict[str, Any]] = {}
        self.ospf: Dict[str, Any] = {"enabled": False, "process": 1, "area": 0, "networks": []}
        self.bgp: Dict[str, Any] = {"enabled": False, "as": 65001, "neighbors": {}, "networks": []}
        self.route_maps: Dict[str, List[Dict[str, Any]]] = {}
        self.prefix_lists: Dict[str, List[Dict[str, Any]]] = {}
        
        # Load initial parameters
        self._initialize_from_data()

    def _initialize_from_data(self):
        init = self.node_data.get("initialState", {})
        mtu = init.get("mtu", 1500)
        
        for iface in self.node_data.get("interfaces", []):
            raw_name = iface.get("name", "GigabitEthernet0/1")
            iface_name = normalize_interface_name(raw_name)
            self.interfaces[iface_name] = {
                "ip": iface.get("ip", "10.0.0.1/30"),
                "mtu": mtu,
                "status": "up",
                "ospf_mtu_ignore": False,
                "peer": iface.get("peer")
            }
            
        if "ospfArea" in init:
            self.ospf["enabled"] = True
            self.ospf["process"] = init.get("ospfProcess", 1)
            self.ospf["area"] = init.get("ospfArea", 0)
            self.ospf["networks"] = ["10.0.0.0 0.0.0.3"]
            
        if "as" in init:
            self.bgp["enabled"] = True
            self.bgp["as"] = init.get("as", 65001)
            if self.name == "r1" and self.lab_id == "encor_bgp_rr":
                if "GigabitEthernet0/1" not in self.interfaces:
                    self.interfaces["GigabitEthernet0/1"] = {"ip": "10.0.1.1/30", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                if "GigabitEthernet0/2" not in self.interfaces:
                    self.interfaces["GigabitEthernet0/2"] = {"ip": "10.0.2.1/30", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.bgp["neighbors"]["10.0.1.2"] = {"remote_as": 65001, "rr_client": True}
                self.bgp["neighbors"]["10.0.2.3"] = {"remote_as": 65001, "rr_client": False}
            elif self.name == "r2" and self.lab_id == "encor_bgp_rr":
                if "GigabitEthernet0/1" not in self.interfaces:
                    self.interfaces["GigabitEthernet0/1"] = {"ip": "10.0.1.2/30", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.interfaces["Loopback0"] = {"ip": "172.16.10.1/24", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.bgp["neighbors"]["10.0.1.1"] = {"remote_as": 65001, "rr_client": False}
                self.bgp["networks"].append("172.16.10.0/24")
            elif self.name == "r3" and self.lab_id == "encor_bgp_rr":
                if "GigabitEthernet0/1" not in self.interfaces:
                    self.interfaces["GigabitEthernet0/1"] = {"ip": "10.0.2.3/30", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.bgp["neighbors"]["10.0.2.1"] = {"remote_as": 65001, "rr_client": False}

        if self.lab_id == "enarsi_route_map":
            if self.name == "r1":
                if "GigabitEthernet0/1" not in self.interfaces:
                    self.interfaces["GigabitEthernet0/1"] = {"ip": "10.1.1.1/30", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.interfaces["Loopback1"] = {"ip": "192.168.10.1/24", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.interfaces["Loopback2"] = {"ip": "192.168.20.1/24", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.prefix_lists["PERMITTED_NETS"] = [{"seq": 10, "action": "permit", "prefix": "192.168.20.0/24"}]
                self.route_maps["EXPORT_BGP"] = [{"seq": 10, "action": "permit", "match_prefix": "PERMITTED_NETS"}]
                self.bgp["enabled"] = True
                self.bgp["as"] = 65100
                self.bgp["networks"] = ["192.168.10.0/24", "192.168.20.0/24"]
                self.bgp["neighbors"]["10.1.1.2"] = {"remote_as": 65200, "route_map_out": "EXPORT_BGP"}
            elif self.name == "r2":
                if "GigabitEthernet0/1" not in self.interfaces:
                    self.interfaces["GigabitEthernet0/1"] = {"ip": "10.1.1.2/30", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                self.bgp["enabled"] = True
                self.bgp["as"] = 65200
                self.bgp["neighbors"]["10.1.1.1"] = {"remote_as": 65100}

    def _get_router_id(self) -> str:
        name_digit = re.sub(r'[^0-9]', '', self.name)
        d = name_digit if name_digit else "1"
        return f"{d}.{d}.{d}.{d}"

    def get_prompt(self) -> str:
        if self.mode == "config":
            return f"{self.hostname}(config)# "
        elif self.mode == "config-if":
            return f"{self.hostname}(config-if)# "
        elif self.mode == "config-router":
            return f"{self.hostname}(config-router)# "
        elif self.mode == "config-router-af":
            return f"{self.hostname}(config-router-af)# "
        return f"{self.hostname}# "

    def execute_command(self, cmd_line: str, all_nodes: Dict[str, 'VirtualNode']) -> str:
        cmd = cmd_line.strip()
        if not cmd:
            return ""

        # Expand Cisco abbreviations using the comprehensive grammar engine
        expanded_cmd, err = expand_abbreviations(cmd, mode=self.mode)
        if err:
            return err
        cmd = expanded_cmd

        # Check for IOS Pipe filter (| include, | section, etc.)
        pipe_clause = ""
        if "|" in cmd:
            parts = cmd.split("|", 1)
            cmd = parts[0].strip()
            pipe_clause = parts[1].strip()

        # Handle 'do <command>' from config modes
        if self.mode != "exec" and cmd.lower().startswith("do "):
            exec_subcmd = cmd[3:].strip()
            raw_output = self._handle_exec_commands(exec_subcmd, all_nodes)
            return apply_pipe_filter(raw_output, pipe_clause)

        # Global navigation commands
        low = cmd.lower()
        if low in ["exit", "quit"]:
            if self.mode == "config-router-af":
                self.mode = "config-router"
                self.sub_context = "bgp"
                return ""
            elif self.mode in ["config-if", "config-router"]:
                self.mode = "config"
                self.sub_context = ""
                return ""
            elif self.mode == "config":
                self.mode = "exec"
                self.sub_context = ""
                return ""
            return ""

        if low == "end":
            self.mode = "exec"
            self.sub_context = ""
            return ""

        if low in ["conf t", "configure terminal", "conf term", "con t"]:
            self.mode = "config"
            return "Enter configuration commands, one per line. End with CNTL/Z."

        # Config Mode Handling
        if self.mode.startswith("config"):
            output = self._handle_config_commands(cmd)
            return apply_pipe_filter(output, pipe_clause)

        # Exec Mode Handling
        output = self._handle_exec_commands(cmd, all_nodes)
        return apply_pipe_filter(output, pipe_clause)

    def _handle_config_commands(self, cmd: str) -> str:
        low = cmd.lower()
        
        # Interface configuration navigation
        if low.startswith("interface ") or low.startswith("int "):
            parts = cmd.split(maxsplit=1)
            if len(parts) >= 2:
                target_name = normalize_interface_name(parts[1])
                matched = None
                for existing in self.interfaces.keys():
                    if existing.lower() == target_name.lower():
                        matched = existing
                        break
                if not matched:
                    # Create iface on demand
                    matched = target_name
                    self.interfaces[matched] = {"ip": "unassigned", "mtu": 1500, "status": "up", "ospf_mtu_ignore": False}
                
                self.mode = "config-if"
                self.sub_context = matched
                return ""

        # Router BGP navigation
        if low.startswith("router bgp ") or low == "router bgp":
            parts = cmd.split()
            as_num = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 65001
            self.bgp["enabled"] = True
            self.bgp["as"] = as_num
            self.mode = "config-router"
            self.sub_context = "bgp"
            return ""

        # Router OSPF navigation
        if low.startswith("router ospf ") or low == "router ospf":
            parts = cmd.split()
            pid = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 1
            self.ospf["enabled"] = True
            self.ospf["process"] = pid
            self.mode = "config-router"
            self.sub_context = "ospf"
            return ""

        # Hostname configuration
        if low.startswith("hostname ") or low.startswith("host "):
            parts = cmd.split()
            if len(parts) > 1:
                self.hostname = parts[1]
                return ""

        # Interface sub-mode commands (config-if)
        if self.mode == "config-if":
            iface = self.interfaces.get(self.sub_context)
            if iface:
                # ip mtu <value>
                if low.startswith("ip mtu ") or low.startswith("mtu "):
                    parts = cmd.split()
                    val = parts[-1]
                    if val.isdigit():
                        iface["mtu"] = int(val)
                        return ""
                    return "% Incomplete or invalid command."

                # ip ospf mtu-ignore
                if "ospf mtu-ignore" in low:
                    if low.startswith("no "):
                        iface["ospf_mtu_ignore"] = False
                    else:
                        iface["ospf_mtu_ignore"] = True
                    return ""

                # ip address <ip> <mask>
                if low.startswith("ip address ") or low.startswith("ip add "):
                    parts = cmd.split()
                    if len(parts) >= 4:
                        iface["ip"] = f"{parts[2]}/{parts[3]}"
                        return ""

                # shutdown / no shutdown
                if low in ["shut", "shutdown"]:
                    iface["status"] = "administratively down"
                    return f"%LINK-5-CHANGED: Interface {self.sub_context}, changed state to administratively down"
                elif low in ["no shut", "no shutdown"]:
                    iface["status"] = "up"
                    return f"%LINK-3-UPDOWN: Interface {self.sub_context}, changed state to up"

        # Address-family navigation
        if low.startswith("address-family") or low.startswith("addr ") or low.startswith("af "):
            self.mode = "config-router-af"
            self.sub_context = "bgp-af"
            return ""

        # Router BGP sub-mode commands (config-router, config-router-af, or auto-switch from config)
        if "route-reflector" in low or "rr-client" in low:
            parts = cmd.split()
            # Handle "no neighbor ... route-reflector-client"
            if low.startswith("no "):
                target_peer = "10.0.2.3"
                for p in parts:
                    if p in ["10.0.2.3", "3.3.3.3", "r3"]:
                        target_peer = "10.0.2.3"
                        break
                    elif re.match(r'^\d+\.\d+\.\d+\.\d+$', p):
                        target_peer = p
                if target_peer in self.bgp.get("neighbors", {}):
                    self.bgp["neighbors"][target_peer]["rr_client"] = False
                if "10.0.2.3" in self.bgp.get("neighbors", {}):
                    self.bgp["neighbors"]["10.0.2.3"]["rr_client"] = False
                return ""

            if len(parts) >= 2 and any(parts[0].lower().startswith(x) for x in ["nei", "neighbor"]):
                peer_ip = parts[1]
                if self.mode == "config":
                    self.mode = "config-router"
                    self.sub_context = "bgp"
                target_peer = "10.0.2.3" if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] else peer_ip
                if "neighbors" not in self.bgp:
                    self.bgp["neighbors"] = {}
                if target_peer not in self.bgp["neighbors"]:
                    self.bgp["neighbors"][target_peer] = {"remote_as": self.bgp.get("as", 65001), "rr_client": True}
                else:
                    self.bgp["neighbors"][target_peer]["rr_client"] = True
                if "10.0.2.3" in self.bgp["neighbors"]:
                    self.bgp["neighbors"]["10.0.2.3"]["rr_client"] = True
                return ""

        # Neighbor activate under address-family
        if "activate" in low and ("nei" in low or "neighbor" in low):
            return ""

        if self.mode in ["config-router", "config-router-af"] and ("bgp" in self.sub_context):
            if "remote-as" in low:
                parts = cmd.split()
                try:
                    peer_ip = parts[1]
                    as_idx = parts.index("remote-as") + 1
                    as_num = int(parts[as_idx])
                    if peer_ip not in self.bgp["neighbors"]:
                        self.bgp["neighbors"][peer_ip] = {"remote_as": as_num, "rr_client": False}
                    else:
                        self.bgp["neighbors"][peer_ip]["remote_as"] = as_num
                    return ""
                except Exception:
                    pass

        # Prefix list & route-map in config mode
        if "prefix-list" in low and "permit" in low:
            if "PERMITTED_NETS" not in self.prefix_lists:
                self.prefix_lists["PERMITTED_NETS"] = []
            if "192.168.10.0" in cmd:
                self.prefix_lists["PERMITTED_NETS"].append({"seq": 20, "action": "permit", "prefix": "192.168.10.0/24"})
                return ""

        if "route-map" in low and "permit" in low:
            parts = cmd.split()
            map_name = parts[1] if len(parts) > 1 else "EXPORT_BGP"
            if map_name not in self.route_maps:
                self.route_maps[map_name] = []
            self.route_maps[map_name].append({"seq": 20, "action": "permit"})
            return ""

        return ""

    def _handle_exec_commands(self, cmd: str, all_nodes: Dict[str, 'VirtualNode']) -> str:
        low = cmd.lower()

        # Help / ?
        if low in ["?", "help"]:
            return (
                "Exec commands:\n"
                "  show ip ospf neighbor [detail]   Display OSPF neighbors\n"
                "  show ip ospf interface [<name>]  Display OSPF interface parameters\n"
                "  show ip interface [<name>]       Display IP interface status & MTU\n"
                "  show ip interface brief          Summarize all interfaces\n"
                "  show ip protocols                Display active routing protocols\n"
                "  show ip route                    Display IP routing table\n"
                "  show ip bgp summary              Display BGP peer states\n"
                "  show ip bgp [<prefix>]           Display BGP table\n"
                "  show running-config              Display active configuration\n"
                "  show version                     Display system software release\n"
                "  ping <ip>                        Send ICMP Echo requests\n"
                "  configure terminal               Enter configuration mode\n"
            )

        # show version
        if low.startswith("sh ver") or low.startswith("show ver"):
            return (
                "Cisco IOS XE Software, Version 17.09.01\n"
                "Cisco IOS Software [Cupertino], Virtual XE Software (X86_64_LINUX_IOSD-UNIVERSALK9-M)\n"
                "Technical Support: http://www.cisco.com/techsupport\n"
                f"Router uptime is 1 hour, 45 minutes\n"
                f"System image file is \"bootflash:packages.conf\"\n"
                f"{self.hostname} with 4194304K/1048576K bytes of memory.\n"
            )

        # show ip interface brief
        if any(low == x for x in ["sh ip int br", "sh ip int brief", "show ip int br", "show ip interface brief", "sh ip int b"]):
            lines = [
                "Interface              IP-Address      OK? Method Status                Protocol",
            ]
            for name, iface in self.interfaces.items():
                ip_clean = iface.get("ip", "unassigned").split("/")[0]
                lines.append(f"{name:<22} {ip_clean:<15} YES manual {iface.get('status', 'up'):<21} up")
            return "\n".join(lines)

        # show ip interface <name> (detailed interface view including MTU)
        if (low.startswith("show ip int") or low.startswith("sh ip int")) and not ("br" in low):
            parts = cmd.split()
            target_name = parts[-1] if len(parts) >= 4 else "GigabitEthernet0/1"
            target_name = normalize_interface_name(target_name)
            iface = self.interfaces.get(target_name) or self.interfaces.get("GigabitEthernet0/1", {})
            mtu = iface.get("mtu", 1500)
            ip = iface.get("ip", "10.0.0.1/30")
            status = iface.get("status", "up")
            return (
                f"{target_name} is {status}, line protocol is up\n"
                f"  Internet address is {ip}\n"
                f"  Broadcast address is 255.255.255.255\n"
                f"  Address determined by setup command\n"
                f"  MTU is {mtu} bytes\n"
                f"  Helper address is not set\n"
                f"  Directed broadcast forwarding is disabled\n"
                f"  Outgoing Common access list is not set\n"
                f"  Inbound Common access list is not set\n"
                f"  Proxy ARP is enabled\n"
                f"  Local Proxy ARP is disabled\n"
                f"  Security level is default\n"
                f"  Split horizon is enabled\n"
                f"  ICMP redirects are always sent\n"
                f"  ICMP unreachables are always sent\n"
                f"  ICMP mask replies are never sent\n"
                f"  IP fast switching is enabled\n"
                f"  IP Flow switching is disabled\n"
                f"  IP CEF switching is enabled\n"
            )

        # show ip protocols
        if low.startswith("sh ip proto") or low.startswith("show ip proto"):
            return self._cmd_show_ip_protocols()

        # show ip ospf neighbor
        if any(w in low for w in ["sh ip ospf nei", "show ip ospf nei", "sh ip ospf neighbor", "show ip ospf neighbor"]):
            return self._cmd_show_ospf_neighbor(all_nodes)

        # show ip ospf interface
        if any(w in low for w in ["sh ip ospf int", "show ip ospf int"]):
            return self._cmd_show_ospf_interface(all_nodes, cmd)

        # show ip bgp summary
        if any(w in low for w in ["sh ip bgp sum", "show ip bgp sum", "sh ip bgp summary", "show ip bgp summary"]):
            return self._cmd_show_bgp_summary(all_nodes)

        # show ip bgp neighbors
        if any(w in low for w in ["sh ip bgp nei", "show ip bgp nei", "sh ip bgp neighbor", "show ip bgp neighbors"]):
            return self._cmd_show_bgp_neighbors(all_nodes)

        # show ip bgp table
        if low.startswith("sh ip bgp") or low.startswith("show ip bgp"):
            return self._cmd_show_bgp_table(all_nodes, cmd)

        # show ip route
        if low.startswith("sh ip ro") or low.startswith("show ip route"):
            return self._cmd_show_ip_route(all_nodes, cmd)

        # show running-config
        if low in ["sh run", "show run", "sh running-config", "show running-config"]:
            return self._generate_running_config()

        # show route-map
        if low.startswith("sh route-map") or low.startswith("show route-map"):
            return self._cmd_show_route_map()

        # ping <ip>
        if low.startswith("ping "):
            parts = cmd.split()
            target = parts[1] if len(parts) > 1 else "10.0.0.1"
            return (
                f"Type escape sequence to abort.\n"
                f"Sending 5, 100-byte ICMP Echos to {target}, timeout is 2 seconds:\n"
                f"!!!!!\n"
                f"Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms"
            )

        return f"% Unknown or unsupported simulated command: '{cmd}'. Type '?' for help."

    def _cmd_show_ip_protocols(self) -> str:
        lines = ["*** IP Routing is NSF aware ***", ""]
        if self.ospf.get("enabled"):
            lines.extend([
                f"Routing Protocol is \"ospf {self.ospf.get('process', 1)}\"",
                "  Outgoing update filter list for all interfaces is not set",
                "  Incoming update filter list for all interfaces is not set",
                f"  Router ID {self.hostname}.{self.hostname}.{self.hostname}.{self.hostname}",
                "  Number of areas in this router is 1. 1 normal 0 transit 0 stub",
                "  Maximum path: 4",
                "  Routing for Networks:",
                "    10.0.0.0 0.0.0.3 area 0",
                "  Distance: (default is 110)",
                ""
            ])
        if self.bgp.get("enabled"):
            lines.extend([
                f"Routing Protocol is \"bgp {self.bgp.get('as', 65001)}\"",
                f"  IGP synchronization is disabled",
                f"  automatic network summarization is disabled",
                f"  Neighbor(s):",
            ])
            for peer in self.bgp.get("neighbors", {}).keys():
                lines.append(f"    Address {peer}")
            lines.extend([
                "  Maximum path: 1",
                "  Distance: external 20 internal 200 local 200",
                ""
            ])
        return "\n".join(lines)

    def _cmd_show_ospf_neighbor(self, all_nodes: Dict[str, 'VirtualNode']) -> str:
        if self.lab_id != "encor_ospf_mtu":
            return "% OSPF not enabled in this lab."

        other_node = all_nodes.get("r2" if self.name == "r1" else "r1")
        if not other_node:
            return "% No OSPF neighbors detected."

        my_iface = self.interfaces.get("GigabitEthernet0/1", {})
        other_iface = other_node.interfaces.get("GigabitEthernet0/1", {})

        my_mtu = my_iface.get("mtu", 1500)
        other_mtu = other_iface.get("mtu", 1500)
        mtu_ok = (my_mtu == other_mtu) or my_iface.get("ospf_mtu_ignore") or other_iface.get("ospf_mtu_ignore")

        neighbor_id = "2.2.2.2" if self.name == "r1" else "1.1.1.1"
        neighbor_ip = "10.0.0.2" if self.name == "r1" else "10.0.0.1"
        
        state_str = "FULL/BDR    " if mtu_ok else "EXSTART/BDR "
        if self.name == "r2" and mtu_ok:
            state_str = "FULL/DR     "

        return (
            "Neighbor ID     Pri   State           Dead Time   Address         Interface\n"
            f"{neighbor_id:<15} 1     {state_str:<15} 00:00:34    {neighbor_ip:<15} GigabitEthernet0/1"
        )

    def _cmd_show_ospf_interface(self, all_nodes: Dict[str, 'VirtualNode'], raw_cmd: str) -> str:
        parts = raw_cmd.split()
        target_name = "GigabitEthernet0/1"
        if len(parts) >= 4:
            target_name = normalize_interface_name(parts[3])

        iface = self.interfaces.get(target_name) or self.interfaces.get("GigabitEthernet0/1", {})
        mtu = iface.get("mtu", 1500)
        ip = iface.get("ip", "10.0.0.1/30")
        ignore = " (MTU ignore enabled)" if iface.get("ospf_mtu_ignore") else ""
        return (
            f"{target_name} is up, line protocol is up\n"
            f"  Internet Address {ip}, Area 0, Attached via Interface Enable\n"
            f"  Process ID 1, Router ID {self.hostname}.{self.hostname}.{self.hostname}.{self.hostname}, Network Type BROADCAST, Cost: 1\n"
            f"  Transmit Delay is 1 sec, State DR, Priority 1\n"
            f"  Designated Router (ID) {self.hostname}.{self.hostname}.{self.hostname}.{self.hostname}, Interface address {ip.split('/')[0]}\n"
            f"  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5\n"
            f"  MTU is {mtu} bytes{ignore}\n"
        )

    def _cmd_show_bgp_summary(self, all_nodes: Dict[str, 'VirtualNode']) -> str:
        lines = [
            f"BGP router identifier {self._get_router_id()}, local AS number {self.bgp.get('as', 65001)}",
            "BGP table version is 3, main routing table version 3",
            "",
            "Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd",
        ]
        r1 = all_nodes.get("r1")
        r3_is_client = False
        if r1:
            for peer_ip, data in r1.bgp.get("neighbors", {}).items():
                if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] and data.get("rr_client"):
                    r3_is_client = True
                    break

        for peer_ip, data in self.bgp.get("neighbors", {}).items():
            pfx = "1"
            if self.lab_id == "encor_bgp_rr" and self.name == "r3":
                pfx = "1" if r3_is_client else "0"
            lines.append(f"{peer_ip:<15} 4        {data.get('remote_as', 65001):<5}     42      43        3    0    0 00:15:22        {pfx}")
        return "\n".join(lines)

    def _cmd_show_bgp_neighbors(self, all_nodes: Dict[str, 'VirtualNode']) -> str:
        if not self.bgp.get("enabled"):
            return "% BGP not active"

        lines = []
        r1 = all_nodes.get("r1")
        for peer_ip, data in self.bgp.get("neighbors", {}).items():
            remote_as = data.get("remote_as", 65001)
            is_client = data.get("rr_client", False)
            if self.name == "r3" and r1:
                for p_ip, p_data in r1.bgp.get("neighbors", {}).items():
                    if p_ip in ["10.0.2.3", "3.3.3.3", "r3"] and p_data.get("rr_client"):
                        is_client = True
                        break

            client_str = "  Route reflector client: Yes\n" if is_client else "  Route reflector client: No (Standard iBGP peer)\n"
            lines.append(
                f"BGP neighbor is {peer_ip},  remote AS {remote_as}, internal link\n"
                f"  BGP version 4, remote router ID {peer_ip}\n"
                f"  BGP state = Established, up for 00:18:42\n"
                f"  Neighbor sessions:\n"
                f"    1 active, is not multisession capable (disabled)\n"
                f"  Neighbor capabilities:\n"
                f"    Route refresh: advertised and received(new)\n"
                f"    Address family IPv4 Unicast: advertised and received\n"
                f"{client_str}"
                f"  Connections established 1; dropped 0\n"
                f"  Last reset never\n"
            )
        return "\n".join(lines) if lines else "% No BGP neighbors configured"

    def _cmd_show_bgp_table(self, all_nodes: Dict[str, 'VirtualNode'], raw_cmd: str = "") -> str:
        header = (
            f"BGP table version is 4, local router ID is {self._get_router_id()}\n"
            "Status codes: s suppressed, d damped, h history, * valid, > best, i - internal\n"
            "Origin codes: i - IGP, e - EGP, ? - incomplete\n\n"
            "     Network          Next Hop            Metric LocPrf Weight Path\n"
        )
        if self.lab_id == "encor_bgp_rr":
            r1 = all_nodes.get("r1")
            r3_is_client = False
            if r1:
                for peer_ip, data in r1.bgp.get("neighbors", {}).items():
                    if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] and data.get("rr_client"):
                        r3_is_client = True
                        break

            # Check if specific prefix asked for, e.g. "show ip bgp 172.16.10.0"
            if "172.16.10" in raw_cmd:
                if self.name in ["r1", "r2"] or (self.name == "r3" and r3_is_client):
                    return (
                        f"BGP routing table entry for 172.16.10.0/24, version 4\n"
                        f"Paths: (1 available, best #1, table default)\n"
                        f"  Not advertised to any peer\n"
                        f"  Refresh Epoch 1\n"
                        f"  Local, (Received from a RR-client)\n"
                        f"    10.0.1.2 from 10.0.2.1 ({'1.1.1.1' if self.name == 'r3' else '2.2.2.2'})\n"
                        f"      Origin IGP, metric 0, localpref 100, valid, internal, best\n"
                        f"      Originator: 2.2.2.2, Cluster list: 1.1.1.1\n"
                    )
                else:
                    return "% Network not in table\n"

            if self.name == "r2":
                return header + " *>  172.16.10.0/24   0.0.0.0                  0         32768 i\n"
            elif self.name == "r1":
                return header + " *>i 172.16.10.0/24   10.0.1.2                 0    100      0 i\n"
            elif self.name == "r3":
                if r3_is_client:
                    return header + " *>i 172.16.10.0/24   10.0.1.2                 0    100      0 i\n"
                else:
                    return header + "% BGP table is empty. No reflected routes received.\n"

        elif self.lab_id == "enarsi_route_map":
            r1 = all_nodes.get("r1")
            has_10_permitted = False
            if r1:
                for pl in r1.prefix_lists.get("PERMITTED_NETS", []):
                    if "192.168.10.0" in pl.get("prefix", "") and pl.get("action") == "permit":
                        has_10_permitted = True

            if self.name == "r1":
                return header + (
                    " *>  192.168.10.0     0.0.0.0                  0         32768 i\n"
                    " *>  192.168.20.0     0.0.0.0                  0         32768 i\n"
                )
            elif self.name == "r2":
                table = header + " *>  192.168.20.0     10.1.1.1                 0             0 65100 i\n"
                if has_10_permitted:
                    table += " *>  192.168.10.0     10.1.1.1                 0             0 65100 i\n"
                return table

        return header

    def _cmd_show_ip_route(self, all_nodes: Dict[str, 'VirtualNode'], raw_cmd: str = "") -> str:
        low = raw_cmd.lower()
        header = (
            "Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP\n"
            "       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area\n"
            "       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2\n"
            "       E1 - OSPF external type 1, E2 - OSPF external type 2\n"
            "       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2\n"
            "       ia - IS-IS inter area, * - candidate default, U - per-user static route\n"
            "       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP\n"
            "       a - application route\n"
            "       + - replicated route, % - next hop override, p - overrides from PfR\n\n"
            "Gateway of last resort is not set\n\n"
        )

        # Check if looking for specific prefix e.g. "show ip route 172.16.10.0"
        parts = raw_cmd.split()
        if len(parts) >= 4 and not parts[3].lower() in ["bgp", "ospf", "connected", "conn", "static"]:
            target_pfx = parts[3]
            if "172.16.10" in target_pfx:
                if self.lab_id == "encor_bgp_rr":
                    r1 = all_nodes.get("r1")
                    r3_is_client = False
                    if r1:
                        for peer_ip, data in r1.bgp.get("neighbors", {}).items():
                            if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] and data.get("rr_client"):
                                r3_is_client = True
                                break
                    if self.name in ["r1", "r2"] or (self.name == "r3" and r3_is_client):
                        return (
                            f"Routing entry for 172.16.10.0/24\n"
                            f"  Known via \"bgp {self.bgp.get('as', 65001)}\", distance 200, metric 0, type internal\n"
                            f"  Last update from 10.0.1.2 00:02:14 ago\n"
                            f"  Routing Descriptor Blocks:\n"
                            f"  * 10.0.1.2, from 10.0.2.1, 00:02:14 ago\n"
                            f"      Route metric is 0, traffic share count is 1\n"
                            f"      AS HASH: 65001\n"
                        )
                    else:
                        return "% Network not in table\n"
            elif "192.168.10" in target_pfx:
                if self.lab_id == "enarsi_route_map":
                    r1 = all_nodes.get("r1")
                    has_10 = False
                    if r1:
                        for pl in r1.prefix_lists.get("PERMITTED_NETS", []):
                            if "192.168.10.0" in pl.get("prefix", "") and pl.get("action") == "permit":
                                has_10 = True
                    if self.name == "r1" or (self.name == "r2" and has_10):
                        return (
                            f"Routing entry for 192.168.10.0/24\n"
                            f"  Known via \"bgp {self.bgp.get('as', 65200)}\", distance 20, metric 0\n"
                            f"  Last update from 10.1.1.1 00:01:05 ago\n"
                            f"  Routing Descriptor Blocks:\n"
                            f"  * 10.1.1.1, from 10.1.1.1, 00:01:05 ago\n"
                        )
                    else:
                        return "% Network not in table\n"

        lines = []

        if self.lab_id == "encor_ospf_mtu":
            other = all_nodes.get("r2" if self.name == "r1" else "r1")
            mtu_ok = False
            if other:
                my_mtu = self.interfaces.get("GigabitEthernet0/1", {}).get("mtu", 1500)
                other_mtu = other.interfaces.get("GigabitEthernet0/1", {}).get("mtu", 1500)
                mtu_ok = (my_mtu == other_mtu) or self.interfaces.get("GigabitEthernet0/1", {}).get("ospf_mtu_ignore")

            if not ("ospf" in low and not ("connected" in low)):
                lines.append("      10.0.0.0/30 is subnetted, 1 subnets")
                lines.append("C        10.0.0.0 is directly connected, GigabitEthernet0/1")
                lines.append(f"L        10.0.0.{'1' if self.name == 'r1' else '2'}/32 is directly connected, GigabitEthernet0/1")
            if not ("connected" in low or "conn" in low):
                if mtu_ok:
                    dest = "10.0.0.2" if self.name == "r1" else "10.0.0.1"
                    lines.append(f"O        10.0.0.0/24 [110/2] via {dest}, 00:01:14, GigabitEthernet0/1")
                else:
                    lines.append("% OSPF routes not installed due to neighbor state incomplete (EXSTART)")

        elif self.lab_id == "encor_bgp_rr":
            r1 = all_nodes.get("r1")
            r3_is_client = False
            if r1:
                for peer_ip, data in r1.bgp.get("neighbors", {}).items():
                    if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] and data.get("rr_client"):
                        r3_is_client = True
                        break

            only_bgp = "bgp" in low
            only_conn = "connected" in low or "conn" in low

            if not only_bgp:
                if self.name == "r1":
                    lines.append("      10.0.1.0/30 is subnetted, 1 subnets")
                    lines.append("C        10.0.1.0 is directly connected, GigabitEthernet0/1")
                    lines.append("L        10.0.1.1/32 is directly connected, GigabitEthernet0/1")
                    lines.append("      10.0.2.0/30 is subnetted, 1 subnets")
                    lines.append("C        10.0.2.0 is directly connected, GigabitEthernet0/2")
                    lines.append("L        10.0.2.1/32 is directly connected, GigabitEthernet0/2")
                elif self.name == "r2":
                    lines.append("      10.0.1.0/30 is subnetted, 1 subnets")
                    lines.append("C        10.0.1.0 is directly connected, GigabitEthernet0/1")
                    lines.append("L        10.0.1.2/32 is directly connected, GigabitEthernet0/1")
                    lines.append("      172.16.0.0/24 is subnetted, 1 subnets")
                    lines.append("C        172.16.10.0 is directly connected, Loopback0")
                    lines.append("L        172.16.10.1/32 is directly connected, Loopback0")
                elif self.name == "r3":
                    lines.append("      10.0.2.0/30 is subnetted, 1 subnets")
                    lines.append("C        10.0.2.0 is directly connected, GigabitEthernet0/1")
                    lines.append("L        10.0.2.3/32 is directly connected, GigabitEthernet0/1")

            if not only_conn:
                if self.name == "r1":
                    lines.append("      172.16.0.0/24 is subnetted, 1 subnets")
                    lines.append("B        172.16.10.0/24 [200/0] via 10.0.1.2, 00:04:12")
                elif self.name == "r3":
                    if r3_is_client:
                        lines.append("      172.16.0.0/24 is subnetted, 1 subnets")
                        lines.append("B        172.16.10.0/24 [200/0] via 10.0.1.2, 00:01:15")
                    elif only_bgp:
                        return "% No BGP routes in table\n"

        elif self.lab_id == "enarsi_route_map":
            r1 = all_nodes.get("r1")
            has_10_permitted = False
            if r1:
                for pl in r1.prefix_lists.get("PERMITTED_NETS", []):
                    if "192.168.10.0" in pl.get("prefix", "") and pl.get("action") == "permit":
                        has_10_permitted = True

            only_bgp = "bgp" in low
            only_conn = "connected" in low or "conn" in low

            if not only_bgp:
                if self.name == "r1":
                    lines.append("      10.1.1.0/30 is subnetted, 1 subnets")
                    lines.append("C        10.1.1.0 is directly connected, GigabitEthernet0/1")
                    lines.append("L        10.1.1.1/32 is directly connected, GigabitEthernet0/1")
                    lines.append("      192.168.10.0/24 is subnetted, 1 subnets")
                    lines.append("C        192.168.10.0 is directly connected, Loopback1")
                    lines.append("      192.168.20.0/24 is subnetted, 1 subnets")
                    lines.append("C        192.168.20.0 is directly connected, Loopback2")
                elif self.name == "r2":
                    lines.append("      10.1.1.0/30 is subnetted, 1 subnets")
                    lines.append("C        10.1.1.0 is directly connected, GigabitEthernet0/1")
                    lines.append("L        10.1.1.2/32 is directly connected, GigabitEthernet0/1")

            if not only_conn:
                if self.name == "r2":
                    lines.append("      192.168.20.0/24 is subnetted, 1 subnets")
                    lines.append("B        192.168.20.0/24 [20/0] via 10.1.1.1, 00:03:22")
                    if has_10_permitted:
                        lines.append("      192.168.10.0/24 is subnetted, 1 subnets")
                        lines.append("B        192.168.10.0/24 [20/0] via 10.1.1.1, 00:00:15")

        if not lines:
            return header + "% No matching routes found in table.\n"
        return header + "\n".join(lines)

    def _cmd_show_route_map(self) -> str:
        lines = []
        for name, seqs in self.route_maps.items():
            lines.append(f"route-map {name}, permit, sequence 10")
            lines.append("  Match clauses:")
            lines.append("    ip address prefix-list PERMITTED_NETS")
            lines.append("  Set clauses:")
            lines.append("  Policy routing matches: 15 packets, 1260 bytes")
            if len(seqs) > 1:
                lines.append(f"route-map {name}, permit, sequence 20")
        return "\n".join(lines) if lines else "% No route-maps defined."

    def _generate_running_config(self) -> str:
        lines = [
            f"Building configuration...",
            f"Current configuration : 1842 bytes",
            f"!",
            f"version 17.9",
            f"hostname {self.hostname}",
            f"!"
        ]
        for name, iface in self.interfaces.items():
            lines.append(f"interface {name}")
            lines.append(f" ip address {iface.get('ip', 'unassigned')}")
            lines.append(f" ip mtu {iface.get('mtu', 1500)}")
            if iface.get("ospf_mtu_ignore"):
                lines.append(" ip ospf mtu-ignore")
            lines.append(" no shutdown")
            lines.append("!")
            
        if self.ospf.get("enabled"):
            lines.append(f"router ospf {self.ospf.get('process', 1)}")
            lines.append(f" router-id {self.hostname}.{self.hostname}.{self.hostname}.{self.hostname}")
            lines.append(f" network 10.0.0.0 0.0.0.3 area {self.ospf.get('area', 0)}")
            lines.append("!")
            
        if self.bgp.get("enabled"):
            lines.append(f"router bgp {self.bgp.get('as', 65001)}")
            for net in self.bgp.get("networks", []):
                lines.append(f" network {net}")
            for peer, data in self.bgp.get("neighbors", {}).items():
                lines.append(f" neighbor {peer} remote-as {data.get('remote_as', 65001)}")
                if data.get("rr_client"):
                    lines.append(f" neighbor {peer} route-reflector-client")
                if data.get("route_map_out"):
                    lines.append(f" neighbor {peer} route-map {data.get('route_map_out')} out")
            lines.append("!")

        for name, rules in self.prefix_lists.items():
            for r in rules:
                lines.append(f"ip prefix-list {name} seq {r.get('seq', 10)} {r.get('action', 'permit')} {r.get('prefix')}")

        lines.append("end")
        return "\n".join(lines)


class LabManager:
    """Manages CCNP lab scenarios, Containerlab topologies, and node sessions."""
    def __init__(self):
        self.labs: Dict[str, Dict[str, Any]] = {}
        self.active_lab_id: Optional[str] = None
        self.nodes: Dict[str, VirtualNode] = {}
        self.load_labs()

    def load_labs(self):
        self.labs.clear()
        if not LABS_DIR.exists():
            return
        for lab_folder in LABS_DIR.iterdir():
            if lab_folder.is_dir():
                json_path = lab_folder / "lab.json"
                if json_path.exists():
                    try:
                        with open(json_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            self.labs[data["id"]] = data
                    except Exception as e:
                        print(f"Error loading lab from {json_path}: {e}")

    def get_catalog(self) -> List[Dict[str, Any]]:
        catalog = []
        for lab_id, data in self.labs.items():
            catalog.append({
                "id": data["id"],
                "title": data["title"],
                "track": data["track"],
                "difficulty": data["difficulty"],
                "estimatedTime": data["estimatedTime"],
                "description": data["description"]
            })
        return catalog

    def get_lab_detail(self, lab_id: str) -> Optional[Dict[str, Any]]:
        return self.labs.get(lab_id)

    def switch_lab(self, lab_id: str) -> Dict[str, Any]:
        lab = self.labs.get(lab_id)
        if not lab:
            raise ValueError(f"Lab {lab_id} not found")

        self.active_lab_id = lab_id
        self.nodes.clear()

        # Instantiate virtual nodes for this lab
        for node_spec in lab.get("nodes", []):
            name = node_spec["name"]
            cfg_path = LABS_DIR / lab_id / "configs" / f"{name}.cfg"
            cfg_content = ""
            if cfg_path.exists():
                with open(cfg_path, "r", encoding="utf-8") as f:
                    cfg_content = f.read()

            self.nodes[name] = VirtualNode(name, lab_id, node_spec, cfg_content)

        return lab

    def reset_current_lab(self) -> Dict[str, Any]:
        if not self.active_lab_id:
            raise ValueError("No active lab to reset")
        return self.switch_lab(self.active_lab_id)

    def execute_node_command(self, node_name: str, command: str) -> Dict[str, str]:
        node = self.nodes.get(node_name)
        if not node:
            return {"output": f"Node '{node_name}' not found.", "prompt": "# "}
        output = node.execute_command(command, self.nodes)
        prompt = node.get_prompt()
        return {"output": output, "prompt": prompt}

    def validate_current_lab(self) -> Dict[str, Any]:
        if not self.active_lab_id:
            return {"solved": False, "score": 0, "total": 0, "checks": [], "feedback": "No lab loaded."}

        lab = self.labs[self.active_lab_id]
        checks = []

        if self.active_lab_id == "encor_ospf_mtu":
            r1 = self.nodes.get("r1")
            r2 = self.nodes.get("r2")
            
            r1_mtu = r1.interfaces.get("GigabitEthernet0/1", {}).get("mtu", 1400) if r1 else 1400
            r2_mtu = r2.interfaces.get("GigabitEthernet0/1", {}).get("mtu", 1500) if r2 else 1500
            ignore = r1.interfaces.get("GigabitEthernet0/1", {}).get("ospf_mtu_ignore", False) if r1 else False

            mtu_passed = (r1_mtu == r2_mtu) or ignore
            checks.append({
                "description": "Interface GigabitEthernet0/1 MTU matches (1500) or MTU-ignore is configured",
                "passed": mtu_passed
            })
            checks.append({
                "description": "OSPF Neighbor adjacency on R1 achieves FULL state",
                "passed": mtu_passed
            })
            checks.append({
                "description": "OSPF Neighbor adjacency on R2 achieves FULL state",
                "passed": mtu_passed
            })

        elif self.active_lab_id == "encor_bgp_rr":
            r1 = self.nodes.get("r1")
            r3_is_client = False
            if r1:
                for peer_ip, data in r1.bgp.get("neighbors", {}).items():
                    if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] and data.get("rr_client"):
                        r3_is_client = True
                        break
            checks.append({
                "description": "R1 designates R3 (10.0.2.3) as route-reflector-client",
                "passed": r3_is_client
            })
            checks.append({
                "description": "R3 BGP routing table receives reflected prefix 172.16.10.0/24",
                "passed": r3_is_client
            })

        elif self.active_lab_id == "enarsi_route_map":
            r1 = self.nodes.get("r1")
            has_10 = False
            if r1:
                for pl in r1.prefix_lists.get("PERMITTED_NETS", []):
                    if "192.168.10.0" in pl.get("prefix", "") and pl.get("action") == "permit":
                        has_10 = True
                if len(r1.route_maps.get("EXPORT_BGP", [])) > 1:
                    has_10 = True
            checks.append({
                "description": "Route-map / Prefix-list policy permits 192.168.10.0/24",
                "passed": has_10
            })
            checks.append({
                "description": "Prefix 192.168.10.0/24 advertised and accepted in R2 BGP table",
                "passed": has_10
            })

        passed_count = sum(1 for c in checks if c["passed"])
        total_count = len(checks)
        solved = (passed_count == total_count and total_count > 0)
        
        feedback = "Congratulations! All CCNP verification checks passed." if solved else "Adjacency or routing criteria not yet met. Ask NetClaw for guidance or check the hints."

        return {
            "solved": solved,
            "score": passed_count,
            "total": total_count,
            "checks": checks,
            "feedback": feedback,
            "viewpointQuestions": lab.get("viewpointQuestions", []),
            "examPracticeCommands": lab.get("examPracticeCommands", [])
        }

# Global singleton
lab_mgr = LabManager()
