<template>
    <div class="command-group">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <button @click="emitCommand('list -s')" class="command-btn">
            List Stations
          </button>
          <button @click="emitCommand('list -a')" class="command-btn">
            List APs
          </button>
          <button @click="emitCommand('list -c')" class="command-btn">
            List Captured
          </button>
          <button @click="emitCommand('clearlist -a')" class="command-btn bg-red-500 hover:bg-red-600">
            Clear All
          </button>
        </div>
  
        <div class="bg-white p-4 rounded-lg border-2 border-black mt-3">
          <h3 class="font-bold mb-2">Filter Options</h3>
          <div class="space-y-3">
            <input v-model="filterText" type="text" class="input-field" placeholder="Filter text">
            <select v-model="filterType" class="input-field">
              <option value="a">Access Points</option>
              <option value="s">Stations</option>
              <option value="c">Captured</option>
            </select>
            <button @click="buildFilterCommand" class="command-btn w-full">
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const emit = defineEmits(['command-built'])
  const filterText = ref('')
  const filterType = ref('a')
  
  const emitCommand = (command) => {
    emit('command-built', command)
  }
  
  const buildFilterCommand = () => {
    if (!filterText.value) return
    const cmd = `select -${filterType.value} -f "${filterText.value}"`
    emit('command-built', cmd)
  }
  </script>