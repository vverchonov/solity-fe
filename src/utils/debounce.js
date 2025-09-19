// API call debouncing utility to prevent duplicate requests
class APIDebouncer {
  constructor(cooldownMs = 5000) {
    this.cooldownMs = cooldownMs
    this.lastCalls = new Map()
  }

  // Debounce an API call by key with optional context
  async debounce(key, apiCall, options = {}) {
    const {
      context = 'global',
      allowCrossContext = true,
      forceRefresh = false
    } = options

    const fullKey = `${context}:${key}`
    const globalKey = `global:${key}`
    const now = Date.now()

    // If forceRefresh is true, skip debouncing entirely
    if (forceRefresh) {
      try {
        const result = await apiCall()
        this.lastCalls.set(fullKey, { timestamp: now, result })
        // Also update global cache
        this.lastCalls.set(globalKey, { timestamp: now, result })
        return result
      } catch (error) {
        throw error
      }
    }

    // Check context-specific cache first
    const contextCall = this.lastCalls.get(fullKey)
    if (contextCall && (now - contextCall.timestamp) < this.cooldownMs) {
      return contextCall.result
    }

    // If allowCrossContext, check global cache
    if (allowCrossContext && context !== 'global') {
      const globalCall = this.lastCalls.get(globalKey)
      if (globalCall && (now - globalCall.timestamp) < this.cooldownMs) {
        // Update context cache with global result
        this.lastCalls.set(fullKey, { timestamp: now, result: globalCall.result })
        return globalCall.result
      }
    }

    // Make the API call
    try {
      const result = await apiCall()
      this.lastCalls.set(fullKey, { timestamp: now, result })
      // Also update global cache if this was a context-specific call
      if (context !== 'global') {
        this.lastCalls.set(globalKey, { timestamp: now, result })
      }
      return result
    } catch (error) {
      // Don't cache errors
      throw error
    }
  }

  // Force clear a specific key with optional context
  clearKey(key, context = null) {
    if (context) {
      const fullKey = `${context}:${key}`
      this.lastCalls.delete(fullKey)
    } else {
      // Clear all variations of this key
      const keysToDelete = []
      for (const [cacheKey] of this.lastCalls) {
        if (cacheKey.endsWith(`:${key}`) || cacheKey === key) {
          keysToDelete.push(cacheKey)
        }
      }
      keysToDelete.forEach(k => this.lastCalls.delete(k))
    }
  }

  // Clear all cached calls
  clearAll() {
    this.lastCalls.clear()
  }

  // Clear all cache for a specific context
  clearContext(context) {
    const keysToDelete = []
    for (const [cacheKey] of this.lastCalls) {
      if (cacheKey.startsWith(`${context}:`)) {
        keysToDelete.push(cacheKey)
      }
    }
    keysToDelete.forEach(k => this.lastCalls.delete(k))
  }
}

// Global debouncer instance
export const apiDebouncer = new APIDebouncer(3000) // 5 second cooldown

export default APIDebouncer