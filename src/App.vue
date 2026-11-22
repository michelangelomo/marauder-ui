<template>
  <div class="app-shell flex h-screen flex-col overflow-y-auto">
    <header class="topbar sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
      <a class="flex items-center gap-3" href="#" aria-label="Marauder console home">
        <span class="brand-mark" aria-hidden="true">M</span>
        <span>
          <span class="block text-base font-semibold tracking-tight">Marauder Console</span>
          <span class="muted block text-[11px]">ESP32 device interface</span>
        </span>
      </a>

      <div class="flex flex-wrap items-center gap-3">
        <a class="docs-link" href="https://github.com/justcallmekoko/ESP32Marauder/wiki/cli-usage" target="_blank" rel="noopener noreferrer">CLI reference <span class="docs-link-arrow" aria-hidden="true">→</span></a>
        <button v-if="!serialConnection.isConnected.value" class="button button-subtle" @click="toggleDemoMode">
          {{ isDemoMode ? 'Exit demo' : 'Explore demo' }}
        </button>
        <span class="connection-state" :class="serialConnection.isConnected.value || isDemoMode ? 'is-online' : ''">
          <span class="status-dot"></span>
          {{ isDemoMode ? 'Demo session' : serialConnection.isConnected.value ? 'Device connected' : 'Not connected' }}
        </span>
        <button v-if="!serialConnection.isConnected.value" class="button button-primary" :disabled="!serialSupported" @click="handleConnect">
          {{ serialSupported ? 'Connect device' : 'Web Serial unavailable' }}
        </button>
        <button v-else class="button button-danger" @click="handleDisconnect">Disconnect</button>
        <button class="theme-toggle" type="button" :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`" @click="toggleTheme">
          <svg v-if="isDark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.5 8.5 0 1 0 20.9 13Z"/></svg>
        </button>
      </div>
    </header>

    <main class="main-grid grid min-h-0 flex-1 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section class="panel ap-panel flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-sm font-semibold">Access points</h2>
          <span class="muted text-xs">Updates as serial data arrives</span>
        </div>
        <AccessPointTable class="min-h-0 flex-1" />
      </section>

      <aside class="flex min-h-0 flex-col gap-4">
        <section class="panel cmd-panel flex min-h-0 flex-col rounded-2xl p-4 sm:p-5">
          <h2 class="mb-3 shrink-0 text-sm font-semibold">Send a command</h2>
          <CommandBuilder class="min-h-0 flex-1" />
        </section>

        <section class="panel term-panel flex min-h-0 flex-col rounded-2xl p-4 sm:p-5">
          <TerminalOutput class="min-h-0 flex-1" />
        </section>
      </aside>
    </main>

    <footer class="muted shrink-0 flex flex-wrap justify-between gap-2 px-4 pb-2 text-[11px] sm:px-6">
      <span>Use only on networks and devices you own or are authorized to test.</span>
      <span>Web Serial works in supported desktop browsers over a secure connection.</span>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import CommandBuilder from './components/CommandBuilder.vue'
import TerminalOutput from './components/TerminalOutput.vue'
import AccessPointTable from './components/AccessPointTable.vue'
import { useSerialConnection } from './utils/serialConnection'
import { generateDemoTerminalOutput } from './utils/demoData'

const serialConnection = useSerialConnection()
const isDemoMode = ref(false)
const isDark = ref(false)
const serialSupported = computed(() => typeof navigator !== 'undefined' && 'serial' in navigator)

const applyTheme = (dark) => {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('marauder-theme', isDark.value ? 'dark' : 'light')
  applyTheme(isDark.value)
}

const handleConnect = async () => {
  if (!serialSupported.value) return
  try {
    await serialConnection.connect()
  } catch (error) {
    console.error('Connection error:', error)
  }
}

const handleDisconnect = async () => {
  try {
    await serialConnection.disconnect()
  } catch (error) {
    console.error('Disconnection error:', error)
  }
}

const toggleDemoMode = () => {
  isDemoMode.value = !isDemoMode.value
  serialConnection.isDemoMode.value = isDemoMode.value
  if (isDemoMode.value) {
    serialConnection.terminalOutput.value = generateDemoTerminalOutput()
  } else {
    serialConnection.terminalOutput.value = []
  }
}

let mobileQuery
const onViewportChange = () => {
  document.documentElement.classList.toggle('compact-viewport', mobileQuery?.matches ?? false)
}
onMounted(() => {
  const savedTheme = localStorage.getItem('marauder-theme')
  isDark.value = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(isDark.value)
  mobileQuery = window.matchMedia('(max-width: 640px)')
  onViewportChange()
  mobileQuery.addEventListener?.('change', onViewportChange)
})
onUnmounted(() => mobileQuery?.removeEventListener?.('change', onViewportChange))

watch(() => serialConnection.isConnected.value, (connected) => {
  if (connected && isDemoMode.value) toggleDemoMode()
})
</script>
