# marauder-ui

A responsive Vue 3 interface for connecting to ESP32 Marauder firmware over the Web Serial API.

<img width="1901" height="863" alt="image" src="https://github.com/user-attachments/assets/50679a03-e4ae-4d78-85f9-76bd55372b5c" />


## Features

- Serial device connection and output monitor
- Access point scanning results with filtering, sorting, and compact/detail views
- Quick CLI actions and custom command entry
- Persistent dark/light appearance toggle
- Demo mode and responsive desktop/mobile layouts
- Tailwind CSS utility framework

## Requirements

- A browser supporting Web Serial (such as current Chrome or Edge)
- A secure context (`https://` or localhost)
- An ESP32 device running [Marauder firmware](https://github.com/justcallmekoko/ESP32Marauder)

## Development

```bash
npm install
npm run dev
```

Create a production build with `npm run build` and preview it with `npm run preview`.

## CLI commands

The command shortcuts are limited to general device information, scanning, listing, and stopping a scan:

| Command | Purpose |
| --- | --- |
| `help` | Show commands supported by the device firmware |
| `scanap` | Scan for access points |
| `scanall` | Run the firmware's scan-all operation |
| `list -a` | List discovered access points |
| `info` | Show device information |
| `stopscan` | Stop an active scan |

Firmware builds can differ. See the [ESP32 Marauder CLI usage guide](https://github.com/justcallmekoko/ESP32Marauder/wiki/cli-usage) for current syntax and supported options. Custom commands are passed through to the device as entered.

Only use this interface on devices and networks you own or are authorized to test.
