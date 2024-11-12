<template>
    <div class="bg-green-200 p-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h2 class="text-xl font-bold mb-4">Connection</h2>
      <div class="flex space-x-4">
        <button 
          @click="connect" 
          :disabled="isConnected"
          class="command-btn"
          :class="{ 'opacity-50 cursor-not-allowed': isConnected }"
        >
          <span class="status-indicator" :class="isConnected ? 'connected' : 'disconnected'"></span>
          Connect
        </button>
        <button 
          @click="disconnect" 
          :disabled="!isConnected"
          class="command-btn bg-red-500 hover:bg-red-600"
          :class="{ 'opacity-50 cursor-not-allowed': !isConnected }"
        >
          Disconnect
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useSerialConnection } from '../utils/serialConnection'
  
  const { connect, disconnect, isConnected } = useSerialConnection()
  </script>