# networkmatt — Initial Product Spec

**Status:** Draft for review  
**Purpose:** Establish the product intent and safe first prototype boundary before implementation.

## Product concept

networkmatt is a voice-first network appliance that helps an engineer bring a router or switch into a local network. It boots to a conversational prompt rather than requiring keyboard-driven setup. On first boot, it asks no setup questions. It detects connected interfaces and listens to an authorized live capture source, then reports on demand whether it understands enough of the network to prepare a configuration. When it has sufficient evidence, it offers a passive candidate config for on-screen review.

The appliance begins in **unmanaged mode**: it is usable without joining a routing domain or changing the network. An engineer can later **promote** it to participate in a specified network role, such as joining OSPF Area 0, through a reviewable approval flow.

## Core workflow

1. **Boot and discover.** Start without onboarding questions. Detect connected physical and logical interfaces and their link state. Begin only the authorized, read-only capture behavior configured for the device.
2. **Observe and analyze.** KEV bots analyze bounded live-stream windows and return schema-validated JSON findings. Hermes coordinates analysis and explains the resulting evidence when asked.
3. **Report readiness on demand.** When prompted, report whether the available evidence is sufficient to understand the network for the requested role. Clearly separate observed facts, inferences, unknowns, and confidence.
4. **Create passive candidate.** If enough is understood, prepare a passive configuration candidate and present it on the screen. If not, explain what is missing and continue observation; do not force an initial questionnaire.
5. **Review and enable passive mode.** The user reviews the candidate and can select **Yes** on screen to apply it in passive mode. Show the configured state and observed passing traffic. Passive mode must not originate routing advertisements or form routing adjacencies.
6. **Pause and discuss.** The user can pause capture at any time, then speak to networkmatt about requested changes. The agent prepares a new candidate without silently applying it.
7. **Approve and stage.** Show the exact candidate, affected interfaces, expected impact, recovery behavior, and change/ticket/changelog reference. After explicit approval, save a rollback checkpoint and enter staged mode by applying the approved candidate.
8. **Monitor or rollback.** While staged, show traffic and device status. A recognized “rollback” voice command immediately exits staged mode and restores the most recent saved configuration. Keep at most three rollback versions. If no prior version exists, stop staged operation and guide the user through review of the initial configuration; do not imply a previous state can be restored.
9. **Verify and record.** Record approval, reference, candidate identity, application, observed result, and rollback or verification outcome.
## Operating modes

### Unmanaged / observation mode (default)

- First boot asks no questions; it discovers connected interfaces and listens only on the authorized capture source.
- It does not advertise routes, form routing adjacencies, or alter other network equipment.
- Capture is observational. The device does not forward the observed traffic.
- On request, it reports whether evidence is sufficient and can prepare a passive candidate for on-screen review.
- The user can pause capture and converse about changes at any time.

### Passive configured mode

- Entered only after the user reviews and selects **Yes** on screen for the passive candidate.
- Applies only the reviewed configuration needed for passive operation and displays device status and passing traffic.
- Does not originate routing advertisements or form routing adjacencies.

### Staged mode

- Entered only after explicit approval of an exact candidate, with a ticket/change reference when required by organization policy.
- Saves a recovery checkpoint before applying the approved configuration.
- Maintains a rolling history of at most three saved rollback versions.
- A recognized spoken “rollback” command exits staged mode and restores the latest available saved version immediately.
- If there is no previous version, explains that rollback is unavailable and guides review of the initial configuration and recovery options.
- Logs the command, target version, restoration result, and any remaining recovery steps.

## OOBM VLAN policy

- Product label: `NETWORKMATT-OOBM`. Provisional default VID: **3175**. This is a starting convention for networkmatt-managed lab networks, not a globally unique or guaranteed-unused assignment.
- Do not use VLAN 1, common examples such as VLAN 99, or VLAN 777 as the product default. Search results show VLAN 777 used in vendor management examples, so it does not meet the uncommon-default goal.
- Before proposing the default on a target switch, check platform-supported VLAN ranges, vendor/internal reserved IDs, and the current switch configuration for collisions. A detected collision or unsupported ID requires an explicit alternative; do not silently take over an existing VLAN.
- Keep the VLAN local to the isolated networkmatt management domain. Do not extend it to other trunks or route it into the user network unless an engineer explicitly approves that scope. Use a non-overlapping, deployment-specific IP subnet as well.
- VLAN IDs are local identifiers, not globally registered names or security controls. A VLAN ID that appears uncommon in public documentation can already be in use in a private network.

## Virtual interfaces and remote engineer access

networkmatt should support logical/virtual network interfaces as part of its device model and candidate configuration. The first supported types must be selected for the target platform; candidates may include VLAN interfaces / SVIs, loopbacks, and tunnel interfaces. The planner must represent parent interface, VLAN or tunnel parameters, addressing, routing role, and dependencies explicitly, and show those relationships in the reviewable candidate.

The device should also provide a way for a network engineer to connect remotely using PuTTY or a compatible client. Treat this as a separate management-access capability, not as the packet-capture interface itself. The initial preference is SSH on a specifically designated management interface or address, with authentication and authorization policy defined before implementation. Plaintext Telnet should not be enabled by default. Remote sessions must be audited and must not bypass the same candidate review, approval, change-reference, and promotion controls used by voice interaction.

If a virtual interface is intended to carry management access, the engineer must explicitly designate it, and the system must confirm reachability and recovery access before applying a change that could disconnect the session.

## Hardware topology and touchscreen driver spec

### Proposed lab topology

- **networkmatt router appliance:** a Raspberry Pi 5 Model B, 8 GB RAM, runs the networkmatt appliance OS and agent services. It is configured first and provides the initial networkmatt management network. The Pi has one onboard Gigabit Ethernet port, so a tested multi-port Ethernet expansion board is required to separate console, OOBM, capture, and uplink roles.
- **Touch console:** a Raspberry Pi runs the touchscreen UI and connects by RJ45 to a dedicated service/console Ethernet port on the networkmatt appliance. The Pi and display are a control surface; they do not run privileged network configuration logic.
- **Whitebox switch:** connects to a separate networkmatt management/target port on an isolated `NETWORKMATT-OOBM` VLAN. Provisional default VID: **3175**, subject to target-platform support and conflict checks. Once networkmatt has configured its own router-side network, it discovers/reaches the switch and connects to its management IP using SSH.
- **Capture source:** a separate NIC or explicitly selected interface receives the live capture stream or a switch mirror/SPAN feed. It is not bridged into the console or management plane.

```text
[Raspberry Pi + touch display]
            | dedicated Ethernet service link
            v
[networkmatt Raspberry Pi 5 / router]
       | management/target link       | capture-only NIC
       v                              v
[whitebox switch management]     [SPAN/TAP/live capture source]
       |
       +-- networkmatt SSH client -> switch SSH server
```

The console service link, switch management network, and packet capture path must be separate logical interfaces. A lab may implement separation with physical NICs or isolated VLANs, but must not accidentally bridge the touchscreen link or capture port into the user network. The OOBM VLAN is limited to the networkmatt management interface and the managed switch management interface; it is not carried to user-facing ports or uplinks by default. VLAN separation is not itself an authorization boundary: restrict management protocols and routing independently.

### Touchscreen hardware and driver boundary

**Prototype recommendation:** Raspberry Pi as the touchscreen host, paired with a supported capacitive DSI touchscreen such as Raspberry Pi Touch Display 2. Its display and touch data use a local DSI ribbon connection and GPIO power; the Pi then uses its Ethernet jack as the RJ45 control link to networkmatt. This matches the requirement that the console can plug into the appliance while avoiding a custom screen driver. Raspberry Pi documents Touch Display 2 support for Pi boards, multitouch, and on-screen keyboard support. [Raspberry Pi Touch Display 2 docs](https://www.raspberrypi.com/documentation/accessories/touch-display-2.html)

An Arduino-class board is a possible later low-cost button/status controller, but is not the preferred host for this full-screen conversational interface: the UI needs a maintainable display stack, network client, audio support, and secure updates. Arduino GIGA Display Shield has a small touch display and microphone but requires a GIGA R1 WiFi board and is oriented toward embedded UI development. [Arduino GIGA Display Shield](https://docs.arduino.cc/hardware/giga-display-shield)

Initial driver requirements:

- Use upstream Raspberry Pi OS/Linux kernel display, DSI, touch-input, Ethernet, and audio drivers wherever supported; do not write a custom kernel driver for the first prototype.
- Select a Raspberry Pi 5 Ethernet expansion board with stable Linux kernel driver support. Use distinct, explicitly mapped interfaces for console, target management, capture, and uplink roles; fail closed if hardware/interface mapping is ambiguous, and never bridge the capture interface by default. The expansion ports share the Pi 5 PCIe link, so aggregate throughput and packet loss must be measured.
- Run the kiosk UI in a locked-down session with touch input through the OS input stack. Provide large touch targets for status, pause/resume capture, review candidate, approve, and emergency rollback.
- The Pi communicates with a narrow networkmatt console API over the dedicated Ethernet service link. The API exposes status, capture pause/resume, candidate review, and approval actions only; no shell or raw device-configuration endpoint.
- Authenticate the console link with device pairing and mutually authenticated TLS or an equivalent per-device credential scheme. Provision credentials during controlled setup; reject unknown consoles and rotate/revoke lost-device credentials.
- If the console link drops, capture and network state remain governed by the appliance; no approval or configuration action is inferred from disconnection.
- Add watchdog/restart behavior and a visible link/health indicator. A failed touch console must not interrupt packet capture, routing state, or rollback handling on the appliance.
- Maintain a tested compatibility matrix for Pi model, display revision, kernel/OS image, Ethernet adapter, microphone/speaker hardware, and supported touch events.

### Router-first and switch-onboarding sequence

1. Boot the Raspberry Pi 5 networkmatt appliance and initialize its local interfaces in unmanaged/observation mode.
2. Connect the Raspberry Pi console over the dedicated service port; show appliance health, discovered ports, capture state, and readiness status.
3. Prepare and review the appliance/router's passive configuration. A user touch on **Yes** applies that reviewed passive configuration.
4. Bring up the isolated networkmatt management/target network for the attached whitebox switch.
5. Discover the switch management endpoint and establish SSH using credentials supplied or provisioned by the engineer. Never assume vendor default credentials.
6. Read and summarize switch state, then prepare a separate switch candidate. Require its own candidate review, change reference policy, and approval before applying changes.
7. Verify switch access and resulting state; keep the router and switch candidates, approvals, and rollback versions distinct in the audit trail.

Initial switch reachability is a prerequisite: an unconfigured switch cannot be assumed to already participate in the new OOBM VLAN. The prototype must document how the whitebox switch receives an initial management IP and SSH host key (factory-preconfigured management port/subnet, console/bootstrap cable, or another controlled method) before networkmatt can automate it. The bootstrap method remains an open decision. After authenticated access, networkmatt may establish the OOBM VLAN and move management access only after verifying the new path and preserving a recovery path.

## Agent and component responsibilities

| Component | Responsibility | Authority boundary |
|---|---|---|
| Voice interaction | Gather intent, explain findings, ask follow-up questions | Cannot directly change device configuration |
| KEV analyzers | Fast, bounded analysis of live stream segments or PCAP data; emit small JSON results | Analysis only; no configuration writes |
| Hermes agent | Coordinate conversation, select analysis workflows, explain evidence, request missing input | Calls narrow tools; no unrestricted network-device shell access |
| Capture service | Provide authorized packet observations to analyzers | Read-only capture; minimize and bound retained data |
| Config planner / validator | Convert approved intent and structured evidence into candidate config; validate platform constraints | Produces a candidate; does not activate it |
| Approval / promotion service | Bind human approval and change reference to an exact candidate | Rejects stale or changed candidates; requires re-approval after material edits |
| Device adapter | Apply an approved candidate and query operational state | Narrow, typed operations; supports recovery/rollback where hardware permits |
| Audit log | Link observations, decisions, candidate, reference, application, and verification | Append-only or tamper-evident where feasible |

## KEV result contract (illustrative)

KEV output should be compact, machine-readable, versioned, and evidence-linked. Example:

```json
{
  "schema_version": "1",
  "analysis_id": "capture-window-001",
  "protocol": "ospf",
  "observations": [
    {
      "field": "hello_interval_seconds",
      "value": 10,
      "confidence": 0.99,
      "evidence": [{"capture_id": "pcap-001", "packet_numbers": [14, 18, 22]}]
    },
    {
      "field": "area_id",
      "value": "0.0.0.0",
      "confidence": 0.99,
      "evidence": [{"capture_id": "pcap-001", "packet_numbers": [14, 18, 22]}]
    }
  ],
  "unknowns": ["authentication configuration"],
  "inferences": [],
  "capture_window": {"start": "2026-10-29T00:00:00Z", "end": "2026-10-29T00:00:30Z"}
}
```

The application must validate KEV JSON against a versioned schema and treat analyzer output as evidence, not as executable instructions. Never invent observed values when the packet data does not support them.

## Approval record

An approval is bound to a digest or immutable version of the candidate configuration and includes:

- Change/ticket/changelog reference (mandatory when policy requires it)
- Human approver identity and approval timestamp
- Intended device, protocol, area, interfaces, and role
- Candidate configuration/version and its digest
- Summary of expected impact and known risks
- Validation results and unresolved assumptions
- Application result, post-change verification, and rollback reference

Any material candidate change after approval invalidates that approval. A rollback command is a recovery action and must not require navigating the screen; voice recognition must be locally available while staged. The exact voice-trigger confidence, speaker authorization, and protection against accidental or unauthorized rollback are product security decisions.

## Initial prototype scope

### In scope

- Observe-first boot with no onboarding questions; on-demand readiness status and on-screen passive-candidate review.
- Voice discussion after capture is paused, on-screen approval to enter passive configured mode, and spoken rollback from staged mode.
- A maximum-three-version rollback history with first-configuration recovery behavior.
- One controlled packet-analysis path supporting supplied PCAP and/or authorized live capture.
- One protocol workflow, initially OSPF; choose OSPFv2 or OSPFv3 during technical discovery.
- A lab topology with the Raspberry Pi 5 appliance configured first, a Raspberry Pi touchscreen console on a dedicated service port, and one whitebox switch reachable over the isolated `NETWORKMATT-OOBM` VLAN (provisional VID 3175) for SSH-based read/plan/apply workflows.
- KEV JSON schema and validation.
- Hermes orchestration for dialogue and follow-up questions.
- Candidate configuration generation, preview, approval record with change reference, and audit trail.
- Simulated or lab-only application and verification before any production deployment.
- Development in isolated Git worktrees for independent components; integrate only after reviewing each diff.

### Out of scope for the first prototype

- Transparent inline forwarding or bridge mode.
- Autonomous production configuration changes without explicit human approval.
- Broad multi-vendor support before a first device/platform is selected.
- Storing full packet payloads by default.
- Treating packet contents, PCAP metadata, or agent-generated text as trusted commands.
- Autonomous promotion to Area 0 or other routing domains.

## Safety and reliability requirements

- Capture source and scope are explicitly configured and visible; minimize retention and provide a clear retention/deletion policy. Boot must not initiate an unauthorized capture.
- Treat packet-derived content as untrusted input. It must not be able to inject instructions into Hermes or KEV workflows.
- Separate observe, plan, approve, apply, and verify permissions. Passive-candidate approval and staged-change approval are distinct transitions.
- Begin with read-only analysis and lab simulation. Apply actions through narrow, typed adapters with preconditions and bounded change sets.
- Present the exact candidate and network impact before approval.
- Require explicit re-approval if the candidate, target interfaces, or intended routing role changes.
- Verify post-change state and provide a rehearsed rollback procedure before production readiness. Maintain no more than three saved rollback versions and report clearly when no prior version exists.
- Do not claim an observation or test was performed unless there is an auditable result.

## Worktree-based development plan

1. **Spec and architecture:** finalize product contract, system boundaries, and first target hardware/platform.
2. **Capture and KEV contract:** implement a fixture-driven analyzer interface and schema in an isolated worktree.
3. **Conversation and voice UI:** implement the boot-to-prompt interaction and Hermes orchestration separately.
4. **Config planning and approval:** implement candidate generation, change-reference policy, approval binding, and audit records.
5. **Lab adapter:** implement one platform adapter with simulation, apply, verification, and rollback in a separate worktree.
6. **Integration:** review diffs, merge the accepted work into an integration branch, and validate end-to-end in a lab network before expanding scope.

Worktrees isolate development changes; they do not replace the product's runtime safety controls or operational change-management process.

## Open decisions before implementation

1. What hardware class and base operating system should the first appliance target?
2. Which first network platform/vendor and configuration interface should the prototype support?
3. Should the first analysis input be offline PCAP, live capture, or both?
4. Which protocol/version is first: OSPFv2, OSPFv3, or another discovery protocol?
5. Which voice engine and model deployment are acceptable (local, hosted, or configurable)?
6. What should the product do when capture is unavailable or packet fields are ambiguous?
7. What approval identity and ticket/changelog formats must integrate with the first organization?
8. What is the capture retention policy and where may packet-derived data be processed?
9. What rollback mechanism does the target hardware provide, and how is out-of-band recovery handled?
10. Which logical interfaces are required first (for example, VLAN/SVI, loopback, or tunnel)?
11. Should engineers connect using SSH to a dedicated management address, a designated virtual interface, or both? What identity/authentication and role policies apply?
12. Confirm Raspberry Pi 5 Model B 8 GB and select the exact tested Ethernet expansion board, storage, power supply, cooling, and touch-console model.
13. How will the whitebox switch receive its initial management IP, SSH credentials, and trusted host key?
14. Should the touchscreen connect to a dedicated physical service port or a dedicated isolated VLAN on a shared port?
15. Confirm VID 3175 as the provisional `NETWORKMATT-OOBM` default or choose another product default after reviewing target hardware support.

## Acceptance criteria for the first lab demonstration

- Device boots without asking onboarding questions, detects connected interfaces, and begins only authorized passive observation.
- Raspberry Pi touchscreen connects over the dedicated service link, displays appliance status, and cannot invoke arbitrary shell or configuration commands.
- Failure or removal of the touchscreen does not interrupt capture, routing state, or appliance rollback behavior.
- The appliance is configured first; it can then establish authorized SSH access to the lab switch after the switch bootstrap prerequisites are met.
- On request, the device reports whether it has sufficient network evidence to prepare a config.
- Selecting **Yes** on the reviewed passive candidate applies passive settings, displays device status and observed passing traffic, and does not form an OSPF adjacency.
- Given an authorized capture containing OSPF traffic, the analyzer returns schema-valid JSON with evidence references and explicit unknowns.
- The conversational agent explains what was observed versus inferred and asks for missing values rather than fabricating them.
- The planner presents a candidate config without applying it.
- Staged configuration cannot be applied without approval of the exact candidate and the configured change-reference policy.
- While staged, a recognized voice rollback command exits staged mode and restores the latest saved version; the history never exceeds three versions.
- With no previous saved version, the device explains the limitation and guides review of the initial configuration rather than claiming rollback succeeded.
- The approval binds to the exact candidate; changing the candidate invalidates approval.
- The lab adapter reports the applied state and verification evidence, and demonstrates a documented rollback.
- Development changes are integrated from isolated worktrees with reviewable diffs.

## Terminology

- **Unmanaged / observation mode:** default startup state; discovers interfaces and observes the configured capture source without participating in routing.
- **Passive configured mode:** applies a user-reviewed local configuration while avoiding routing adjacencies and advertisements.
- **Staged mode:** applies an explicitly approved configuration while maintaining up to three rollback versions.
- **Passive observation:** analysis of a live capture stream or supplied PCAP; the appliance is not forwarding the observed traffic.
- **KEV bot:** a small analyzer that inspects captured data and emits a compact JSON result.
- **Hermes agent:** the conversational/orchestration agent that coordinates workflows and gathers missing requirements.



