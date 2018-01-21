import Vue from 'vue'
import VueRouter from 'vue-router'
import VueMeta from 'vue-meta'
import Vuetify from 'vuetify'
import VueAnalytics from 'vue-analytics'

import App from './App.vue'
import routes from './routes.js'
import store from './store.js'

import '../node_modules/vuetify/dist/vuetify.min.css'

import _schemas from './wyvern-schemas/build/schemas.json'

Vue.use(VueRouter)
Vue.use(VueMeta)
Vue.use(Vuetify)

_schemas.map(schema => {
  Vue.component(schema.config.name, require('./wyvern-schemas/build/templates/' + schema.config.name + '.vue').default)
})

const router = new VueRouter({ routes: routes, mode: 'history' })

Vue.use(VueAnalytics, {
  id: 'UA-98270549-5',
  router
})

/* eslint-disable no-new */
new Vue({
  store: store,
  router,
  el: '#app',
  render: h => h(App),
  components: { App }
})
