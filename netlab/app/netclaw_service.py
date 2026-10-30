import json
import re
from typing import Dict, Any, List, Optional
from app.lab_manager import lab_mgr

class NetClawService:
    """
    NetClaw AI Mentor Engine
    Inspired by John Capobianco's NetClaw agentic NetOps framework.
    Uses pyATS/Genie-style structured operational state parsing to deliver
    fact-grounded, Socratic advice for CCNP lab students.
    """

    def get_pyats_diagnostics(self, lab_id: str) -> Dict[str, Any]:
        """Simulates pyATS Genie parsers extracting structured state from devices."""
        diagnostics = {}
        
        if lab_id == "encor_ospf_mtu":
            r1 = lab_mgr.nodes.get("r1")
            r2 = lab_mgr.nodes.get("r2")
            
            r1_mtu = r1.interfaces.get("GigabitEthernet0/1", {}).get("mtu", 1400) if r1 else 1400
            r2_mtu = r2.interfaces.get("GigabitEthernet0/1", {}).get("mtu", 1500) if r2 else 1500
            r1_ignore = r1.interfaces.get("GigabitEthernet0/1", {}).get("ospf_mtu_ignore", False) if r1 else False
            
            state_match = (r1_mtu == r2_mtu) or r1_ignore

            diagnostics = {
                "pyats_parser": "genie.libs.parser.iosxe.show_ospf",
                "ospf_instance": 1,
                "area": "0.0.0.0",
                "neighbors": [
                    {
                        "local_router": "R1",
                        "neighbor_id": "2.2.2.2",
                        "interface": "GigabitEthernet0/1",
                        "local_mtu": r1_mtu,
                        "neighbor_mtu": r2_mtu,
                        "mtu_ignore": r1_ignore,
                        "state": "FULL/BDR" if state_match else "EXSTART/BDR"
                    }
                ],
                "mtu_healthy": state_match
            }

        elif lab_id == "encor_bgp_rr":
            r1 = lab_mgr.nodes.get("r1")
            r3_client = False
            if r1:
                for peer_ip, data in r1.bgp.get("neighbors", {}).items():
                    if peer_ip in ["10.0.2.3", "3.3.3.3", "r3"] and data.get("rr_client"):
                        r3_client = True
                        break
            diagnostics = {
                "pyats_parser": "genie.libs.parser.iosxe.show_bgp",
                "as_number": 65001,
                "route_reflector": "R1",
                "peers": [
                    {"neighbor": "10.0.1.2 (R2)", "type": "route-reflector-client", "status": "Established"},
                    {"neighbor": "10.0.2.3 (R3)", "type": "route-reflector-client" if r3_client else "standard-ibgp", "status": "Established"}
                ],
                "reflected_prefixes": ["172.16.10.0/24"] if r3_client else []
            }

        elif lab_id == "enarsi_route_map":
            r1 = lab_mgr.nodes.get("r1")
            has_10 = False
            if r1:
                for pl in r1.prefix_lists.get("PERMITTED_NETS", []):
                    if "192.168.10.0" in pl.get("prefix", "") and pl.get("action") == "permit":
                        has_10 = True
                if len(r1.route_maps.get("EXPORT_BGP", [])) > 1:
                    has_10 = True

            diagnostics = {
                "pyats_parser": "genie.libs.parser.iosxe.show_route_map",
                "policy_name": "EXPORT_BGP",
                "matched_prefix_list": "PERMITTED_NETS",
                "permitted_subnets": ["192.168.20.0/24"] + (["192.168.10.0/24"] if has_10 else []),
                "issue_detected": not has_10
            }

        return diagnostics

    def review_configs(self, lab_id: str) -> Dict[str, Any]:
        """Provides an in-depth review of the current lab configuration."""
        diag = self.get_pyats_diagnostics(lab_id)
        findings = []

        if lab_id == "encor_ospf_mtu":
            if diag.get("mtu_healthy"):
                reply = (
                    "🟢 **NetClaw Inspection: Pass!**\n\n"
                    "I analyzed both interfaces with pyATS Genie parsers:\n"
                    "- Both endpoints agree on MTU or MTU-ignore is configured.\n"
                    "- OSPF adjacency successfully transitioned to **FULL**.\n"
                    "- LSAs and Database Description packets are actively synchronizing."
                )
                findings = [
                    "✓ GigabitEthernet0/1 MTU consistent across links",
                    "✓ OSPF Neighbor adjacency reached FULL state",
                    "✓ Routing table has populated OSPF routes"
                ]
            else:
                n = diag["neighbors"][0]
                reply = (
                    "🟡 **NetClaw Inspection: Discrepancy Found!**\n\n"
                    "I pulled structured telemetry from `R1` and `R2` using Genie:\n\n"
                    f"- **R1 GigabitEthernet0/1:** MTU = `{n['local_mtu']}` bytes\n"
                    f"- **R2 GigabitEthernet0/1:** MTU = `{n['neighbor_mtu']}` bytes\n"
                    f"- **Current State:** `{n['state']}`\n\n"
                    "**Mentor Advice:** In OSPF, neighbor state gets stuck in `EXSTART` when routers cannot agree on the MTU inside DBD frames. Check `R1`'s interface configuration."
                )
                findings = [
                    f"⚠️ MTU mismatch: R1={n['local_mtu']} vs R2={n['neighbor_mtu']}",
                    "⚠️ OSPF stuck in EXSTART state during Database Exchange",
                    "ℹ️ Recommendation: Align MTU to 1500 on R1 or set 'ip ospf mtu-ignore'"
                ]

        elif lab_id == "encor_bgp_rr":
            peers = diag.get("peers", [])
            r3_peer = next((p for p in peers if "R3" in p["neighbor"]), {})
            is_rr_client = r3_peer.get("type") == "route-reflector-client"

            if is_rr_client:
                reply = (
                    "🟢 **NetClaw Inspection: Pass!**\n\n"
                    "BGP configuration review complete:\n"
                    "- R3 is explicitly configured as a `route-reflector-client` on R1.\n"
                    "- R1 is reflecting routes originated by R2 toward R3.\n"
                    "- R3 BGP table now contains `172.16.10.0/24`."
                )
                findings = [
                    "✓ R1 neighbor 10.0.2.3 designated as route-reflector-client",
                    "✓ iBGP split-horizon rule bypassed for client",
                    "✓ Prefix 172.16.10.0/24 successfully reflected to R3"
                ]
            else:
                reply = (
                    "🟡 **NetClaw Inspection: Missing Client Directive!**\n\n"
                    "I examined R1's BGP peers with pyATS:\n\n"
                    "- Neighbor R2 (10.0.1.2) is a configured `route-reflector-client`.\n"
                    "- Neighbor R3 (10.0.2.3) is **NOT** configured as a route-reflector-client!\n\n"
                    "**Mentor Advice:** Remember the fundamental iBGP split-horizon rule: an iBGP speaker cannot advertise an iBGP-learned prefix to another non-client iBGP peer without a full mesh."
                )
                findings = [
                    "⚠️ Neighbor 10.0.2.3 lacks 'route-reflector-client' attribute on R1",
                    "⚠️ Prefix 172.16.10.0/24 suppressed from advertising to R3",
                    "ℹ️ Recommendation: Enter 'router bgp 65001' on R1 and set 'neighbor 10.0.2.3 route-reflector-client'"
                ]

        elif lab_id == "enarsi_route_map":
            if not diag.get("issue_detected"):
                reply = (
                    "🟢 **NetClaw Inspection: Pass!**\n\n"
                    "Route policy analysis complete:\n"
                    "- Prefix-list and route-map `EXPORT_BGP` now permit `192.168.10.0/24`.\n"
                    "- R2 has learned the redistributed route in its BGP table."
                )
                findings = [
                    "✓ Route policy permits 192.168.10.0/24",
                    "✓ R2 receives prefix via eBGP session"
                ]
            else:
                reply = (
                    "🟡 **NetClaw Inspection: Prefix Filtered!**\n\n"
                    "I parsed the route-map and prefix-list rules on R1:\n\n"
                    "- `PERMITTED_NETS` only matches `192.168.20.0/24`.\n"
                    "- `192.168.10.0/24` is blocked by the implicit deny at the end of the prefix-list/route-map.\n\n"
                    "**Mentor Advice:** Review sequence statements on R1. Either add a sequence permitting `192.168.10.0/24` or add a new route-map clause."
                )
                findings = [
                    "⚠️ Prefix 192.168.10.0/24 dropped by implicit deny",
                    "ℹ️ Recommendation: Update prefix-list PERMITTED_NETS or route-map EXPORT_BGP"
                ]

        return {
            "reply": reply,
            "diagnostics": diag,
            "structured_findings": findings
        }

    def answer_student_chat(self, lab_id: str, message: str, context_node: Optional[str] = None) -> Dict[str, Any]:
        """Provides an intelligent, conversational response grounded in live lab state and CCNP blueprints."""
        diag = self.get_pyats_diagnostics(lab_id)
        msg = message.strip()
        low = msg.lower()

        # 1. Direct MTU or Fix questions
        is_fix_question = any(w in low for w in [
            "how do i fix", "how to fix", "how do we fix", "fix that", "fix it",
            "what command", "which command", "give me the command", "what to type",
            "commands to fix", "solution", "steps to fix", "change mtu", "set mtu", "mismatched"
        ]) or ("mtu" in low and any(w in low for w in ["fix", "resolve", "change", "how", "mismatch", "wrong"]))

        if is_fix_question:
            if lab_id == "encor_ospf_mtu":
                n = diag["neighbors"][0] if diag.get("neighbors") else {}
                r1_mtu = n.get("local_mtu", 1400)
                r2_mtu = n.get("neighbor_mtu", 1500)
                
                reply = (
                    "### How to Fix the MTU Mismatch in OSPF\n\n"
                    f"Right now, **R1** is set to `{r1_mtu}` bytes while **R2** is set to `{r2_mtu}` bytes. "
                    "In OSPF, Database Description (DBD) frames are dropped if the received MTU is larger than the local MTU, keeping neighbor state stuck in `EXSTART`.\n\n"
                    "#### Recommended Fix (Align MTU to 1500 on R1):\n"
                    "Click on the **R1** terminal tab and enter the following commands:\n"
                    "```text\n"
                    "R1# configure terminal\n"
                    "R1(config)# interface GigabitEthernet0/1\n"
                    "R1(config-if)# ip mtu 1500\n"
                    "R1(config-if)# end\n"
                    "```\n\n"
                    "#### Alternative Fix (Disable MTU Verification):\n"
                    "If you cannot change the physical MTU, you can tell OSPF to ignore the mismatch:\n"
                    "```text\n"
                    "R1(config-if)# ip ospf mtu-ignore\n"
                    "```\n\n"
                    "#### Verification:\n"
                    "Immediately after entering the command, verify the adjacency achieves `FULL` state:\n"
                    "```text\n"
                    "R1# show ip ospf neighbor\n"
                    "```"
                )
                return {
                    "reply": reply,
                    "diagnostics": diag,
                    "structured_findings": [f"Current MTU: R1={r1_mtu}, R2={r2_mtu}", "Solution: ip mtu 1500 or ip ospf mtu-ignore"]
                }
            elif lab_id == "encor_bgp_rr":
                reply = (
                    "To fix the BGP Route Reflector issue on **R1**:\n\n"
                    "Select the **R1** terminal tab and designate R3 (10.0.2.3) as a client:\n"
                    "```text\n"
                    "R1# configure terminal\n"
                    "R1(config)# router bgp 65001\n"
                    "R1(config-router)# neighbor 10.0.2.3 route-reflector-client\n"
                    "R1(config-router)# end\n"
                    "```\n\n"
                    "Then switch to **R3** and run `show ip bgp` to confirm prefix `172.16.10.0/24` has been reflected!"
                )
            elif lab_id == "enarsi_route_map":
                reply = (
                    "To permit prefix `192.168.10.0/24` on **R1**:\n\n"
                    "Select the **R1** tab and add the prefix to the prefix-list:\n"
                    "```text\n"
                    "R1# configure terminal\n"
                    "R1(config)# ip prefix-list PERMITTED_NETS seq 20 permit 192.168.10.0/24\n"
                    "R1(config)# end\n"
                    "```\n\n"
                    "Then switch to **R2** and run `show ip bgp` to confirm the route is installed!"
                )
            else:
                reply = "Please let me know which router you want configuration commands for!"

            return {
                "reply": reply,
                "diagnostics": diag,
                "structured_findings": ["Direct configuration commands provided."]
            }

        # 2. User is asking "What is broken / What is the problem?"
        if any(w in low for w in ["what is wrong", "what's wrong", "what is broken", "why", "issue", "problem", "explain", "exstart"]):
            if lab_id == "encor_ospf_mtu":
                n = diag["neighbors"][0]
                reply = (
                    "🔍 **Diagnosis of OSPF EXSTART Issue:**\n\n"
                    f"- **R1 Gi0/1 MTU:** `{n['local_mtu']}` bytes\n"
                    f"- **R2 Gi0/1 MTU:** `{n['neighbor_mtu']}` bytes\n\n"
                    "**Why it's stuck in EXSTART:**\n"
                    "In OSPF, after routers establish 2-WAY communication, they enter `EXSTART` to elect Master and Slave "
                    "and exchange Database Description (DBD) packets. Cisco IOS includes the interface MTU inside every DBD frame.\n\n"
                    "Because R1 has an MTU of 1400 while R2 has 1500, R1 rejects R2's DBD packets because they exceed R1's MTU, "
                    "causing the adjacency to remain trapped in EXSTART indefinitely."
                )
            elif lab_id == "encor_bgp_rr":
                reply = (
                    "🔍 **Diagnosis of BGP Route Reflection Issue:**\n\n"
                    "R1 is peered with both R2 and R3 in iBGP (AS 65001). R2 originates `172.16.10.0/24` and advertises it to R1.\n\n"
                    "However, under standard iBGP rules (split-horizon), an iBGP router will **never** forward an iBGP-learned route to another iBGP peer without a full mesh. "
                    "To bypass this rule, the Route Reflector must explicitly designate the receiving neighbor as a `route-reflector-client`.\n\n"
                    "R1 currently has R2 configured as a client, but **lacks the client directive for R3 (10.0.2.3)**."
                )
            elif lab_id == "enarsi_route_map":
                reply = (
                    "🔍 **Diagnosis of Route-Map Filtering:**\n\n"
                    "R1 is redistributing routes into BGP using `route-map EXPORT_BGP`. That route-map calls `ip prefix-list PERMITTED_NETS`.\n\n"
                    "Prefix-lists have an **implicit deny** at the end. Because `PERMITTED_NETS` only has a rule permitting `192.168.20.0/24`, "
                    "the critical prefix `192.168.10.0/24` hits the implicit deny and is filtered out before reaching R2."
                )
            else:
                reply = "I've analyzed the topology. Check the diagnostic findings below."

            return {
                "reply": reply,
                "diagnostics": diag,
                "structured_findings": ["Root cause analysis completed."]
            }

        # 3. User asks about verification or checking status
        if any(w in low for w in ["verify", "is it fixed", "check", "status", "solved", "did it work"]):
            val = lab_mgr.validate_current_lab()
            if val.get("solved"):
                reply = (
                    "🎉 **Yes! All lab validation checks have PASSED!**\n\n"
                    f"- Adjacency / Routing state is fully healthy.\n"
                    f"- Score: {val['score']}/{val['total']}\n\n"
                    "Click the green **Verify Solution** button in the top bar to record your achievement!"
                )
            else:
                reply = (
                    f"⚠️ **Not quite yet:** {val['score']}/{val['total']} checks passed.\n\n"
                    "The issue is still present on the routers. Make sure you applied the fix and check with `show ip ospf neighbor` or `show ip bgp`."
                )
            return {
                "reply": reply,
                "diagnostics": diag,
                "structured_findings": [f"Lab status: {val['score']}/{val['total']} passed"]
            }

        # 4. Show command suggestions
        if any(w in low for w in ["show", "inspect", "command to check"]):
            if lab_id == "encor_ospf_mtu":
                reply = (
                    "Here are the best diagnostic show commands to run on **R1**:\n\n"
                    "1. `show ip ospf neighbor` - Check neighbor state (`EXSTART` vs `FULL`)\n"
                    "2. `show ip interface GigabitEthernet0/1` - Inspect MTU setting\n"
                    "3. `show ip ospf interface GigabitEthernet0/1` - Check OSPF timer intervals & area\n"
                    "4. `show running-config | section ospf` - View active OSPF process config"
                )
            elif lab_id == "encor_bgp_rr":
                reply = (
                    "Here are the best verification commands:\n\n"
                    "1. On R1: `show ip bgp summary` - Verify peer uptime and state\n"
                    "2. On R1: `show running-config | section bgp` - Check neighbor attributes\n"
                    "3. On R3: `show ip bgp` - Check if 172.16.10.0/24 is received"
                )
            else:
                reply = "Try `show running-config` or `show ip route` to view current state."

            return {
                "reply": reply,
                "diagnostics": diag,
                "structured_findings": ["Verification commands provided."]
            }

        # Default fallback: Socratic, tailored guidance based on current state
        if lab_id == "encor_ospf_mtu":
            if diag.get("mtu_healthy"):
                reply = "OSPF is currently in **FULL** state! Both routers have matching MTUs. What else would you like to explore?"
            else:
                reply = (
                    "I am monitoring your CCNP OSPF lab session. Currently, R1 and R2 are connected, "
                    "but OSPF neighbor state is stuck in **EXSTART** due to an MTU mismatch on `GigabitEthernet0/1`.\n\n"
                    "You can ask me:\n"
                    "- *'What commands do I type on R1?'*\n"
                    "- *'Why is it stuck in EXSTART?'*\n"
                    "- *'Show me verification commands'*"
                )
        elif lab_id == "encor_bgp_rr":
            reply = (
                "I am monitoring your BGP Route Reflector lab. R1 is peered with R2 and R3, but R3 is missing the route from R2.\n\n"
                "You can ask me:\n"
                "- *'What command do I need to configure on R1?'*\n"
                "- *'Explain the iBGP split-horizon rule'*"
            )
        else:
            reply = (
                f"Hello! I am **NetClaw**, your AI NetOps coworker. I am actively monitoring your {lab_id.replace('_', ' ').upper()} lab session. "
                "Ask me about any routing issue, or ask *'What commands do I type to fix this?'* for exact syntax!"
            )

        return {
            "reply": reply,
            "diagnostics": diag,
            "structured_findings": [f"Monitoring Node Context: {context_node or 'Global Lab'}"]
        }

# Global singleton
netclaw = NetClawService()
