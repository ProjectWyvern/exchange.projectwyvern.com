import Vue from 'vue'
import VueRouter from 'vue-router'
import VueMeta from 'vue-meta'
import Vuetify from 'vuetify'

import App from './App.vue'
import routes from './routes.js'
import store from './store.js'

Vue.use(VueRouter)
Vue.use(VueMeta)
Vue.use(Vuetify)

const router = new VueRouter({ routes: routes, mode: 'history' })

/* eslint-disable no-new */
new Vue({
  store: store,
  router,
  el: '#app',
  render: h => h(App),
  components: { App }
})
