import re
from typing import Dict, List, Optional, Tuple, Any

# Aliases for common Cisco shorthand
COMMON_ALIASES = {
    "sh": "show",
    "sho": "show",
    "conf": "configure",
    "con": "configure",
    "config": "configure",
    "t": "terminal",
    "term": "terminal",
    "int": "interface",
    "in": "interface",
    "inter": "interface",
    "i": "interface",
    "r": "router",
    "rou": "router",
    "nei": "neighbor",
    "neigh": "neighbor",
    "net": "network",
    "ro": "route",
    "bg": "bgp",
    "sum": "summary",
    "su": "summary",
    "bri": "brief",
    "br": "brief",
    "b": "brief",
    "run": "running-config",
    "ru": "running-config",
    "runn": "running-config",
    "ver": "version",
    "v": "version",
    "shut": "shutdown",
    "add": "address",
    "addr": "address",
    "af": "address-family",
    "rem": "remote-as",
    "rr": "route-reflector-client",
    "rr-client": "route-reflector-client",
    "route-reflector": "route-reflector-client",
    "route-reflector-client": "route-reflector-client"
}

def normalize_interface_name(raw: str) -> str:
    """Normalizes interface abbreviations like gi0/1, g0/1, lo0 to Cisco canonical names."""
    s = raw.strip()
    m_gi = re.match(r'^(?:gi|gig|gigabit|gigabitethernet)\s*([0-9]+/[0-9]+(?:\.[0-9]+)?)$', s, re.IGNORECASE)
    if m_gi:
        return f"GigabitEthernet{m_gi.group(1)}"
    m_fa = re.match(r'^(?:fa|fast|fastethernet)\s*([0-9]+/[0-9]+(?:\.[0-9]+)?)$', s, re.IGNORECASE)
    if m_fa:
        return f"FastEthernet{m_fa.group(1)}"
    m_eth = re.match(r'^(?:eth|ethernet)\s*([0-9]+/[0-9]+(?:\.[0-9]+)?)$', s, re.IGNORECASE)
    if m_eth:
        return f"Ethernet{m_eth.group(1)}"
    m_lo = re.match(r'^(?:lo|loop|loopback)\s*([0-9]+)$', s, re.IGNORECASE)
    if m_lo:
        return f"Loopback{m_lo.group(1)}"
    return s

EXEC_GRAMMAR = {
    "show": {
        "__desc__": "Show running system information",
        "ip": {
            "__desc__": "IP information",
            "route": {
                "__desc__": "IP routing table",
                "bgp": {"__desc__": "BGP routing table"},
                "ospf": {"__desc__": "OSPF routing table"},
                "connected": {"__desc__": "Connected routing table"},
                "static": {"__desc__": "Static routing table"},
                "__param__": {"__name__": "<network>", "__desc__": "Network to display", "__next__": {}}
            },
            "bgp": {
                "__desc__": "BGP information",
                "summary": {"__desc__": "One-line summary of BGP peer status"},
                "neighbors": {
                    "__desc__": "Detailed BGP neighbor information",
                    "__param__": {"__name__": "<ip-address>", "__desc__": "Neighbor IP address", "__next__": {}}
                },
                "__param__": {"__name__": "<network>", "__desc__": "Network to display", "__next__": {}}
            },
            "ospf": {
                "__desc__": "OSPF information",
                "neighbor": {
                    "__desc__": "OSPF neighbor information",
                    "detail": {"__desc__": "Detailed information"}
                },
                "interface": {
                    "__desc__": "OSPF interface information",
                    "__param__": {"__name__": "<interface>", "__desc__": "Interface name", "__next__": {}}
                }
            },
            "interface": {
                "__desc__": "IP interface status and configuration",
                "brief": {"__desc__": "Brief summary of IP status and configuration"},
                "__param__": {"__name__": "<interface>", "__desc__": "Interface name", "__next__": {}}
            },
            "protocols": {
                "__desc__": "IP routing protocol process information"
            },
            "access-lists": {
                "__desc__": "List IP access lists"
            }
        },
        "running-config": {
            "__desc__": "Current operating configuration",
            "interface": {"__desc__": "Interface configuration", "__param__": {"__name__": "<interface>", "__desc__": "Interface name", "__next__": {}}},
            "partition": {"__desc__": "Configuration partition"}
        },
        "version": {
            "__desc__": "System hardware and software status"
        },
        "route-map": {
            "__desc__": "route-map information",
            "__param__": {"__name__": "<route-map-name>", "__desc__": "Route-map name", "__next__": {}}
        },
        "interfaces": {
            "__desc__": "Interface status and configuration",
            "brief": {"__desc__": "Brief summary"},
            "__param__": {"__name__": "<interface>", "__desc__": "Interface name", "__next__": {}}
        }
    },
    "configure": {
        "__desc__": "Enter configuration mode",
        "terminal": {"__desc__": "Configure from the terminal"}
    },
    "ping": {
        "__desc__": "Send ICMP Echo requests",
        "__param__": {"__name__": "<ip-address>", "__desc__": "Target IP address", "__next__": {}}
    },
    "traceroute": {
        "__desc__": "Trace route to destination",
        "__param__": {"__name__": "<ip-address>", "__desc__": "Destination IP address", "__next__": {}}
    },
    "terminal": {
        "__desc__": "Set terminal line parameters",
        "length": {"__desc__": "Set number of lines on screen"},
        "width": {"__desc__": "Set width of the display terminal"}
    },
    "write": {
        "__desc__": "Write running configuration to memory or terminal",
        "memory": {"__desc__": "Write to NVRAM"},
        "terminal": {"__desc__": "Display configuration"}
    },
    "copy": {
        "__desc__": "Copy from one file to another",
        "running-config": {
            "__desc__": "Copy running config",
            "startup-config": {"__desc__": "Copy to startup config"}
        }
    },
    "exit": {"__desc__": "Exit from the EXEC"},
    "quit": {"__desc__": "Quit from the EXEC"},
    "enable": {"__desc__": "Turn on privileged commands"},
    "disable": {"__desc__": "Turn off privileged commands"},
    "clear": {
        "__desc__": "Reset functions",
        "ip": {
            "__desc__": "IP subcommands",
            "bgp": {
                "__desc__": "BGP subcommands",
                "*": {"__desc__": "All BGP peers", "soft": {"__desc__": "Soft reset"}},
                "__param__": {"__name__": "<ip-address>", "__desc__": "BGP peer", "__next__": {"soft": {"__desc__": "Soft reset"}}}
            }
        }
    }
}

CONFIG_GRAMMAR = {
    "interface": {
        "__desc__": "Select an interface to configure",
        "__param__": {"__name__": "<interface>", "__desc__": "Interface name (e.g. GigabitEthernet0/1)", "__next__": {}}
    },
    "router": {
        "__desc__": "Enable a routing process",
        "bgp": {
            "__desc__": "Border Gateway Protocol (BGP)",
            "__param__": {"__name__": "<1-65535>", "__desc__": "Autonomous system number", "__next__": {}}
        },
        "ospf": {
            "__desc__": "Open Shortest Path First (OSPF)",
            "__param__": {"__name__": "<1-65535>", "__desc__": "Process ID", "__next__": {}}
        }
    },
    "hostname": {
        "__desc__": "Set system's network name",
        "__param__": {"__name__": "<name>", "__desc__": "Hostname string", "__next__": {}}
    },
    "ip": {
        "__desc__": "Global IP configuration subcommands",
        "prefix-list": {
            "__desc__": "Build a prefix list",
            "__param__": {
                "__name__": "<list-name>",
                "__desc__": "Prefix list name",
                "__next__": {
                    "seq": {
                        "__desc__": "Sequence number",
                        "__param__": {
                            "__name__": "<1-4294967295>",
                            "__desc__": "Sequence number",
                            "__next__": {
                                "permit": {"__desc__": "Permit matching prefixes", "__param__": {"__name__": "<network/length>", "__desc__": "Prefix", "__next__": {}}},
                                "deny": {"__desc__": "Deny matching prefixes", "__param__": {"__name__": "<network/length>", "__desc__": "Prefix", "__next__": {}}}
                            }
                        }
                    },
                    "permit": {"__desc__": "Permit matching prefixes", "__param__": {"__name__": "<network/length>", "__desc__": "Prefix", "__next__": {}}},
                    "deny": {"__desc__": "Deny matching prefixes", "__param__": {"__name__": "<network/length>", "__desc__": "Prefix", "__next__": {}}}
                }
            }
        },
        "route": {
            "__desc__": "Establish static routes",
            "__param__": {"__name__": "<prefix>", "__desc__": "Destination prefix", "__next__": {"__param__": {"__name__": "<mask>", "__desc__": "Destination mask", "__next__": {"__param__": {"__name__": "<next-hop>", "__desc__": "Next hop IP", "__next__": {}}}}}}
        }
    },
    "route-map": {
        "__desc__": "Create route-map or enter route-map command mode",
        "__param__": {
            "__name__": "<map-name>",
            "__desc__": "Route map name",
            "__next__": {
                "permit": {"__desc__": "Route map permit", "__param__": {"__name__": "<1-65535>", "__desc__": "Sequence number", "__next__": {}}},
                "deny": {"__desc__": "Route map deny", "__param__": {"__name__": "<1-65535>", "__desc__": "Sequence number", "__next__": {}}}
            }
        }
    },
    "neighbor": {
        "__desc__": "Specify a BGP neighbor router (auto-enters router bgp)",
        "__param__": {
            "__name__": "<ip-address>",
            "__desc__": "Neighbor IP address",
            "__next__": {
                "remote-as": {"__desc__": "Specify remote AS", "__param__": {"__name__": "<1-65535>", "__desc__": "AS number", "__next__": {}}},
                "route-reflector-client": {"__desc__": "Configure a neighbor as Route Reflector client"},
                "route-map": {"__desc__": "Apply route-map to neighbor", "__param__": {"__name__": "<name>", "__desc__": "Route map name", "__next__": {"in": {"__desc__": "Inbound"}, "out": {"__desc__": "Outbound"}}}}
            }
        }
    },
    "no": {
        "__desc__": "Negate a command or set its defaults",
        "interface": {"__desc__": "Delete interface", "__param__": {"__name__": "<interface>", "__desc__": "Interface name", "__next__": {}}},
        "router": {
            "__desc__": "Remove routing process",
            "bgp": {"__desc__": "BGP process", "__param__": {"__name__": "<1-65535>", "__desc__": "AS number", "__next__": {}}},
            "ospf": {"__desc__": "OSPF process", "__param__": {"__name__": "<1-65535>", "__desc__": "Process ID", "__next__": {}}}
        },
        "ip": {
            "__desc__": "Remove IP setting",
            "prefix-list": {"__desc__": "Delete prefix list", "__param__": {"__name__": "<name>", "__desc__": "Prefix list name", "__next__": {}}}
        },
        "route-map": {"__desc__": "Delete route-map", "__param__": {"__name__": "<name>", "__desc__": "Route map name", "__next__": {}}}
    },
    "do": {"__desc__": "Execute an EXEC-level command from configuration mode"},
    "exit": {"__desc__": "Exit from configure mode"},
    "end": {"__desc__": "Exit to privileged EXEC mode"}
}

CONFIG_IF_GRAMMAR = {
    "ip": {
        "__desc__": "Interface IP commands",
        "address": {
            "__desc__": "Set interface IP address",
            "__param__": {"__name__": "<ip-address>", "__desc__": "IP address", "__next__": {"__param__": {"__name__": "<netmask>", "__desc__": "Subnet mask", "__next__": {}}}}
        },
        "mtu": {
            "__desc__": "Set IP MTU size",
            "__param__": {"__name__": "<bytes>", "__desc__": "MTU size in bytes (e.g. 1500)", "__next__": {}}
        },
        "ospf": {
            "__desc__": "OSPF interface commands",
            "mtu-ignore": {"__desc__": "Ignore MTU mismatch on this interface"}
        }
    },
    "mtu": {
        "__desc__": "Set MTU size",
        "__param__": {"__name__": "<bytes>", "__desc__": "MTU size in bytes (e.g. 1500)", "__next__": {}}
    },
    "shutdown": {"__desc__": "Shutdown the selected interface"},
    "no": {
        "__desc__": "Negate a command or set its defaults",
        "shutdown": {"__desc__": "Restart the interface"},
        "ip": {
            "__desc__": "Negate IP settings",
            "ospf": {
                "__desc__": "OSPF settings",
                "mtu-ignore": {"__desc__": "Re-enable MTU checking on this interface"}
            }
        }
    },
    "description": {
        "__desc__": "Interface specific description",
        "__param__": {"__name__": "<line>", "__desc__": "Description text", "__next__": {}}
    },
    "do": {"__desc__": "Execute an EXEC-level command from configuration mode"},
    "exit": {"__desc__": "Exit from interface configuration mode"},
    "end": {"__desc__": "Exit to privileged EXEC mode"}
}

CONFIG_ROUTER_GRAMMAR = {
    "neighbor": {
        "__desc__": "Specify a neighbor router",
        "__param__": {
            "__name__": "<ip-address>",
            "__desc__": "Neighbor IP address",
            "__next__": {
                "remote-as": {
                    "__desc__": "Specify remote AS number",
                    "__param__": {"__name__": "<1-65535>", "__desc__": "Autonomous system number", "__next__": {}}
                },
                "route-reflector-client": {
                    "__desc__": "Configure a neighbor as Route Reflector client"
                },
                "route-map": {
                    "__desc__": "Apply route-map to neighbor",
                    "__param__": {"__name__": "<name>", "__desc__": "Route map name", "__next__": {"in": {"__desc__": "Apply to incoming routes"}, "out": {"__desc__": "Apply to outgoing routes"}}}
                },
                "activate": {"__desc__": "Enable address family for this neighbor"}
            }
        }
    },
    "network": {
        "__desc__": "Specify a network to announce",
        "__param__": {
            "__name__": "<network-number>",
            "__desc__": "Network number (e.g. 172.16.10.0 or 10.0.0.0)",
            "__next__": {
                "mask": {
                    "__desc__": "Network mask",
                    "__param__": {"__name__": "<netmask>", "__desc__": "Network mask (e.g. 255.255.255.0)", "__next__": {}}
                },
                "area": {
                    "__desc__": "Set the OSPF area ID",
                    "__param__": {"__name__": "<area-id>", "__desc__": "OSPF area (e.g. 0)", "__next__": {}}
                },
                "__param__": {
                    "__name__": "<wildcard-bits>",
                    "__desc__": "OSPF wildcard bits (e.g. 0.0.0.3)",
                    "__next__": {
                        "area": {
                            "__desc__": "Set the OSPF area ID",
                            "__param__": {"__name__": "<area-id>", "__desc__": "OSPF area (e.g. 0)", "__next__": {}}
                        }
                    }
                }
            }
        }
    },
    "address-family": {
        "__desc__": "Enter Address Family command mode",
        "ipv4": {
            "__desc__": "Address Family IPv4",
            "unicast": {"__desc__": "Address Family IPv4 Unicast"}
        }
    },
    "router-id": {
        "__desc__": "Manually configure the router-id",
        "__param__": {"__name__": "<ip-address>", "__desc__": "Router-id IP address", "__next__": {}}
    },
    "no": {
        "__desc__": "Negate a command or set its defaults",
        "neighbor": {
            "__desc__": "Remove neighbor configuration",
            "__param__": {
                "__name__": "<ip-address>",
                "__desc__": "Neighbor IP address",
                "__next__": {
                    "route-reflector-client": {"__desc__": "Remove route-reflector-client"}
                }
            }
        }
    },
    "do": {"__desc__": "Execute an EXEC-level command from configuration mode"},
    "exit": {"__desc__": "Exit from routing process configuration mode"},
    "end": {"__desc__": "Exit to privileged EXEC mode"}
}

CONFIG_ROUTER_AF_GRAMMAR = {
    "neighbor": {
        "__desc__": "Specify a neighbor router",
        "__param__": {
            "__name__": "<ip-address>",
            "__desc__": "Neighbor IP address",
            "__next__": {
                "route-reflector-client": {"__desc__": "Configure a neighbor as Route Reflector client"},
                "route-map": {"__desc__": "Apply route-map", "__param__": {"__name__": "<name>", "__desc__": "Route map name", "__next__": {"out": {"__desc__": "Outbound"}, "in": {"__desc__": "Inbound"}}}},
                "activate": {"__desc__": "Enable address family for this neighbor"}
            }
        }
    },
    "network": {
        "__desc__": "Specify a network to announce",
        "__param__": {
            "__name__": "<network-number>",
            "__desc__": "Network number",
            "__next__": {
                "mask": {
                    "__desc__": "Network mask",
                    "__param__": {"__name__": "<netmask>", "__desc__": "Network mask", "__next__": {}}
                }
            }
        }
    },
    "do": {"__desc__": "Execute an EXEC-level command from configuration mode"},
    "exit": {"__desc__": "Exit from address-family configuration mode"},
    "end": {"__desc__": "Exit to privileged EXEC mode"}
}

MODE_GRAMMARS = {
    "exec": EXEC_GRAMMAR,
    "config": CONFIG_GRAMMAR,
    "config-if": CONFIG_IF_GRAMMAR,
    "config-router": CONFIG_ROUTER_GRAMMAR,
    "config-router-af": CONFIG_ROUTER_AF_GRAMMAR
}

def get_grammar_for_mode(mode: str) -> Dict[str, Any]:
    return MODE_GRAMMARS.get(mode, EXEC_GRAMMAR)

def find_candidate_keywords(current_dict: Dict[str, Any]) -> List[Tuple[str, str]]:
    """Returns [(keyword, description)] for available keywords in current dict node."""
    res = []
    for k, v in current_dict.items():
        if not k.startswith("__"):
            desc = v.get("__desc__", "") if isinstance(v, dict) else ""
            res.append((k, desc))
    if "__param__" in current_dict:
        param = current_dict["__param__"]
        res.append((param.get("__name__", "<value>"), param.get("__desc__", "parameter value")))
    return sorted(res, key=lambda x: x[0])

def match_token(token: str, current_dict: Dict[str, Any]) -> Tuple[Optional[str], Optional[Dict[str, Any]], Optional[str]]:
    """
    Attempts to match a token against current grammar node.
    Returns: (canonical_keyword, next_dict, error_msg)
    """
    if not token:
        return None, None, None

    # Check direct alias
    alias = COMMON_ALIASES.get(token.lower())
    
    # Check if interface abbreviation (e.g. gi0/1, lo0)
    norm_iface = normalize_interface_name(token)
    if norm_iface != token and "__param__" in current_dict:
        param = current_dict["__param__"]
        return norm_iface, param.get("__next__", {}), None

    keywords = [k for k in current_dict.keys() if not k.startswith("__")]

    # 1. Exact match
    for k in keywords:
        if k.lower() == token.lower():
            return k, current_dict[k], None

    # 2. Alias match
    if alias:
        for k in keywords:
            if k.lower() == alias.lower():
                return k, current_dict[k], None

    # 3. Prefix match
    matches = [k for k in keywords if k.lower().startswith(token.lower())]
    if len(matches) == 1:
        matched_k = matches[0]
        return matched_k, current_dict[matched_k], None
    elif len(matches) > 1:
        # Check if one of them is the alias
        if alias and alias in matches:
            return alias, current_dict[alias], None
        return None, None, f"% Ambiguous command: \"{token}\""

    # 4. Check parameter
    if "__param__" in current_dict:
        param = current_dict["__param__"]
        return token, param.get("__next__", {}), None

    return None, None, None

def expand_abbreviations(cmd_line: str, mode: str = "exec") -> Tuple[str, Optional[str]]:
    """
    Expands an abbreviated Cisco IOS command into its canonical form.
    E.g. 'sh ip ro' -> 'show ip route', 'conf t' -> 'configure terminal'
    Returns: (expanded_command, error_or_warning)
    """
    raw = cmd_line.strip()
    if not raw or raw in ["?", "help"]:
        return raw, None

    # Preserve pipe clauses
    pipe_suffix = ""
    if "|" in raw:
        parts = raw.split("|", 1)
        raw = parts[0].strip()
        pipe_suffix = " | " + parts[1].strip()

    # Handle 'do <cmd>'
    is_do = False
    effective_mode = mode
    if mode != "exec" and raw.lower().startswith("do "):
        is_do = True
        raw = raw[3:].strip()
        effective_mode = "exec"

    grammar = get_grammar_for_mode(effective_mode)
    tokens = raw.split()
    expanded_tokens = []
    current_dict = grammar

    for idx, token in enumerate(tokens):
        # Once current_dict is empty, remaining tokens are parameters (IPs, masks, etc.)
        if not current_dict:
            # Normalize interface if applicable
            expanded_tokens.append(normalize_interface_name(token))
            continue

        canonical, next_dict, err = match_token(token, current_dict)
        if err:
            return cmd_line, err

        if canonical:
            expanded_tokens.append(canonical)
            current_dict = next_dict or {}
        else:
            # If not matched in grammar, keep original token (could be custom param or pass-through)
            expanded_tokens.append(token)
            if "__param__" in current_dict:
                current_dict = current_dict["__param__"].get("__next__", {})
            else:
                current_dict = {}

    expanded = " ".join(expanded_tokens)
    if is_do:
        expanded = f"do {expanded}"
    if pipe_suffix:
        expanded = f"{expanded}{pipe_suffix}"

    return expanded, None

def tab_complete(line: str, mode: str = "exec", available_interfaces: Optional[List[str]] = None) -> Tuple[str, List[str]]:
    """
    Implements Cisco IOS word-by-word Tab auto-completion.
    Returns: (new_line, candidate_matches)
    """
    is_do = False
    effective_mode = mode
    working_line = line

    if mode != "exec" and working_line.lower().startswith("do "):
        is_do = True
        working_line = working_line[3:]
        effective_mode = "exec"

    grammar = get_grammar_for_mode(effective_mode)
    
    # Check if line ends with a space (completing the next word)
    ends_with_space = working_line.endswith(" ")
    tokens = working_line.strip().split() if working_line.strip() else []

    if not tokens:
        # User pressed tab on empty line: candidate top-level commands
        candidates = [k for k in grammar.keys() if not k.startswith("__")]
        return line, sorted(candidates)

    current_dict = grammar
    matched_tokens = []

    # Walk tokens up to second-to-last (or last if ends_with_space)
    walk_tokens = tokens if ends_with_space else tokens[:-1]
    for t in walk_tokens:
        canonical, next_dict, _ = match_token(t, current_dict)
        if canonical:
            matched_tokens.append(canonical)
            current_dict = next_dict or {}
        else:
            matched_tokens.append(t)
            if "__param__" in current_dict:
                current_dict = current_dict["__param__"].get("__next__", {})
            else:
                current_dict = {}

    last_token = "" if ends_with_space else tokens[-1]
    
    # Get available keywords at this level
    keywords = [k for k in current_dict.keys() if not k.startswith("__")]
    
    # If parameter expects an interface, add available interfaces from lab
    if "__param__" in current_dict and "<interface>" in current_dict["__param__"].get("__name__", ""):
        if available_interfaces:
            keywords.extend(available_interfaces)
        else:
            keywords.extend(["GigabitEthernet0/1", "GigabitEthernet0/2", "Loopback0"])

    # Prefix match against last_token
    matches = []
    if last_token:
        # Check alias
        alias = COMMON_ALIASES.get(last_token.lower())
        for k in keywords:
            if k.lower().startswith(last_token.lower()):
                matches.append(k)
        if not matches and alias:
            for k in keywords:
                if k.lower().startswith(alias.lower()):
                    matches.append(k)
    else:
        matches = keywords

    matches = sorted(list(set(matches)))

    # Compute completion
    prefix = ("do " if is_do else "") + (" ".join(matched_tokens) + " " if matched_tokens else "")

    if len(matches) == 1:
        completed = prefix + matches[0] + " "
        return completed, matches
    elif len(matches) > 1:
        # Common prefix among matches
        common = matches[0]
        for m in matches[1:]:
            while not m.lower().startswith(common.lower()) and len(common) > len(last_token):
                common = common[:-1]
        completed = prefix + common
        return completed, matches

    # No match, return original line
    return line, []

def get_help(line: str, mode: str = "exec", available_interfaces: Optional[List[str]] = None) -> str:
    """
    Generates Cisco IOS '?' context-sensitive help output.
    """
    effective_mode = mode
    working_line = line
    if mode != "exec" and working_line.lower().startswith("do "):
        working_line = working_line[3:]
        effective_mode = "exec"

    grammar = get_grammar_for_mode(effective_mode)
    ends_with_space = working_line.endswith(" ")
    tokens = working_line.strip().split() if working_line.strip() else []

    current_dict = grammar
    walk_tokens = tokens if ends_with_space else tokens[:-1]

    for t in walk_tokens:
        canonical, next_dict, _ = match_token(t, current_dict)
        if canonical:
            current_dict = next_dict or {}
        elif "__param__" in current_dict:
            current_dict = current_dict["__param__"].get("__next__", {})
        else:
            current_dict = {}

    last_token = "" if ends_with_space else (tokens[-1] if tokens else "")
    candidates = find_candidate_keywords(current_dict)

    if last_token:
        candidates = [c for c in candidates if c[0].lower().startswith(last_token.lower())]

    if not candidates:
        return "% Unrecognized command or parameter"

    lines = []
    max_len = max(len(c[0]) for c in candidates) if candidates else 12
    col_width = max(max_len + 2, 14)

    for kw, desc in candidates:
        lines.append(f"  {kw:<{col_width}} {desc}")

    return "\n".join(lines)
