<template>
  <main class="app-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
    <div class="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1600px] flex-col gap-5">
      <header class="topbar flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 sm:px-6">
        <a class="flex items-center gap-3" href="#" aria-label="Marauder console home">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span>
            <span class="block text-base font-semibold tracking-tight">Marauder Console</span>
            <span class="muted block text-xs">ESP32 device interface</span>
          </span>
        </a>

        <div class="flex flex-wrap items-center gap-3">
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

      <section class="welcome-row flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="eyebrow">DEVICE OVERVIEW</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your wireless workspace</h1>
          <p class="muted mt-2 max-w-2xl text-sm">Connect to your device to inspect nearby access points, send CLI commands, and review serial output.</p>
        </div>
        <a class="docs-link" href="https://github.com/justcallmekoko/ESP32Marauder/wiki/cli-usage" target="_blank" rel="noopener noreferrer">CLI reference <span aria-hidden="true">↗</span></a>
      </section>

      <section class="workspace-grid grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article class="panel flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="eyebrow">LIVE NETWORK VIEW</p>
              <h2 class="mt-1 text-lg font-semibold">Access points</h2>
            </div>
            <span class="muted text-xs">Scan results update as serial data arrives</span>
          </div>
          <div class="min-h-[320px] flex-1 overflow-hidden">
            <AccessPointTable />
          </div>
        </article>

        <aside class="flex flex-col gap-5">
          <section class="panel rounded-2xl p-4 sm:p-5">
            <div class="mb-4">
              <p class="eyebrow">COMMAND LINE</p>
              <h2 class="mt-1 text-lg font-semibold">Send a command</h2>
              <p class="muted mt-1 text-xs">Use a quick action or enter a CLI command.</p>
            </div>
            <CommandBuilder />
          </section>

          <section class="panel flex-1 rounded-2xl p-4 sm:p-5">
            <p class="eyebrow">QUICK GUIDE</p>
            <h2 class="mt-1 text-lg font-semibold">Common commands</h2>
            <div class="mt-4 space-y-3">
              <div v-for="item in commandGuide" :key="item.command" class="guide-item">
                <code>{{ item.command }}</code>
                <span class="muted">{{ item.description }}</span>
              </div>
            </div>
            <p class="muted mt-4 border-t border-[var(--line)] pt-4 text-xs leading-5">Command availability and options can vary by firmware build. Check the linked CLI guide for the full, current syntax.</p>
          </section>
        </aside>
      </section>

      <section class="panel terminal-panel flex min-h-[220px] flex-col rounded-2xl p-4 sm:p-5">
        <TerminalOutput />
      </section>
      <footer class="muted flex flex-wrap justify-between gap-2 px-1 text-xs">
        <span>Use only on networks and devices you own or are authorized to test.</span>
        <span>Web Serial works in supported desktop browsers over a secure connection.</span>
      </footer>
    </div>
  </main>
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
const commandGuide = [
  { command: 'help', description: 'Show available CLI commands' },
  { command: 'scanap', description: 'Scan for nearby access points' },
  { command: 'scanall', description: 'Run the firmware scan-all operation' },
  { command: 'list -a', description: 'List discovered access points' },
  { command: 'info', description: 'Show device and firmware information' },
  { command: 'stopscan', description: 'Stop the active scan' }
]

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
