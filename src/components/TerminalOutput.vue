<template>
  <div class="flex h-full min-h-[180px] flex-col">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="status-dot is-online"></span>
        <h2 class="text-sm font-semibold">Serial output</h2>
        <span class="muted text-xs">{{ outputLines.length }} lines</span>
      </div>
      <button class="button button-subtle button-small" type="button" @click="clearOutput">Clear output</button>
    </div>
    <div ref="outputContainer" class="terminal-output" role="log" aria-label="Serial output" aria-live="polite" aria-relevant="additions text">
      <p v-if="!outputLines.length" class="terminal-placeholder">Waiting for device output…</p>
      <div v-for="(line, index) in outputLines" :key="index" class="terminal-line">{{ plainText(line) }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useSerialConnection } from '../utils/serialConnection'

const { terminalOutput } = useSerialConnection()
const outputContainer = ref(null)
const outputLines = ref([...terminalOutput.value])

// Existing firmware/demo output may contain presentational span markup; render its text only.
const plainText = (line) => {
  if (typeof line !== 'string') return String(line ?? '')
  const element = document.createElement('span')
  element.innerHTML = line
  return element.textContent || ''
}

watch(terminalOutput, async (lines) => {
  outputLines.value = [...lines]
  await nextTick()
  if (outputContainer.value) outputContainer.value.scrollTop = outputContainer.value.scrollHeight
}, { deep: true })

const clearOutput = () => {
  outputLines.value = []
  terminalOutput.value = []
}
</script>
