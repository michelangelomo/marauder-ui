<template>
    <div class="h-full flex flex-col">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-bold">Terminal Output</h2>
        <button 
          @click="clearOutput" 
          class="px-2 py-1 text-sm font-bold bg-gray-500 text-white rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          Clear
        </button>
      </div>
      
      <div 
        ref="outputContainer"
        class="flex-1 overflow-y-auto bg-black rounded border-2 border-black font-mono text-green-400 p-2 text-sm"
      >
        <div 
          v-for="(line, index) in outputLines"
          :key="index"
          class="terminal-line"
          v-html="line"
        ></div>
      </div>
    </div>
  </template>

  <script setup>
  import { ref, watch, onMounted } from 'vue'
  import { useSerialConnection } from '../utils/serialConnection'
  
  const { terminalOutput } = useSerialConnection()
  const outputContainer = ref(null)
  const outputLines = ref([])
  
  // Watch for changes in terminalOutput
  watch(() => terminalOutput.value, (newOutput) => {
    outputLines.value = [...newOutput]
    scrollToBottom()
  }, { deep: true })
  
  const scrollToBottom = () => {
    if (outputContainer.value) {
      setTimeout(() => {
        outputContainer.value.scrollTop = outputContainer.value.scrollHeight
      }, 0)
    }
  }
  
  const clearOutput = () => {
    outputLines.value = []
  }
  
  // Debug output
  watch(outputLines, (newLines) => {
    console.log('Terminal lines updated:', newLines)
  })
  </script>