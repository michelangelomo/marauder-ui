import { ref } from 'vue'

export const useCommandHistory = () => {
  const MAX_HISTORY = 50
  const history = ref([])
  const historyIndex = ref(-1)

  const addCommand = (command) => {
    if (command && !history.value.includes(command)) {
      history.value.unshift(command)
      if (history.value.length > MAX_HISTORY) {
        history.value.pop()
      }
      saveToLocalStorage()
    }
    historyIndex.value = -1
  }

  const getPreviousCommand = () => {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      return history.value[historyIndex.value]
    }
    return null
  }

  const getNextCommand = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      return history.value[historyIndex.value]
    } else if (historyIndex.value === 0) {
      historyIndex.value = -1
      return ''
    }
    return null
  }

  const saveToLocalStorage = () => {
    localStorage.setItem('commandHistory', JSON.stringify(history.value))
  }

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('commandHistory')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  }

  const clearHistory = () => {
    history.value = []
    localStorage.removeItem('commandHistory')
  }

  // Load history when initialized
  loadFromLocalStorage()

  return {
    history,
    addCommand,
    getPreviousCommand,
    getNextCommand,
    clearHistory
  }
}