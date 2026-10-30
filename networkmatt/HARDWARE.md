# Prototype hardware decision

## Selected router target

**Raspberry Pi 5 Model B, 8 GB RAM** is the first code and lab target. It is available, has an official 64-bit Linux stack, a built-in Gigabit Ethernet port, and a PCIe Gen 2 x1 connector. The 8 GB model is intended to host networkmatt services, voice/UI coordination, and small analyzer handoff; it is not intended to run a large language model locally.

### Port layout

The product needs distinct logical roles:

- `console`: dedicated Ethernet service port for the touch console;
- `oobm`: isolated `NETWORKMATT-OOBM` management VLAN (provisional VID 3175);
- `capture`: read-only live packet source / switch mirror feed;
- `uplink`: network connection used by the router role.

The Pi 5’s built-in Ethernet plus a four-port PCIe Ethernet expansion board can provide these roles for a lab prototype. Explicitly bind roles to stable hardware identifiers (MAC/PCI path), not `eth0` numbering alone. Never bridge `capture` into another role by default. The four 2.5GbE links share the Pi's PCIe Gen 2 x1 link, so the HAT does not provide four independent full-rate 2.5Gbps paths.

### Provisional expansion board

**Waveshare PCIe to 4-CH 2.5G ETH Board (B)** is a provisional lab choice because it offers four RJ45 ports for Raspberry Pi 5 and is advertised for Raspberry Pi OS without a separate driver install. Before relying on it, record the exact board revision and NIC chipset, confirm kernel-driver binding on the chosen OS image, test reboots/link renumbering, and measure capture loss and aggregate throughput. A different HAT may be selected if it has better upstream Linux support or a more suitable port topology.

### Display and console

Keep the touchscreen as a separate console node connected over a dedicated Ethernet service port. This preserves the requested “jack into the port” interaction and isolates the UI from capture and switch-management traffic. Raspberry Pi Touch Display 2 is a reasonable screen for a Pi-based console host; it connects locally to that host over DSI and is not itself an Ethernet display. The service-link protocol remains to be implemented and must use per-device authentication.

### Software target

The starter uses Python 3.11+ and the standard library, targeting 64-bit Raspberry Pi OS or another Debian-family Linux distribution for development. OpenWrt lists Raspberry Pi 5 as supported; selecting OpenWrt for the appliance image is a later decision because voice, Hermes, and KEV runtime packaging must be validated on that image. Keep router dataplane configuration behind typed adapters rather than shelling out from the conversational agent.

## First hardware acceptance checks (not yet performed)

- Identify exact Pi board revision, Ethernet HAT revision, NIC silicon, power supply, enclosure, cooling, storage, and touch-console model.
- Confirm Linux sees all intended ports across cold boots and link changes; role mapping remains stable.
- Confirm capture NIC can observe the intended traffic source without forwarding or transmitting on that interface.
- Measure CPU, memory, storage write load, packet loss, thermal behavior, and aggregate throughput under representative load.
- Verify the OOBM VLAN/subnet is isolated and does not overlap the connected network.
- Test power loss, filesystem recovery, and rollback storage durability.

## Sources

- Raspberry Pi 5 specifications and stated production lifetime: <https://www.raspberrypi.com/products/raspberry-pi-5/>
- Raspberry Pi PCIe Gen 2 x1 documentation: <https://www.raspberrypi.com/documentation/computers/raspberry-pi.html>
- OpenWrt Raspberry Pi 5 device entry: <https://openwrt.org/toh/hwdata/raspberry_pi_foundation/raspberry_pi_foundation_raspberry_pi_5>
- Waveshare 4-port 2.5GbE board listing: <https://www.waveshare.com/product/raspberry-pi/hats/pcie-to-4-ch-gigabit-eth-board-b.htm>
- Raspberry Pi Touch Display 2 docs: <https://www.raspberrypi.com/documentation/accessories/touch-display-2.html>
