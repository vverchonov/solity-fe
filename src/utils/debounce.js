// API call debouncing utility to prevent duplicate requests
class APIDebouncer {
  constructor(cooldownMs = 5000) {
    this.cooldownMs = cooldownMs
    this.lastCalls = new Map()
  }

  // Debounce an API call by key
  async debounce(key, apiCall) {
    const now = Date.now()
    const lastCall = this.lastCalls.get(key)

    // If we called this API recently, return cached result or skip
    if (lastCall && (now - lastCall.timestamp) < this.cooldownMs) {
      console.log(`API call "${key}" skipped - called ${Math.round((now - lastCall.timestamp) / 1000)}s ago`)
      return lastCall.result
    }

    // Make the API call
    console.log(`Making API call: "${key}"`)
    try {
      const result = await apiCall()
      this.lastCalls.set(key, { timestamp: now, result })
      return result
    } catch (error) {
      // Don't cache errors
      console.error(`API call "${key}" failed:`, error)
      throw error
    }
  }

  // Force clear a specific key (useful after successful transactions)
  clearKey(key) {
    this.lastCalls.delete(key)
    console.log(`Cleared debounce cache for: "${key}"`)
  }

  // Clear all cached calls
  clearAll() {
    this.lastCalls.clear()
    console.log('Cleared all debounce cache')
  }
}

// Global debouncer instance
export const apiDebouncer = new APIDebouncer(5000) // 5 second cooldown

export default APIDebouncer