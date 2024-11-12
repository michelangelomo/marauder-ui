import { ref, computed } from 'vue'

// Create singleton instance
const port = ref(null)
const reader = ref(null)
const isConnected = ref(false)
const terminalOutput = ref([])
let buffer = ''

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
        addToTerminal('✗ Disconnected from serial port', 'error')
      } catch (error) {
        console.error('Disconnection error:', error)
        addToTerminal(`✗ Error disconnecting: ${error.message}`, 'error')
      }
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
    console.log('Adding to terminal:', text, type) // Debug log
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
    terminalOutput,
    connect,
    disconnect,
    sendCommand
  }
}