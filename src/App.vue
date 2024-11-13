<template>
  <div class="h-screen flex flex-col bg-yellow-50 p-4 gap-4">
    <MobileBlocker />

    <!-- Header -->
    <div
      class="bg-pink-400 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center">
      <h1 class="text-3xl font-black">marauder-ui</h1>
      <div class="flex items-center space-x-4">
        <!-- Demo Mode Button -->
        <button v-if="!serialConnection.isConnected.value" @click="toggleDemoMode"
          class="px-3 py-1 text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          :class="isDemoMode ? 'bg-purple-500 text-white' : 'bg-white'">
          {{ isDemoMode ? 'Exit Demo' : 'Try Demo' }}
        </button>

        <span class="text-sm">Status:</span>
        <button @click="handleConnect" v-if="!serialConnection.isConnected.value"
          class="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          Connect
        </button>
        <button @click="handleDisconnect" v-if="serialConnection.isConnected.value"
          class="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          Disconnect
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Left Sidebar -->
      <div class="w-1/4 flex flex-col gap-4">
        <!-- Command Builder -->
        <div class="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
          <CommandBuilder />
        </div>

        <!-- Workflows -->
        <div
          class="flex-1 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 overflow-auto">
          <h2 class="text-xl font-bold mb-4">Workflows</h2>
          <div class="space-y-2">
            <button v-for="workflow in workflows" :key="workflow.id" @click="openWorkflow(workflow)"
              class="w-full px-3 py-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {{ workflow.name }}
            </button>
          </div>
        </div>
      </div>


      <!-- Right Content -->
      <div class="flex-1 flex flex-col gap-4">
        <!-- APs List -->
        <div
          class="flex-1 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 min-h-0">
          <AccessPointTable />
        </div>
      </div>
    </div>

    <!-- Terminal Output -->
    <div class="h-64 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
      <TerminalOutput />
    </div>
  </div>

  <Teleport to="body">
    <WorkflowDialog v-if="selectedWorkflow" :workflow="selectedWorkflow" @close="selectedWorkflow = null"
      @execute="executeWorkflow" />
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MobileBlocker from './components/MobileBlocker.vue'
import CommandBuilder from './components/CommandBuilder.vue'
import TerminalOutput from './components/TerminalOutput.vue'
import AccessPointTable from './components/AccessPointTable.vue'
import WorkflowDialog from './components/WorkflowDialog.vue'
import { useSerialConnection } from './utils/serialConnection'
import { generateDemoData, generateDemoTerminalOutput } from './utils/demoData'
const isDemoMode = ref(false)
const demoUpdateInterval = ref(null)

// Add mobile detection
const isMobileDevice = ref(false)

onMounted(() => {
  const checkMobile = () => {
    isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
  }

  // Check on mount
  checkMobile()

  // Check on resize
  window.addEventListener('resize', checkMobile)

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
})

const serialConnection = useSerialConnection()
const selectedWorkflow = ref(null)
const workflows = [
  {
    id: 'random-beacon-spam-list',
    name: 'Random Beacon Spam (List)',
    description: 'Generates a list of random SSIDs and broadcasts beacon frames using this list.',
    steps: [
      { command: 'ssid -a -g 50', description: 'Generate 50 random SSIDs' },
      { command: 'list -s', description: 'Display generated SSIDs' },
      { command: 'attack -t beacon -l', description: 'Execute beacon list attack' }
    ]
  },
  {
    id: 'random-beacon-spam-auto',
    name: 'Random Beacon Spam (Auto)',
    description: 'Broadcasts beacon frames with automatically generated random SSIDs.',
    steps: [
      { command: 'attack -t beacon -r', description: 'Execute random beacon spam attack' }
    ]
  },
  {
    id: 'targeted-pmkid-sniff',
    name: 'Targeted Active PMKID Sniff',
    description: 'Performs targeted PMKID sniffing on selected access points.',
    steps: [
      { command: 'scanap', description: 'Scan for access points' },
      { command: 'list -a', description: 'List available access points' },
      {
        command: 'select -a {targets}',
        description: 'Select target access points',
        requiresInput: true,
        inputLabel: 'Target AP indices (comma-separated)',
        placeholder: '0,1,2'
      },
      { command: 'list -a', description: 'Verify selected access points' },
      { command: 'sniffpmkid -d -l', description: 'Execute targeted PMKID sniff' }
    ]
  },
  {
    id: 'random-beacon-spam-list',
    name: 'Random Beacon Spam (List)',
    description: 'Generates a list of random SSIDs and broadcasts beacon frames using this list.',
    steps: [
      { command: 'ssid -a -g 50', description: 'Generate 50 random SSIDs' },
      { command: 'list -s', description: 'Display generated SSIDs' },
      { command: 'attack -t beacon -l', description: 'Execute beacon list attack' }
    ]
  },
  {
    id: 'list-beacon-spam',
    name: 'List Beacon Spam',
    description: 'Creates a custom list of SSIDs and broadcasts beacon frames using this list.',
    steps: [
      {
        command: 'ssid -a -{type} {value}',
        description: 'Add SSIDs to the list',
        requiresInput: true,
        inputLabel: 'SSID Generation',
        placeholder: 'g 3 or n MySSID',
        help: 'Use "g NUMBER" for random or "n NAME" for specific SSID'
      },
      { command: 'list -s', description: 'Display generated SSIDs' },
      { command: 'attack -t beacon -l', description: 'Execute beacon list attack' }
    ]
  },
  {
    id: 'ap-clone-spam',
    name: 'AP Clone Spam',
    description: 'Clones nearby APs and broadcasts them with slightly modified names.',
    steps: [
      { command: 'scanap', description: 'Scan for access points' },
      { command: 'list -a', description: 'List available access points' },
      {
        command: 'select -a {targets}',
        description: 'Select target access points',
        requiresInput: true,
        inputLabel: 'Target AP indices (comma-separated)',
        placeholder: '0,1,2'
      },
      { command: 'list -a', description: 'Verify selected access points' },
      { command: 'attack -t beacon -a', description: 'Execute AP clone spam attack' }
    ]
  },
  {
    id: 'deauth-flood',
    name: 'Deauthentication Flood',
    description: 'Broadcasts deauthentication frames to all clients of selected APs.',
    steps: [
      { command: 'scanap', description: 'Scan for access points' },
      { command: 'list -a', description: 'List available access points' },
      {
        command: 'select -a {targets}',
        description: 'Select target access points',
        requiresInput: true,
        inputLabel: 'Target AP indices (comma-separated)',
        placeholder: '0,1'
      },
      { command: 'list -a', description: 'Verify selected access points' },
      { command: 'attack -t deauth', description: 'Execute deauthentication flood' }
    ]
  },
  {
    id: 'targeted-deauth',
    name: 'Targeted Deauthentication',
    description: 'Targets specific stations connected to selected APs.',
    steps: [
      { command: 'scanap', description: 'Scan for access points' },
      { command: 'list -a', description: 'List available access points' },
      {
        command: 'select -a {apTargets}',
        description: 'Select target access points',
        requiresInput: true,
        inputLabel: 'Target AP indices (comma-separated)',
        placeholder: '0,1'
      },
      { command: 'list -a', description: 'Verify selected access points' },
      { command: 'scansta', description: 'Scan for stations' },
      { command: 'list -c', description: 'List available stations' },
      {
        command: 'select -c {staTargets}',
        description: 'Select target stations',
        requiresInput: true,
        inputLabel: 'Target station indices (comma-separated)',
        placeholder: '0,12'
      },
      { command: 'list -c', description: 'Verify selected stations' },
      { command: 'attack -t deauth -c', description: 'Execute targeted deauthentication' }
    ]
  },
  {
    id: 'manual-deauth',
    name: 'Manual Deauthentication',
    description: 'Manually specified source and destination for deauth frames.',
    steps: [
      {
        command: 'attack -t deauth -s {source} -d {dest}',
        description: 'Execute manual deauthentication attack',
        requiresInput: true,
        inputLabel: 'Source MAC',
        placeholder: '00:00:00:00:00:00',
        requiresSecondInput: true,
        secondInputLabel: 'Destination MAC',
        secondPlaceholder: 'ff:ff:ff:ff:ff:ff'
      }
    ]
  },
  {
    id: 'signal-monitor',
    name: 'Signal Monitor',
    description: 'Monitor signal strength of selected access points.',
    steps: [
      { command: 'scanap', description: 'Scan for access points' },
      { command: 'list -a', description: 'List available access points' },
      {
        command: 'select -a {targets}',
        description: 'Select target access points',
        requiresInput: true,
        inputLabel: 'Target AP indices (comma-separated)',
        placeholder: '0,1'
      },
      { command: 'list -a', description: 'Verify selected access points' },
      { command: 'sigmon', description: 'Start signal monitoring' }
    ]
  }
]

const openWorkflow = (workflow) => {
  console.log('Opening workflow:', workflow) // Debug log
  selectedWorkflow.value = workflow
}

const executeWorkflow = async (commands) => {
  console.log('Executing commands:', commands) // Debug log
  for (const command of commands) {
    await serialConnection.sendCommand(command)
    // Add small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  selectedWorkflow.value = null
}

const handleConnect = async () => {
  console.log('Attempting to connect...')
  try {
    await serialConnection.connect()
  } catch (error) {
    console.error('Connection error:', error)
  }
}

const handleDisconnect = async () => {
  console.log('Attempting to disconnect...')
  try {
    await serialConnection.disconnect()
  } catch (error) {
    console.error('Disconnection error:', error)
  }
}

const sendCommand = async (cmd) => {
  try {
    await serialConnection.sendCommand(cmd)
  } catch (error) {
    console.error('Command error:', error)
  }
}

const toggleDemoMode = () => {
  isDemoMode.value = !isDemoMode.value

  serialConnection.isDemoMode = isDemoMode.value
  if (isDemoMode.value) {
    // Initialize demo data
    serialConnection.terminalOutput.value = generateDemoTerminalOutput()
  } else {
    // Clear demo data
    clearInterval(demoUpdateInterval.value)
    serialConnection.terminalOutput.value = []
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  if (demoUpdateInterval.value) {
    clearInterval(demoUpdateInterval.value)
  }
})
</script>

<style>
.workflow-dialog {
  z-index: 9999;
}
</style>