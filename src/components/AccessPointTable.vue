<template>
  <div class="h-full flex flex-col">
    <!-- Header with filters -->
    <div class="flex flex-col gap-4 mb-4">
      <!-- Title and actions -->
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <h2 class="text-xl font-bold">Access Points</h2>
          <span class="text-sm text-gray-600">({{ accessPoints.size }} devices)</span>
        </div>
        <div class="flex items-center space-x-2">
          <button @click="refreshList"
            class="px-3 py-1 text-sm font-bold bg-blue-500 text-white rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            :disabled="!isConnected">
            Refresh
          </button>
          <button @click="clearTable"
            class="px-3 py-1 text-sm font-bold bg-orange-500 text-white rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            Clear
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex space-x-4">
        <div class="flex-1">
          <input type="text" v-model="search" placeholder="Search by ESSID, BSSID, or Station..."
            class="w-full px-3 py-2 text-sm bg-white rounded border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="flex space-x-2">
          <button v-for="view in viewOptions" :key="view.id" @click="currentView = view.id"
            class="px-3 py-2 text-sm font-bold rounded border-2 border-black"
            :class="currentView === view.id ? 'bg-orange-500 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'">
            {{ view.label }}
          </button>
        </div>
        <select v-model="sortBy"
          class="px-3 py-2 text-sm bg-white rounded border-2 border-black focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="rssi">Sort by Signal</option>
          <option value="stations">Sort by Stations</option>
          <option value="essid">Sort by Name</option>
          <option value="channel">Sort by Channel</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 min-h-0 overflow-auto border-2 border-black rounded bg-white">
      <!-- Compact View -->
      <table v-if="currentView === 'compact'" class="w-full text-sm">
        <thead class="bg-orange-300 sticky top-0 z-10">
          <tr>
            <th class="px-2 py-1 text-left border-b-2 border-black font-bold w-12">#</th>
            <th class="px-2 py-1 text-left border-b-2 border-black font-bold">ESSID</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-16 font-bold">CH</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-16 font-bold">RSSI</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-16 font-bold">STA</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="ap in sortedAPs" :key="ap.bssid">
            <tr class="hover:bg-orange-50 border-b border-gray-200 cursor-pointer" :class="getSignalClass(ap.rssi)"
              @click="ap.showStations = !ap.showStations">
              <td class="px-2 py-1 font-mono">{{ ap.index }}</td>
              <td class="px-2 py-1">
                <div class="flex items-center">
                  <span class="font-medium">{{ ap.essid }}</span>
                  <span v-if="ap.isHidden" class="ml-1 text-xs bg-gray-200 px-1 rounded">
                    hidden
                  </span>
                </div>
              </td>
              <td class="px-2 py-1">{{ ap.channel }}</td>
              <td class="px-2 py-1">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full mr-1" :class="getSignalDotClass(ap.rssi)"></div>
                  {{ ap.rssi || 'N/A' }}
                </div>
              </td>
              <td class="px-2 py-1">
                <span class="text-xs px-1 py-0.5 bg-blue-100 rounded">
                  {{ ap.stations?.length || 0 }}
                </span>
              </td>
            </tr>
            <!-- Stations subrow -->
            <tr v-if="ap.showStations && ap.stations?.length" class="bg-gray-50 text-xs border-b border-gray-200">
              <td colspan="5" class="px-2 py-1">
                <div class="pl-4 space-y-1">
                  <div v-for="station in ap.stations" :key="station.mac" class="flex items-center space-x-2">
                    <span class="w-8 text-gray-500">#{{ station.id }}</span>
                    <span class="font-mono">{{ station.mac }}</span>
                    <span v-if="station.vendor" class="text-gray-600">({{ station.vendor }})</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Detailed View -->
      <table v-else class="w-full text-sm">
        <thead class="bg-orange-300 sticky top-0 z-10">
          <tr>
            <th class="px-2 py-1 text-left border-b-2 border-black font-bold w-12">#</th>
            <th class="px-2 py-1 text-left border-b-2 border-black font-bold">ESSID</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-16 font-bold">CH</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-16 font-bold">RSSI</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-32 font-bold">BSSID</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-16 font-bold">STA</th>
            <th class="px-2 py-1 text-left border-b-2 border-black w-24 font-bold">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="ap in sortedAPs" :key="ap.bssid">
            <tr class="hover:bg-orange-50 border-b border-gray-200 cursor-pointer" :class="getSignalClass(ap.rssi)"
              @click="ap.showStations = !ap.showStations">
              <td class="px-2 py-1 font-mono">{{ ap.index }}</td>
              <td class="px-2 py-1">
                <div class="flex items-center">
                  <span class="font-medium">{{ ap.essid }}</span>
                  <span v-if="ap.isHidden" class="ml-1 text-xs bg-gray-200 px-1 rounded">
                    hidden
                  </span>
                </div>
              </td>
              <td class="px-2 py-1">{{ ap.channel }}</td>
              <td class="px-2 py-1">
                <div class="flex items-center">
                  <div class="w-2 h-2 rounded-full mr-1" :class="getSignalDotClass(ap.rssi)"></div>
                  {{ ap.rssi || 'N/A' }}
                </div>
              </td>
              <td class="px-2 py-1 font-mono">{{ ap.bssid }}</td>
              <td class="px-2 py-1">
                <span class="text-xs px-1 py-0.5 bg-blue-100 rounded">
                  {{ ap.stations?.length || 0 }}
                </span>
              </td>
              <td class="px-2 py-1 text-gray-600">{{ formatLastSeen(ap.lastSeen) }}</td>
            </tr>
            <!-- Stations subrow -->
            <tr v-if="ap.showStations && ap.stations?.length" class="bg-gray-50 text-xs border-b border-gray-200">
              <td colspan="7" class="px-2 py-1">
                <div class="pl-4 space-y-1">
                  <div v-for="station in ap.stations" :key="station.mac" class="flex items-center space-x-2">
                    <span class="w-8 text-gray-500">#{{ station.id }}</span>
                    <span class="font-mono">{{ station.mac }}</span>
                    <span v-if="station.vendor" class="text-gray-600">({{ station.vendor }})</span>
                    <span class="text-gray-500">Last seen: {{ formatLastSeen(station.lastSeen) }}</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSerialConnection } from '../utils/serialConnection'

const { sendCommand, isConnected, terminalOutput } = useSerialConnection()
const accessPoints = ref(new Map())
const search = ref('')
const currentView = ref('compact')
const sortBy = ref('rssi')

const viewOptions = [
  { id: 'compact', label: 'Compact' },
  { id: 'detailed', label: 'Detailed' }
]

const sortedAPs = computed(() => {
  let aps = Array.from(accessPoints.value.values())

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
        return (b.rssi || -999) - (a.rssi || -999)
      case 'stations':
        return (b.stations?.length || 0) - (a.stations?.length || 0)
      case 'essid':
        return a.essid.localeCompare(b.essid)
      case 'channel':
        return a.channel - b.channel
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
  if (isConnected.value) {
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
    stations: [...(ap.stations || [])].sort((a, b) => a.id - b.id), // Sort stations by ID
    lastSeen: new Date()
  })

  accessPoints.value = newAccessPoints
}

// Update the parsing in the watch function
watch(() => terminalOutput.value, (newLines) => {
  newLines.forEach(line => {
    const plainLine = line.replace(/<[^>]+>/g, '')

    // Parse list -a output first (to get indices)
    if (plainLine.match(/^\[\d+\]\[CH:/)) {
      const match = plainLine.match(/\[(\d+)\]\[CH:(\d+)\]\s(.+?)\s?[�]?$/)
      if (match) {
        const [_, index, channel, essid] = match
        const trimmedEssid = essid.trim()

        // Create a key that matches the one used in scanap
        const key = `${channel}-${trimmedEssid}`
        const existingAP = accessPoints.value.get(key)

        if (existingAP) {
          // Update existing AP with new index
          updateAccessPoint({
            ...existingAP,
            index: parseInt(index),
            channel: parseInt(channel),
            essid: trimmedEssid,
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
            lastSeen: new Date(),
            stations: []
          })
        }
      }
    }

    // Parse both scanap and beacon sniff output (they use the same format)
    else if (plainLine.match(/RSSI:\s-?\d+/)) {
      const match = plainLine.match(/RSSI:\s(-?\d+)\sCh:\s(\d+)\sBSSID:\s([a-fA-F0-9:]+)\sESSID:\s(.+)/)
      if (match) {
        const [_, rssi, channel, bssid, essid] = match
        const trimmedEssid = essid.trim()
        
        // Use BSSID as the primary key for the Map
        const existingAP = accessPoints.value.get(bssid)
        const parsedRssi = parseInt(rssi)
        const parsedChannel = parseInt(channel)

        if (existingAP) {
          // Update existing AP
          // Only update channel if it's significantly different
          const newChannel = Math.abs(existingAP.channel - parsedChannel) > 2 ? 
            parsedChannel : existingAP.channel

          // Use exponential moving average for RSSI
          const newRssi = existingAP.rssi ? 
            Math.round(existingAP.rssi * 0.7 + parsedRssi * 0.3) : 
            parsedRssi

          // Create a new Map to ensure reactivity
          const newAccessPoints = new Map(accessPoints.value)
          newAccessPoints.set(bssid, {
            ...existingAP,
            rssi: newRssi,
            channel: newChannel,
            essid: trimmedEssid,
            bssid,
            isHidden: trimmedEssid === bssid,
            lastSeen: new Date(),
            beaconCount: (existingAP.beaconCount || 0) + 1,
            stations: existingAP.stations || []
          })
          
          accessPoints.value = newAccessPoints
        } else {
          // Create new AP entry
          const newAccessPoints = new Map(accessPoints.value)
          newAccessPoints.set(bssid, {
            rssi: parsedRssi,
            channel: parsedChannel,
            bssid,
            essid: trimmedEssid,
            isHidden: trimmedEssid === bssid,
            lastSeen: new Date(),
            stations: [],
            beaconCount: 1
          })
          
          accessPoints.value = newAccessPoints
        }
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
        const existingAP = accessPoints.value.get(apMac)

        if (existingAP) {
          const stations = existingAP.stations || []
          const existingStation = stations.find(s => s.mac === staMac)

          const updatedStations = existingStation ? 
            stations.map(s => s.mac === staMac ? 
              { ...s, lastSeen: new Date(), id: stationId } : s) :
            [...stations, { id: stationId, mac: staMac, lastSeen: new Date() }]

          const newAccessPoints = new Map(accessPoints.value)
          newAccessPoints.set(apMac, {
            ...existingAP,
            stations: updatedStations.sort((a, b) => a.id - b.id),
            lastSeen: new Date()
          })
          
          accessPoints.value = newAccessPoints
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