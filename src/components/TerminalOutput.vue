<template>
  <div class="flex h-full min-h-[180px] flex-col">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="status-dot is-online"></span>
        <h2 class="text-sm font-semibold">Serial output</h2>
        <span class="muted text-xs">{{ outputLines.length }} lines</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="button button-subtle button-small"
          type="button"
          :aria-pressed="autoScroll"
          @click="toggleAutoScroll"
        >
          <span class="autoscroll-dot" :class="{ 'is-on': autoScroll }" aria-hidden="true"></span>
          Autoscroll {{ autoScroll ? 'on' : 'off' }}
        </button>
        <button class="button button-subtle button-small" type="button" @click="clearOutput">Clear output</button>
      </div>
    </div>
    <div
      ref="outputContainer"
      class="terminal-output"
      role="log"
      aria-label="Serial output"
      aria-live="polite"
      aria-relevant="additions text"
      @scroll="onScroll"
    >
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
const autoScroll = ref(true)
let ignoreNextScroll = false

// Existing firmware/demo output may contain presentational span markup; render its text only.
const plainText = (line) => {
  if (typeof line !== 'string') return String(line ?? '')
  const element = document.createElement('span')
  element.innerHTML = line
  return element.textContent || ''
}

const scrollToBottom = async () => {
  await nextTick()
  const el = outputContainer.value
  if (!el) return
  ignoreNextScroll = true
  el.scrollTop = el.scrollHeight
}

watch(terminalOutput, async (lines) => {
  outputLines.value = [...lines]
  if (autoScroll.value) scrollToBottom()
}, { deep: true })

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value) scrollToBottom()
}

// Scrolling away from the bottom pauses autoscroll so new output doesn't yank
// the view back down; scrolling back to the bottom resumes it.
const onScroll = () => {
  if (ignoreNextScroll) {
    ignoreNextScroll = false
    return
  }
  const el = outputContainer.value
  if (!el) return
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  if (distanceFromBottom > 48 && autoScroll.value) {
    autoScroll.value = false
  } else if (distanceFromBottom <= 4 && !autoScroll.value) {
    autoScroll.value = true
  }
}

const clearOutput = () => {
  outputLines.value = []
  terminalOutput.value = []
}
</script>
