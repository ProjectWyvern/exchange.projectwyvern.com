var theCache
var onSet

const cached = (func, prefix) => {
  return (arg) => {
    const key = prefix + ':' + JSON.stringify(arg)
    const val = theCache.get(key)
    if (val) {
      return val
    } else {
      const res = func(arg)
      theCache.set(key, res)
      onSet()
      return res
    }
  }
}

const cachedAsync = (func, prefix) => {
  return async (arg) => {
    const key = prefix + ':' + JSON.stringify(arg)
    const val = theCache.get(key)
    if (val) {
      return val
    } else {
      const res = await func(arg)
      theCache.set(key, res)
      onSet()
      return res
    }
  }
}

const writethrough = (store, cache) => {
  theCache = cache
  onSet = () => {
    store.commit('setCache', theCache)
  }
}

export { cached, cachedAsync, writethrough }
