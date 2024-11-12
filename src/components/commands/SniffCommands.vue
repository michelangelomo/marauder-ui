<template>
    <div class="command-group">
      <div class="grid gap-3">
        <div class="grid grid-cols-2 gap-3">
          <button @click="emitCommand('sniffraw')" class="command-btn">
            Raw Sniff
          </button>
          <button @click="emitCommand('sniffbeacon')" class="command-btn">
            Beacon Sniff
          </button>
          <button @click="emitCommand('sniffprobe')" class="command-btn">
            Probe Sniff
          </button>
          <button @click="emitCommand('sniffpwn')" class="command-btn">
            PWN Sniff
          </button>
          <button @click="emitCommand('sniffesp')" class="command-btn">
            ESP Sniff
          </button>
          <button @click="emitCommand('sniffdeauth')" class="command-btn">
            Deauth Sniff
          </button>
        </div>
  
        <div class="bg-white p-4 rounded-lg border-2 border-black mt-3">
          <h3 class="font-bold mb-2">PMKID Sniff Options</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm mb-1">Channel:</label>
              <input v-model="channel" type="number" class="input-field" placeholder="Channel number">
            </div>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input v-model="deauth" type="checkbox" class="mr-2">
                Deauth
              </label>
              <label class="flex items-center">
                <input v-model="loop" type="checkbox" class="mr-2">
                Loop
              </label>
            </div>
            <button @click="buildPmkidCommand" class="command-btn w-full">
              Start PMKID Sniff
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const emit = defineEmits(['command-built'])
  const channel = ref('')
  const deauth = ref(false)
  const loop = ref(false)
  
  const emitCommand = (command) => {
    emit('command-built', command)
  }
  
  const buildPmkidCommand = () => {
    let cmd = 'sniffpmkid'
    if (channel.value) cmd += ` -c ${channel.value}`
    if (deauth.value) cmd += ' -d'
    if (loop.value) cmd += ' -l'
    emit('command-built', cmd)
  }
  </script>