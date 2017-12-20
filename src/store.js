import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import VuexPersistence from 'vuex-persist'

Vue.use(Vuex)

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: state => ({})
})

const state = {}

const getters = {}

const actions = {}

const mutations = {}

var plugins = [vuexLocal.plugin]

if (process.env.NODE_ENV !== 'production') {
  plugins.push(createLogger())
}

const store = new Vuex.Store({ state, getters, actions, mutations, plugins })

export default store
