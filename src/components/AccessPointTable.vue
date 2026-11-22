<template>
  <div class="h-full flex flex-col">
    <!-- Header with filters -->
    <div class="flex flex-col gap-3 mb-4">
      <!-- Title and actions -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="ap-count">{{ accessPoints.size }}</span>
          <span class="muted text-xs">{{ accessPoints.size === 1 ? 'device seen' : 'devices seen' }}</span>
          <span v-if="isScanning" class="pill pill-selected scanning-pill">
            <span class="scanning-dot" aria-hidden="true"></span> Scanning…
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button @click="refreshList" class="button button-subtle button-small" :disabled="!canSend">
            Refresh
          </button>
          <button @click="clearTable" class="button button-subtle button-small">
            Clear
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-2">
        <div class="flex-1 min-w-[180px]">
          <input type="text" v-model="search" placeholder="Search by ESSID, BSSID, or station…"
            class="input-field w-full">
        </div>
        <div class="view-switch">
          <button v-for="view in viewOptions" :key="view.id" @click="currentView = view.id" type="button"
            class="view-switch-btn" :class="{ 'is-active': currentView === view.id }">
            {{ view.label }}
          </button>
        </div>
        <select v-model="sortBy" class="input-field">
          <option value="rssi">Sort by signal</option>
          <option value="stations">Sort by stations</option>
          <option value="essid">Sort by name</option>
          <option value="channel">Sort by channel</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 min-h-0 overflow-auto ap-table-wrap">
      <table class="w-full text-sm ap-table">
        <thead class="sticky top-0 z-10">
          <tr>
            <th class="w-10">#</th>
            <th>ESSID</th>
            <th class="w-14">CH</th>
            <th class="w-16">RSSI</th>
            <th v-if="currentView === 'detailed'" class="w-32">BSSID</th>
            <th class="w-14">STA</th>
            <th v-if="currentView === 'detailed'" class="w-20">Seen</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="ap in sortedAPs" :key="ap.bssid">
            <tr class="ap-row" :class="getSignalClass(ap.rssi)" @click="ap.showStations = !ap.showStations">
              <td class="font-mono muted">{{ ap.index }}</td>
              <td>
                <div class="flex items-center gap-1.5">
                  <span class="font-medium">{{ ap.essid }}</span>
                  <span v-if="ap.isSelected" class="pill pill-selected">selected</span>
                  <span v-if="ap.isHidden" class="pill pill-muted">hidden</span>
                </div>
              </td>
              <td>{{ ap.channel }}</td>
              <td>
                <div class="flex items-center gap-1.5">
                  <span class="signal-dot" :class="getSignalDotClass(ap.rssi)"></span>
                  {{ ap.rssi || 'N/A' }}
                </div>
              </td>
              <td v-if="currentView === 'detailed'" class="font-mono muted">{{ ap.bssid }}</td>
              <td>
                <span class="pill">{{ ap.stations?.length || 0 }}</span>
              </td>
              <td v-if="currentView === 'detailed'" class="muted">{{ formatLastSeen(ap.lastSeen) }}</td>
            </tr>
            <!-- Stations subrow -->
            <tr v-if="ap.showStations && ap.stations?.length" class="ap-substations-row">
              <td :colspan="currentView === 'detailed' ? 7 : 5">
                <div class="pl-5 space-y-1 py-1">
                  <div v-for="station in ap.stations" :key="station.mac" class="flex items-center gap-2 text-xs">
                    <span class="w-8 muted">#{{ station.id }}</span>
                    <span class="font-mono">{{ station.mac }}</span>
                    <span v-if="station.vendor" class="muted">({{ station.vendor }})</span>
                    <span v-if="currentView === 'detailed'" class="muted">Last seen: {{ formatLastSeen(station.lastSeen) }}</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!sortedAPs.length">
            <td :colspan="currentView === 'detailed' ? 7 : 5" class="ap-empty">
              {{ isConnected ? 'No access points yet — run Scan all or Sniff beacons.' : 'Connect a device, or explore the demo, to see access points here.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSerialConnection } from '../utils/serialConnection'

const { sendCommand, isConnected, isScanning, canSend, terminalOutput } = useSerialConnection()
const accessPoints = ref(new Map())
const search = ref('')
const currentView = ref('compact')
const sortBy = ref('rssi')

const viewOptions = [
  { id: 'compact', label: 'Compact' },
  { id: 'detailed', label: 'Detailed' }
]

const sortedAPs = computed(() => {
  // Convert Map to array and ensure unique entries
  let aps = Array.from(accessPoints.value.values()).reduce((unique, ap) => {
    // Use channel-essid as unique identifier
    const key = `${ap.channel}-${ap.essid}`
    if (!unique.has(key)) {
      unique.set(key, ap)
    } else {
      // If AP already exists, merge properties preferring the newer data
      const existing = unique.get(key)
      unique.set(key, {
        ...existing,
        ...ap,
        stations: [...(ap.stations || [])],
        lastSeen: ap.lastSeen > existing.lastSeen ? ap.lastSeen : existing.lastSeen
      })
    }
    return unique
  }, new Map())

  // Convert back to array
  aps = Array.from(aps.values())

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    aps = aps.filter(ap =>
      ap.essid.toLowerCase().includes(searchLower) ||
      ap.bssid.toLowerCase().includes(searchLower) ||
      ap.stations?.some(station => station.mac.toLowerCase().includes(searchLower))
    )
  }

  // Apply sorting
  return aps.sort((a, b) => {
    switch (sortBy.value) {
      case 'rssi':
        // Handle cases where RSSI might be undefined
        const rssiA = a.rssi ?? -999
        const rssiB = b.rssi ?? -999
        return rssiB - rssiA || a.essid.localeCompare(b.essid)
      case 'stations':
        const stationsA = a.stations?.length || 0
        const stationsB = b.stations?.length || 0
        return stationsB - stationsA || a.essid.localeCompare(b.essid)
      case 'essid':
        return a.essid.localeCompare(b.essid)
      case 'channel':
        return (a.channel - b.channel) || a.essid.localeCompare(b.essid)
      default:
        return 0
    }
  })
})

const getSignalClass = (rssi) => {
  if (!rssi) return ''
  if (rssi > -70) return 'bg-green-50'
  if (rssi > -85) return 'bg-yellow-50'
  return 'bg-red-50'
}

const getSignalDotClass = (rssi) => {
  if (!rssi) return 'bg-gray-400'
  if (rssi > -70) return 'bg-green-500'
  if (rssi > -85) return 'bg-yellow-500'
  return 'bg-red-500'
}

const formatLastSeen = (date) => {
  if (!date) return 'N/A'
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const clearTable = () => {
  accessPoints.value.clear()
  accessPoints.value = new Map(accessPoints.value)
}


const refreshList = async () => {
  if (canSend.value) {
    await sendCommand('list -a')
  }
}

const filteredAPs = computed(() => {
  let aps = Array.from(accessPoints.value.values())

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    aps = aps.filter(ap =>
      ap.essid.toLowerCase().includes(searchLower) ||
      ap.bssid.toLowerCase().includes(searchLower)
    )
  }

  // Sort by signal strength and then by ESSID
  return aps.sort((a, b) => {
    if (a.rssi && b.rssi) {
      return b.rssi - a.rssi
    }
    return a.essid.localeCompare(b.essid)
  })
})

const updateAccessPoint = (ap) => {
  const key = `${ap.channel}-${ap.essid}`
  const existing = accessPoints.value.get(key)

  // Create a new Map to ensure reactivity
  const newAccessPoints = new Map(accessPoints.value)
  newAccessPoints.set(key, {
    ...existing,
    ...ap,
    stations: [...(ap.stations || [])].sort((a, b) => a.id - b.id),
    lastSeen: new Date(),
    // Ensure these properties are always present
    rssi: ap.rssi ?? existing?.rssi,
    bssid: ap.bssid || existing?.bssid || 'Unknown',
    isSelected: ap.isSelected ?? existing?.isSelected ?? false,
    isHidden: ap.isHidden ?? existing?.isHidden ?? false
  })

  accessPoints.value = newAccessPoints
}

const cleanEssid = (essid) => {
  // Remove special characters and clean up the string
  return essid
    .replace(/[�]/g, '') // Remove the weird symbol
    .replace(/\s*\(selected\)\s*$/, '') // Remove (selected) from the end
    .trim()
}

watch(() => terminalOutput.value, (newLines) => {
  newLines.forEach(line => {
    const plainLine = line.replace(/<[^>]+>/g, '')

    // Parse list -a output first (to get indices)
    if (plainLine.match(/^\[\d+\]\[CH:/)) {
      const match = plainLine.match(/\[(\d+)\]\[CH:(\d+)\]\s(.+?)(?:\s*[�]?\s*(?:\(selected\))?\s*)?$/)
      if (match) {
        const [_, index, channel, essid] = match
        const trimmedEssid = cleanEssid(essid)

        // Create a key that matches the one used by scanall
        const key = `${channel}-${trimmedEssid}`
        const existingAP = accessPoints.value.get(key)

        if (existingAP) {
          // Update existing AP with new index and selected status
          updateAccessPoint({
            ...existingAP,
            index: parseInt(index),
            channel: parseInt(channel),
            essid: trimmedEssid,
            isSelected: plainLine.includes('(selected)'),
            lastSeen: new Date()
          })
        } else {
          // Create new AP entry
          updateAccessPoint({
            index: parseInt(index),
            channel: parseInt(channel),
            essid: trimmedEssid,
            bssid: 'Unknown',
            isHidden: false,
            isSelected: plainLine.includes('(selected)'),
            lastSeen: new Date(),
            stations: []
          })
        }
      }
    }

    // Parse scanall output
    else if (plainLine.includes('RSSI:')) {
      const match = plainLine.match(/RSSI:\s(-?\d+)\sCh:\s(\d+)\sBSSID:\s([a-fA-F0-9:]+)\sESSID:\s(.+)/)
      if (match) {
        const [_, rssi, channel, bssid, essid] = match
        const trimmedEssid = cleanEssid(essid)
        const key = `${channel}-${trimmedEssid}`

        // Try to find existing AP to preserve index and other data
        const existingAP = accessPoints.value.get(key)

        updateAccessPoint({
          ...(existingAP || {}), // Preserve existing data, especially index and selected status
          rssi: parseInt(rssi),
          channel: parseInt(channel),
          bssid,
          essid: trimmedEssid,
          isHidden: trimmedEssid === bssid,
          isSelected: existingAP?.isSelected || false,
          lastSeen: new Date(),
          stations: existingAP?.stations || []
        })
      }
    }

    // Parse station scan output
    else if (plainLine.match(/^\d+:\s(ap|sta):/)) {
      const match = plainLine.match(/(\d+):\s(ap|sta):\s([a-fA-F0-9:]+)\s->\s(sta|ap):\s([a-fA-F0-9:]+)/)
      if (match) {
        const [_, index, firstType, firstMac, secondType, secondMac] = match
        const apMac = firstType === 'ap' ? firstMac : secondMac
        const staMac = firstType === 'sta' ? firstMac : secondMac
        const stationId = parseInt(index)

        // Find AP by BSSID
        let foundAP = null
        accessPoints.value.forEach((ap) => {
          if (ap.bssid === apMac) {
            foundAP = ap
          }
        })

        if (foundAP) {
          // Create a new object with the updated stations
          const updatedAP = {
            ...foundAP,
            stations: [...(foundAP.stations || [])]
          }

          // Update or add the station
          const existingStationIndex = updatedAP.stations.findIndex(s => s.mac === staMac)
          if (existingStationIndex >= 0) {
            updatedAP.stations[existingStationIndex] = {
              ...updatedAP.stations[existingStationIndex],
              id: stationId,
              lastSeen: new Date()
            }
          } else {
            updatedAP.stations.push({
              id: stationId,
              mac: staMac,
              lastSeen: new Date()
            })
          }

          // Sort stations by ID
          updatedAP.stations.sort((a, b) => a.id - b.id)

          // Update the AP in the map
          const key = `${updatedAP.channel}-${updatedAP.essid}`
          updateAccessPoint(updatedAP)
        }
      }
    }
  })
}, { deep: true })

// Cleanup old entries periodically
const cleanup = () => {
  const now = new Date()
  for (const [key, ap] of accessPoints.value.entries()) {
    if ((now - ap.lastSeen) > 5 * 60 * 1000) { // Remove after 5 minutes
      accessPoints.value.delete(key)
    }
  }
}

// Start cleanup interval
onMounted(() => {
  const interval = setInterval(cleanup, 30000)
  onUnmounted(() => clearInterval(interval))
})
</script>