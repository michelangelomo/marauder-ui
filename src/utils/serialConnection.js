import { ref, computed } from 'vue'
import { generateDemoData } from './demoData'

// Create singleton instance
const port = ref(null)
const reader = ref(null)
const isConnected = ref(false)
const terminalOutput = ref([])
const isDemoMode = ref(false)
const isScanning = ref(false)
let buffer = ''
let autoRefreshTimer = null
let autoRefreshStopTimer = null
const AUTO_REFRESH_INTERVAL_MS = 8000
const AUTO_REFRESH_MAX_DURATION_MS = 60000

export const useSerialConnection = () => {
  const connect = async () => {
    console.log('Connect function called')
    try {
      if (!navigator.serial) {
        console.error('Web Serial API not supported')
        throw new Error('Web Serial API not supported in this browser')
      }

      console.log('Requesting port...')
      port.value = await navigator.serial.requestPort()
      console.log('Port selected:', port.value)

      console.log('Opening port...')
      await port.value.open({ baudRate: 115200 })
      console.log('Port opened successfully')

      isConnected.value = true
      addToTerminal('✓ Connected to serial port', 'success')
      startReading()
    } catch (error) {
      console.error('Connection error:', error)
      isConnected.value = false
      addToTerminal(`✗ Failed to connect: ${error.message}`, 'error')
      throw error
    }
  }

  const disconnect = async () => {
    if (port.value) {
      try {
        if (reader.value) {
          await reader.value.cancel()
        }
        await port.value.close()
        port.value = null
        reader.value = null
        isConnected.value = false
        stopAutoRefresh()
        addToTerminal('✗ Disconnected from serial port', 'error')
      } catch (error) {
        console.error('Disconnection error:', error)
        addToTerminal(`✗ Error disconnecting: ${error.message}`, 'error')
      }
    }
  }

  // While a scan is running, the AP list keeps changing on the device but the
  // UI only learns about it from `list -a` output, so poll that periodically
  // instead of asking the user to hit Refresh after every scan. Capped at
  // AUTO_REFRESH_MAX_DURATION_MS so a scan left running doesn't poll forever —
  // the user can always hit Refresh manually after that.
  const startAutoRefresh = () => {
    if (autoRefreshTimer) return
    autoRefreshTimer = setInterval(() => {
      sendCommand('list -a')
    }, AUTO_REFRESH_INTERVAL_MS)
    autoRefreshStopTimer = setTimeout(stopAutoRefresh, AUTO_REFRESH_MAX_DURATION_MS)
  }

  const stopAutoRefresh = () => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
    if (autoRefreshStopTimer) {
      clearTimeout(autoRefreshStopTimer)
      autoRefreshStopTimer = null
    }
    isScanning.value = false
  }

  const trackScanState = (command) => {
    const trimmed = command.trim()
    if (trimmed === 'scanall' || trimmed.startsWith('scanall ')) {
      isScanning.value = true
      startAutoRefresh()
    } else if (trimmed.startsWith('stopscan')) {
      stopAutoRefresh()
    }
  }

  const startReading = async () => {
    while (port.value && port.value.readable) {
      try {
        const textDecoder = new TextDecoderStream()
        const readableStreamClosed = port.value.readable.pipeTo(textDecoder.writable)
        reader.value = textDecoder.readable.getReader()

        try {
          while (true) {
            const { value, done } = await reader.value.read()
            if (done) break

            if (value) {
              // Accumulate the buffer and process complete lines
              buffer += value
              const lines = buffer.split('\n')
              buffer = lines.pop() // Keep the last incomplete line in buffer

              // Process complete lines
              lines.forEach(line => {
                if (line.trim()) {
                  addToTerminal(line.trim())
                }
              })
            }
          }
        } catch (error) {
          console.error('Read error:', error)
        } finally {
          if (reader.value) {
            reader.value.releaseLock()
          }
        }
      } catch (error) {
        addToTerminal(`✗ Read error: ${error.message}`, 'error')
        break
      }
    }
  }

  const sendCommand = async (command) => {
    trackScanState(command)

    if (isDemoMode.value) {
      // Handle demo commands
      addToTerminal(`> ${command}`, 'command')

      // Simulate responses based on command
      switch (true) {
        case command === 'scanall':
          addToTerminal('Starting scan. Stop with stopscan')
          setTimeout(() => {
            generateDemoData().forEach(ap => {
              addToTerminal(`RSSI: ${ap.rssi} Ch: ${ap.channel} BSSID: ${ap.bssid} ESSID: ${ap.essid}`)
            })
          }, 500)
          break
        case command === 'list -a':
          generateDemoData().forEach(ap => {
            addToTerminal(`[${ap.index}][CH:${ap.channel}] ${ap.essid}${ap.isSelected ? ' (selected)' : ''}`)
          })
          break
        case command === 'stopscan' || command === 'stopscan -f':
          addToTerminal('Stopping all scans...')
          break
        default:
          addToTerminal(`Executing: ${command}`)
      }
      return
    }

    if (!command || !port.value) {
      addToTerminal('✗ No command or not connected', 'error')
      return
    }

    try {
      const writer = port.value.writable.getWriter()
      const encoder = new TextEncoder()
      const data = encoder.encode(command + '\n')
      await writer.write(data)
      addToTerminal(`> ${command}`, 'command')
      writer.releaseLock()
    } catch (error) {
      console.error('Send error:', error)
      addToTerminal(`✗ Failed to send command: ${error.message}`, 'error')
    }
  }

  const addToTerminal = (text, type = 'normal') => {
    if (text.trim()) {
      const lineClass = getTypeClass(type)
      terminalOutput.value = [...terminalOutput.value, `<span class="${lineClass}">${text}</span>`]

      // Keep only last 1000 lines
      if (terminalOutput.value.length > 1000) {
        terminalOutput.value = terminalOutput.value.slice(-1000)
      }
    }
  }

  const getTypeClass = (type) => {
    const classes = {
      normal: 'text-green-400',
      success: 'text-blue-400',
      error: 'text-red-500',
      command: 'text-yellow-400'
    }
    return classes[type] || classes.normal
  }

  return {
    isConnected: computed(() => isConnected.value), // Make it computed
    isDemoMode,
    isScanning: computed(() => isScanning.value),
    canSend: computed(() => isConnected.value || isDemoMode.value),
    terminalOutput,
    connect,
    disconnect,
    sendCommand
  }
}