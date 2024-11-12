export const processAnsiCodes = (text) => {
    const ansiCodes = {
      '\u001b[30m': '<span class="text-gray-900">',
      '\u001b[31m': '<span class="text-red-500">',
      '\u001b[32m': '<span class="text-green-500">',
      '\u001b[33m': '<span class="text-yellow-500">',
      '\u001b[34m': '<span class="text-blue-500">',
      '\u001b[35m': '<span class="text-purple-500">',
      '\u001b[36m': '<span class="text-cyan-500">',
      '\u001b[37m': '<span class="text-gray-100">',
      '\u001b[0m': '</span>'
    }
  
    let processedText = text
    Object.entries(ansiCodes).forEach(([code, replacement]) => {
      processedText = processedText.replace(new RegExp(code, 'g'), replacement)
    })
  
    return processedText
  }
  
  export const autoLink = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, '<a href="$1" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
  }
  
  export const parseAccessPoint = (line) => {
    const match = line.match(/RSSI:\s(-?\d+)\sCh:\s(\d+)\sBSSID:\s([a-fA-F0-9:]+)\sESSID:\s(.+)/)
    if (match) {
      const [_, rssi, channel, bssid, essid] = match
      return {
        rssi: parseInt(rssi),
        channel: parseInt(channel),
        bssid,
        essid
      }
    }
    return null
  }