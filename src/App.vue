<template>
    <div class="h-screen flex flex-col bg-yellow-50 p-4 gap-4">
      <!-- Header -->
      <div class="bg-pink-400 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center">
        <h1 class="text-3xl font-black">marauder-ui</h1>
        <div class="flex items-center space-x-2">
          <span class="text-sm">Status:</span>
          <button 
            @click="handleConnect" 
            v-if="!serialConnection.isConnected.value"
            class="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            Connect
          </button>
          <button 
            @click="handleDisconnect" 
            v-if="serialConnection.isConnected.value"
            class="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
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
  
          <!-- Recent Commands -->
          <div class="flex-1 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 overflow-auto">
            <h2 class="text-xl font-bold mb-4">Recent Commands</h2>
            <div class="space-y-2">
              <button 
                v-for="cmd in recentCommands" 
                :key="cmd"
                @click="sendCommand(cmd)"
                class="w-full px-3 py-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                {{ cmd }}
              </button>
            </div>
          </div>
        </div>
  
        <!-- Right Content -->
        <div class="flex-1 flex flex-col gap-4">
          <!-- APs List -->
          <div class="flex-1 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 min-h-0">
            <AccessPointTable />
          </div>
        </div>
      </div>
  
      <!-- Terminal Output -->
      <div class="h-64 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
        <TerminalOutput />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import CommandBuilder from './components/CommandBuilder.vue'
  import TerminalOutput from './components/TerminalOutput.vue'
  import AccessPointTable from './components/AccessPointTable.vue'
  import { useSerialConnection } from './utils/serialConnection'
  
  const serialConnection = useSerialConnection()
  const recentCommands = ref([
    'scanap',
    'stopscan',
    'list -a',
    'help',
    'wardrive -s'
  ])
  console.log(serialConnection.isConnected)
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
  </script>