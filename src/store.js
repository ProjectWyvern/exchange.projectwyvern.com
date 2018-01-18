import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import VuexPersistence from 'vuex-persist'

import { logger } from './logging.js'

Vue.use(Vuex)

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: state => ({settings: state.settings})
})

const state = {
  settings: {
    nightMode: false,
    advancedMode: false
  }
}

const getters = {}

const actions = {}

const mutations = {
  setNightMode: (state, nightMode) => {
    Vue.set(state.settings, 'nightMode', nightMode)
  },
  setAdvancedMode: (state, advancedMode) => {
    Vue.set(state.settings, 'advancedMode', advancedMode)
  }
}

var plugins = [vuexLocal.plugin]

if (process.env.NODE_ENV !== 'production') {
  plugins.push(createLogger())
}

const store = new Vuex.Store({ state, getters, actions, mutations, plugins })

logger.debug({extra: {}}, 'Store initialized')

export default store
