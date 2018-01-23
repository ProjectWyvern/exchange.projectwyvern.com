/* globals BRANCH:false, COMMITHASH:false */

import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import VuexPersistence from 'vuex-persist'

import { logger } from './logging.js'
import api from './api.js'
import { poll, web3Actions, bind } from './aux.js'

Vue.use(Vuex)

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
  reducer: state => ({settings: state.settings, notifications: state.notifications})
})

var provider = 'injected'
try {
  provider = JSON.parse(window.localStorage.vuex).settings.web3Provider
} catch (err) {
  logger.warn({ extra: { err } }, 'Could not parse provider from localStorage')
  if (!window.web3) {
    const def = 'https://rinkeby.infura.io/'
    provider = def
  }
}

console.log(`%c
                                                                        
  ██╗    ██╗██╗   ██╗██╗   ██╗███████╗██████╗ ███╗   ██╗                
  ██║    ██║╚██╗ ██╔╝██║   ██║██╔════╝██╔══██╗████╗  ██║                
  ██║ █╗ ██║ ╚████╔╝ ██║   ██║█████╗  ██████╔╝██╔██╗ ██║                
  ██║███╗██║  ╚██╔╝  ╚██╗ ██╔╝██╔══╝  ██╔══██╗██║╚██╗██║                
  ╚███╔███╔╝   ██║    ╚████╔╝ ███████╗██║  ██║██║ ╚████║                
   ╚══╝╚══╝    ╚═╝     ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝                
                                                                        
 ███████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗    
 ██╔════╝╚██╗██╔╝██╔════╝██║  ██║██╔══██╗████╗  ██║██╔════╝ ██╔════╝    
 █████╗   ╚███╔╝ ██║     ███████║███████║██╔██╗ ██║██║  ███╗█████╗      
 ██╔══╝   ██╔██╗ ██║     ██╔══██║██╔══██║██║╚██╗██║██║   ██║██╔══╝      
 ███████╗██╔╝ ██╗╚██████╗██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗    
 ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝    

`, 'font-family: monospace: color: black;')
console.log('%c' + 'Build ' + BRANCH + '/' + COMMITHASH + '', '')
console.log(`%c
Do NOT paste anything into this console!
If someone told you to, be very suspicious.

Developer? Interested? Email team@projectwyvern.com

`, 'font-size: 1.2em; color: black;')

logger.debug({extra: {provider: provider}}, 'Chose web3 provider')

const state = {
  notifications: [],
  settings: {
    version: '0.2.0',
    gasPrice: null,
    nightMode: false,
    advancedMode: false,
    web3Provider: provider,
    orderbookServer: 'http://37.187.38.165:8080'
  },
  web3: {},
  orders: null,
  ordersByHash: {}
}

try {
  const oldVersion = JSON.parse(window.localStorage.vuex).settings.version
  if (oldVersion !== state.settings.version) {
    logger.info({extra: {oldVersion: oldVersion, newVersion: state.settings.version}}, 'Version out of date, clearing localStorage')
    window.localStorage.clear()
  }
} catch (err) {
  logger.warn({ extra: { err } }, 'Could not parse version from localStorage')
}

const getters = {}

const actions = Object.assign({
  fetchOrders: async ({ state, commit }) => {
    commit('setOrders', null)
    const orders = await api.orders(state.settings.orderbookServer)
    commit('setOrders', orders)
  },
  fetchOrder: async ({ state, commit }, { hash }) => {
    const order = await api.order(state.settings.orderbookServer, hash)
    commit('setOrder', { hash, order })
  }
}, web3Actions)

const mutations = {
  setNightMode: (state, nightMode) => {
    Vue.set(state.settings, 'nightMode', nightMode)
  },
  setAdvancedMode: (state, advancedMode) => {
    Vue.set(state.settings, 'advancedMode', advancedMode)
  },
  setWeb3Provider: (state, provider) => {
    Vue.set(state.settings, 'web3Provider', provider)
    Vue.set(state, 'web3', {})
    poll()
  },
  setWeb3Latency: (state, latency) => {
    Vue.set(state.web3, 'latency', latency)
  },
  setWeb3Base: (state, base) => {
    Vue.set(state.web3, 'base', base)
  },
  setWeb3Assets: (state, assets) => {
    Vue.set(state.web3, 'assets', assets)
  },
  setWeb3Proxy: (state, proxy) => {
    Vue.set(state.web3, 'proxy', proxy)
  },
  setWeb3Schemas: (state, schemas) => {
    Vue.set(state.web3, 'schemas', schemas)
  },
  setWeb3Tokens: (state, tokens) => {
    Vue.set(state.web3, 'tokens', tokens)
  },
  setOrderbookServer: (state, server) => {
    Vue.set(state.settings, 'orderbookServer', server)
  },
  setOrders: (state, orders) => {
    Vue.set(state, 'orders', orders)
  },
  setOrder: (state, { order, hash }) => {
    Vue.set(state.ordersByHash, hash, order)
  },
  commitTx: (state, { txHash, params }) => {
    logger.info({extra: { txHash, params }}, 'Transaction committed')
    state.notifications.splice(0, 0, {
      type: 'commitTx',
      status: 'warn',
      finalized: false,
      txHash: txHash,
      params: params
    })
  },
  mineTx: (state, { txHash, success }) => {
    logger.info({extra: { txHash, success }}, 'Transaction mined')
    const m = state.notifications.map((n, i) => [n, i]).filter(m => m[0].txHash === txHash)[0]
    const n = m[0]
    const i = m[1]
    Vue.set(n, 'status', success ? 'ok' : 'error')
    Vue.set(n, 'finalized', true)
    Vue.set(state.notifications, i, n)
  },
  clearNotification: (state, index) => {
    state.notifications.splice(index, 1)
  },
  clearNotifications: (state) => {
    Vue.set(state, 'notifications', [])
  }
}

var plugins = [vuexLocal.plugin]

if (process.env.NODE_ENV !== 'production') {
  plugins.push(createLogger({
    filter: (mutation, before, after) => {
      return mutation.type !== 'setWeb3Latency'
    }
  }))
}

const store = new Vuex.Store({ state, getters, actions, mutations, plugins })

logger.debug({extra: {}}, 'Initialized Vuex store')

bind(store)

export default store
