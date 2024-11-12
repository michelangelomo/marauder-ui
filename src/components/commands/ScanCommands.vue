<template>
    <div class="command-group">
      <div class="grid grid-cols-2 gap-3">
        <button @click="emitCommand('scanap')" class="command-btn">
          Scan AP
        </button>
        <button @click="emitCommand('scansta')" class="command-btn">
          Scan Stations
        </button>
        <button @click="emitCommand('stopscan')" class="command-btn bg-red-500 hover:bg-red-600">
          Stop Scan
        </button>
        <button @click="emitCommand('wardrive -s')" class="command-btn">
          Wardrive
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  const emit = defineEmits(['command-built'])
  
  const emitCommand = (command) => {
    emit('command-built', command)
  }
  </script>