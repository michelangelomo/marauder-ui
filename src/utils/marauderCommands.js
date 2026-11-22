// Command catalog for the ESP32 Marauder CLI, current as of firmware v1.20.
// Source: https://github.com/justcallmekoko/ESP32Marauder/wiki/cli-usage and its linked per-command pages.
// Intended use: authorized security testing / research on hardware and networks the operator owns or has
// written permission to test. The wiki notes some older commands were removed in v1.20 (standalone scan
// shortcuts and a couple of legacy aliases) — this list reflects the current syntax, not the old one.
//
// Item shape:
//   label, desc        – display text
//   cmd                – literal command (no parameters), OR
//   params + build(v)  – small form; build(values) returns the command string to send
//   radiates           – true when the command causes the radio to transmit, so the UI asks for
//                        an explicit confirmation before sending it
//   fill               – true when the exact argument set is device/firmware specific; the command
//                        name is placed in the input for the operator to complete, not sent directly

export const COMMAND_GROUPS = [
  {
    id: 'scan',
    label: 'Scan',
    items: [
      { label: 'Scan all', desc: 'Discover access points and their associated clients', cmd: 'scanall' },
      { label: 'Sniff beacons', desc: 'Collect access points from beacon frames', cmd: 'sniffbeacon' },
      { label: 'Sniff management frames', desc: 'Watch for a specific management frame type', cmd: 'sniffdeauth' },
      { label: 'Sniff SAE', desc: 'Capture WPA3 SAE commit frames', cmd: 'sniffsae' },
      {
        label: 'Sniff PMKID',
        desc: 'Capture PMKID / EAPOL handshake frames',
        radiates: true,
        params: [
          { key: 'c', label: 'Channel', type: 'number', placeholder: 'optional', min: 1, max: 165 },
          { key: 'l', label: 'Only selected access points', type: 'toggle' },
          { key: 'd', label: 'Prompt handshakes from clients', type: 'toggle' }
        ],
        build: (v) => ['sniffpmkid', v.c && `-c ${v.c}`, v.d && '-d', v.l && '-l'].filter(Boolean).join(' ')
      },
      { label: 'MAC track', desc: 'Rank observed devices by activity', cmd: 'mactrack' },
      { label: 'Ping scan', desc: 'ICMP sweep of the joined network', cmd: 'pingscan' },
      {
        label: 'Channel',
        desc: 'Read or set the radio channel',
        params: [{ key: 's', label: 'Set channel', type: 'number', placeholder: 'blank reads current', min: 1, max: 165 }],
        build: (v) => (v.s ? `channel -s ${v.s}` : 'channel')
      },
      {
        label: 'Stop',
        desc: 'End any running scan or transmission',
        params: [{ key: 'f', label: 'Also leave the joined network', type: 'toggle' }],
        build: (v) => (v.f ? 'stopscan -f' : 'stopscan'),
        tone: 'stop',
        immediate: true
      }
    ]
  },
  {
    id: 'lists',
    label: 'Lists',
    items: [
      {
        label: 'List',
        desc: 'Show a retained list',
        params: [
          {
            key: 't', label: 'List', type: 'select', default: 'a',
            options: [
              ['a', 'Access points'], ['c', 'Stations'], ['s', 'User SSIDs'], ['t', 'AirTags'],
              ['i', 'IP addresses'], ['p', 'Probe-request SSIDs'], ['b', 'BLE devices'],
              ['f', 'Flipper devices'], ['x', 'WiFi Pineapples'], ['m', 'MultiSSID devices']
            ]
          }
        ],
        build: (v) => `list -${v.t || 'a'}`,
        immediate: true
      },
      {
        label: 'Select',
        desc: 'Mark entries for use by other commands',
        params: [
          { key: 't', label: 'Type', type: 'select', default: 'a', options: [['a', 'Access points'], ['c', 'Stations'], ['s', 'User SSIDs']] },
          { key: 'i', label: 'Indices', type: 'text', placeholder: '1,3,5 or all' },
          { key: 'f', label: 'Name contains', type: 'text', placeholder: 'used instead of indices' }
        ],
        build: (v) => {
          const type = v.t || 'a'
          if (v.f) return `select -${type} -f "contains ${v.f.replace(/"/g, '')}"`
          return `select -${type} ${(v.i || 'all').replace(/\s+/g, '')}`
        }
      },
      {
        label: 'Clear list',
        desc: 'Forget retained entries',
        params: [{ key: 't', label: 'List', type: 'select', default: 'a', options: [['a', 'Access points (and stations)'], ['c', 'Stations'], ['s', 'User SSIDs']] }],
        build: (v) => `clearlist -${v.t || 'a'}`,
        tone: 'destructive'
      },
      {
        label: 'SSID list',
        desc: 'Add or remove entries used by other commands',
        params: [
          { key: 'm', label: 'Action', type: 'select', default: 'g', options: [['g', 'Generate random'], ['n', 'Add by name'], ['r', 'Remove by index']] },
          { key: 'v', label: 'Count / name / index', type: 'text', placeholder: '3' }
        ],
        build: (v) => {
          const m = v.m || 'g'
          const val = (v.v || '').trim()
          if (m === 'g') return `ssid -a -g ${parseInt(val, 10) || 1}`
          if (m === 'n') return `ssid -a -n ${val}`
          return `ssid -r ${parseInt(val, 10) || 0}`
        }
      }
    ]
  },
  {
    id: 'rf',
    label: 'RF',
    items: [
      {
        label: 'Frame test: broadcast',
        desc: 'Send a selected frame type to selected access points (broadcast destination)',
        radiates: true,
        params: [
          { key: 'k', label: 'Frame type', type: 'select', default: 'deauth', options: [['deauth', 'Deauth'], ['badmsg', 'Bad message'], ['sleep', 'Association sleep'], ['sae', 'SAE commit'], ['csa', 'Channel switch'], ['quiet', 'Quiet time']] },
          { key: 'c', label: 'Target selected stations instead', type: 'toggle', when: (v) => v.k === 'deauth' || v.k === 'badmsg' || v.k === 'sleep' }
        ],
        build: (v) => ['attack', '-t', v.k || 'deauth', v.c && '-c'].filter(Boolean).join(' ')
      },
      {
        label: 'Frame test: manual addresses',
        desc: 'Deauth with an explicit source and destination MAC',
        radiates: true,
        params: [
          { key: 's', label: 'Source MAC', type: 'text', placeholder: 'AA:BB:CC:DD:EE:FF' },
          { key: 'd', label: 'Destination MAC', type: 'text', placeholder: 'FF:FF:FF:FF:FF:FF' }
        ],
        build: (v) => `attack -t deauth -s ${v.s || ''} -d ${v.d || ''}`
      },
      {
        label: 'Beacon test',
        desc: 'Advertise synthetic SSIDs from the list, random names, or copies of selected access points',
        radiates: true,
        params: [{ key: 'm', label: 'Source', type: 'select', default: 'l', options: [['l', 'SSID list'], ['r', 'Random names'], ['a', 'Copies of selected access points']] }],
        build: (v) => `attack -t beacon -${v.m || 'l'}`
      },
      { label: 'Probe flood', desc: 'Probe requests addressed to selected access points', cmd: 'attack -t probe', radiates: true },
      {
        label: 'Captive portal',
        desc: 'Host a rogue access point with a local captive page for authorized assessment',
        radiates: true,
        params: [
          { key: 'w', label: 'HTML file on SD card', type: 'text', placeholder: 'index.html (default)' },
          { key: 'a', label: 'Use access point at list index', type: 'number', placeholder: 'optional', min: 0 }
        ],
        build: (v) => {
          const setap = v.a !== undefined && v.a !== '' ? `evilportal -c setap ${v.a}` : null
          const start = ['evilportal -c start', v.w && `-w ${v.w}`].filter(Boolean).join(' ')
          return setap ? `${setap}\n${start}` : start
        }
      }
    ]
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    items: [
      {
        label: 'Sniff Bluetooth',
        desc: 'Observe nearby BLE advertisements',
        params: [{ key: 't', label: 'Filter', type: 'select', default: '', options: [['', 'All devices'], ['airtag', 'AirTags'], ['flipper', 'Flipper Zero'], ['flock', 'Flock'], ['meta', 'Meta']] }],
        build: (v) => (v.t ? `sniffbt -t ${v.t}` : 'sniffbt')
      },
      { label: 'Remote ID scan', desc: 'Listen for drone remote-ID broadcasts', cmd: 'remoteid scan' },
      { label: 'Remote ID list', desc: 'Show detected drones', cmd: 'remoteid list' },
      { label: 'BLE advertising test', desc: 'Device-specific — complete in the input field', cmd: 'blespam -t ', fill: true, radiates: true },
      { label: 'Tag spoof test', desc: 'Device-specific — complete in the input field', cmd: 'spoofat', fill: true, radiates: true }
    ]
  },
  {
    id: 'device',
    label: 'Device',
    items: [
      { label: 'Help', desc: 'Commands compiled into this firmware build', cmd: 'help' },
      { label: 'Info', desc: 'Firmware and hardware details', cmd: 'info' },
      { label: 'Settings', desc: 'View or change device settings', cmd: 'settings' },
      { label: 'GPS data', desc: 'Stream position every 5 seconds', cmd: 'gpsdata' },
      { label: 'Wardrive', desc: 'Log networks with GPS — complete in the input field', cmd: 'wardrive', fill: true },
      { label: 'Recon', desc: 'Field collection mode — complete in the input field', cmd: 'recon', fill: true },
      {
        label: 'LED',
        desc: 'Set the status LED colour or pattern',
        params: [
          { key: 'm', label: 'Mode', type: 'select', default: 'p', options: [['p', 'Pattern'], ['s', 'Hex colour']] },
          { key: 'v', label: 'Value', type: 'text', placeholder: 'rainbow or #8F00FF' }
        ],
        build: (v) => `led -${v.m || 'p'} ${(v.v || 'rainbow').trim()}`
      },
      { label: 'Save', desc: 'Persist lists to storage', cmd: 'save', fill: true },
      { label: 'Load', desc: 'Restore lists from storage', cmd: 'load', fill: true },
      { label: 'Reboot', desc: 'Restart the device', cmd: 'reboot', tone: 'destructive' }
    ]
  }
]

// Everyday shortcuts shown above the tabs.
export const PINNED = [
  { label: 'Scan all', cmd: 'scanall', icon: 'scan' },
  { label: 'List APs', cmd: 'list -a', icon: 'list' },
  { label: 'Beacons', cmd: 'sniffbeacon', icon: 'wave' },
  { label: 'Stop', cmd: 'stopscan', icon: 'stop', tone: 'stop' }
]

// Names offered for autocomplete in the free-form command input.
export const COMMAND_NAMES = [
  'help', 'info', 'reboot', 'settings', 'led', 'save', 'load',
  'scanall', 'sniffbeacon', 'sniffdeauth', 'sniffsae', 'sniffpmkid', 'sniffbt',
  'select', 'list', 'clearlist', 'ssid', 'channel', 'mactrack', 'pingscan', 'stopscan',
  'attack', 'evilportal', 'remoteid', 'gpsdata', 'wardrive', 'recon', 'blespam', 'spoofat'
]
