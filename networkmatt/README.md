# networkmatt

A simulation-first starter for an observe-first Raspberry Pi network appliance.

## Prototype hardware target

- Router appliance: **Raspberry Pi 5 Model B, 8 GB**.
- Network expansion: provisional **Waveshare PCIe to 4-CH 2.5G Ethernet Board (B)**. It uses the Pi 5 PCIe Gen 2 x1 path, so aggregate throughput is shared and must be measured. The board is a lab prototype choice, not a production qualification.
- Touch console: keep the separately network-connected touchscreen console from the product spec for now; its service link must terminate on a dedicated appliance port.
- Storage: USB 3 SSD for the first prototype; use durable storage and power-loss testing before production.

Raspberry Pi 5 provides one onboard Gigabit Ethernet port and a PCIe Gen 2 x1 connector. OpenWrt lists Pi 5 support, but this code currently targets ordinary 64-bit Linux/Python and does not install or configure OpenWrt. See the hardware decision in `HARDWARE.md` for sources and caveats.

## Current code boundary

This starter only:

- exposes a loopback-only HTTP API and touch-friendly local status page;
- accepts a bounded KEV-style JSON analysis report;
- distinguishes observed data and unknowns;
- creates a **simulated** passive candidate when evidence is present;
- models capture pause/resume and passive review/approval in memory.

It does **not** capture packets, configure Linux interfaces, configure OSPF, SSH to switches, apply device configuration, or perform rollback. The passive approval endpoint only changes the in-memory demo state. Do not expose this service on a network; the Pi-to-console authenticated service link is not implemented yet.

## Run

With Python 3.11 or later:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
networkmatt
```

Open `http://127.0.0.1:8765/`. The server binds to loopback only.

To provide analyzer output, POST a JSON object matching the example in `fixtures/kev-ospf-observation.json` to `http://127.0.0.1:8765/v1/analysis`. The UI then enables candidate review.

## Planned next slices

1. Pick/record actual NIC hardware IDs and verify interface naming on the Pi image.
2. Add the isolated `NETWORKMATT-OOBM` VLAN and interface-role mapping, with conflict checks for provisional VID 3175.
3. Add a read-only capture adapter and actual KEV process/file handoff.
4. Add paired console authentication and the Pi touchscreen remote UI channel.
5. Design vendor adapters only after the baseline hardware and switch bootstrap path are fixed.
