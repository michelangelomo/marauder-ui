<template>
  <div class="space-y-4">
    <div class="quick-command-grid">
      <button v-for="item in quickCommands" :key="item.command" class="quick-command" type="button" @click="sendCommand(item.command)">
        <span class="quick-command-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="text-left"><span class="block text-sm font-medium">{{ item.label }}</span><code class="muted mt-0.5 block text-[11px]">{{ item.command }}</code></span>
      </button>
    </div>

    <form class="command-form" @submit.prevent="sendCustomCommand">
      <label class="sr-only" for="custom-command">Enter a Marauder CLI command</label>
      <input id="custom-command" v-model="customCommand" class="command-input" type="text" autocomplete="off" spellcheck="false" placeholder="Enter a CLI command…">
      <button class="button button-primary" type="submit" :disabled="!customCommand.trim()">Send</button>
    </form>
    <p class="muted text-[11px] leading-4">Commands are sent to the connected device exactly as entered. Verify syntax against your firmware version.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSerialConnection } from '../utils/serialConnection'

const { sendCommand: serialSendCommand } = useSerialConnection()
const customCommand = ref('')
const quickCommands = [
  { label: 'Scan access points', command: 'scanap', icon: '⌕' },
  { label: 'Scan all', command: 'scanall', icon: '◉' },
  { label: 'List access points', command: 'list -a', icon: '☷' },
  { label: 'Stop scan', command: 'stopscan', icon: '■' }
]

const sendCommand = async (command) => {
  await serialSendCommand(command)
}

const sendCustomCommand = async () => {
  const command = customCommand.value.trim()
  if (!command) return
  await sendCommand(command)
  customCommand.value = ''
}
</script>
