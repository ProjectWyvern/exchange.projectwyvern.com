import Vue from 'vue'
import VueRouter from 'vue-router'
import VueMeta from 'vue-meta'
import Vuetify from 'vuetify'
import VueAnalytics from 'vue-analytics'
import AsyncComputed from 'vue-async-computed'
import Raven from 'raven-js'
import RavenVue from 'raven-js/plugins/vue'

import App from './App.vue'
import routes from './routes.js'
import store from './store.js'

import '../node_modules/vuetify/dist/vuetify.min.css'

if (process.env.NODE_ENV !== 'development') {
  Raven
    .config('https://c5992182b66541be9012ab71cbe0acd0@sentry.io/290797')
    .addPlugin(RavenVue, Vue)
    .install()
}

Vue.use(AsyncComputed)
Vue.use(VueRouter)
Vue.use(VueMeta)
Vue.use(Vuetify)

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
