<template>
    <div class="command-group">
      <div class="space-y-3">
        <select v-model="attackType" class="input-field">
          <option value="">Select Attack Type</option>
          <option value="deauth">Deauth</option>
          <option value="probe">Probe</option>
          <option value="rickroll">Rickroll</option>
        </select>
  
        <div v-if="attackType === 'deauth'" class="space-y-2">
          <input v-model="timeout" type="number" class="input-field" placeholder="Timeout (seconds)">
        </div>
  
        <button 
          @click="buildAttackCommand" 
          class="command-btn w-full"
          :disabled="!attackType"
        >
          Launch Attack
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const emit = defineEmits(['command-built'])
  const attackType = ref('')
  const timeout = ref('')
  
  const buildAttackCommand = () => {
    if (!attackType.value) return
    
    let cmd = `attack -t ${attackType.value}`
    if (attackType.value === 'deauth' && timeout.value) {
      cmd += ` -d ${timeout.value}`
    }
    emit('command-built', cmd)
  }
  </script>