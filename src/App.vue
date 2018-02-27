<template>
<v-app id="app" :dark="nightMode">
  <v-navigation-drawer disable-resize-watcher disable-route-watcher fixed clipped app v-model="drawerLeft" class="drawerLeft" width="200">
    <v-list dense>
      <template v-for="(l, i) in links">
        <v-subheader v-if="l.banner" class="banner">{{ l.banner }}</v-subheader>
        <v-subheader v-else-if="l.section" style="font-size: 1.0em; text-align: center;"><span style="margin: 0 auto;">{{ l.section }}</span></v-subheader>
        <v-divider v-else-if="l.divider" />
        <router-link :to="l.path" v-else-if="!l.divider">
          <v-list-tile style="opacity: 0.85;" :class="(l.path === '/' ? l.path === activePath : activePath.indexOf(l.path) === 0) ? ($store.state.settings.nightMode? 'active-night' : 'active'): 'inactive'">
            <v-list-tile-avatar>
              <v-icon :style="iconStyle">{{ l.icon }}</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title :style="{fontSize: '1.2em'}">
              {{ l.name }}
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </router-link>
      </template>
    </v-list>
  </v-navigation-drawer>
  <v-navigation-drawer temporary disable-resize-watcher disable-route-watcher fixed clipped app right v-model="drawerNetwork">
    <network></network>
  </v-navigation-drawer>
  <v-navigation-drawer temporary disable-resize-watcher disable-route-watcher fixed clipped app right v-model="drawerSettings">
    <settings></settings>
  </v-navigation-drawer>
  <v-navigation-drawer temporary disable-resize-watcher disable-route-watcher fixed clipped app right v-model="drawerNotifications">
    <notifications></notifications>
  </v-navigation-drawer>
  <v-toolbar app dark clipped-left fixed class="toolbar">
    <v-toolbar-title :style="$vuetify.breakpoint.smAndUp ? 'width: 300px; min-width: 250px' : 'min-width: 72px'">
      <router-link to="/"><img src="/img/logo-square-red-transparent-200x200.png" class="logo" /></router-link>
      <v-toolbar-side-icon class="title-drawer" @click.stop="drawerLeft = !drawerLeft"></v-toolbar-side-icon>
      <span class="title hidden-xs-only">Wyvern Exchange</span>
    </v-toolbar-title>
    <div class="d-flex align-center" style="margin-left: auto">
      <v-btn icon @click.stop="drawerNotifications = !drawerNotifications">
        <v-badge :color="notificationsColor">
          <span v-if="notificationCount > 0" slot="badge">{{ notificationCount }}</span>
          <v-icon>notifications</v-icon>
        </v-badge>
      </v-btn>
      <v-btn icon @click.stop="drawerNetwork = !drawerNetwork">
        <v-icon>network_check</v-icon>
      </v-btn>
      <v-btn icon @click.stop="drawerSettings = !drawerSettings">
        <v-icon>settings</v-icon>
      </v-btn>
    </div>
  </v-toolbar>
  <v-content>
    <v-container fluid>
      <router-view>
      </router-view>
    </v-container>
  </v-content>
  <v-footer app class="footer hidden-xs-only">
    <span style="margin: 0 auto;">
      Live Beta - {{ branch }}/{{ hash }}. © 2018 Project Wyvern Developers.
    </span>
  </v-footer>
</v-app>
</template>

<script>
/* globals BRANCH:false,COMMITHASH:false */

import Network from './components/Network'
import Settings from './components/Settings'
import Notifications from './components/Notifications'

export default {
  name: 'app',
  components: { Network, Settings, Notifications },
  metaInfo: {
    title: '',
    titleTemplate: 'Wyvern Exchange • %s'
  },
  methods: {
    updateNightMode: function (nightMode) {
      this.$vuetify.theme.primary = nightMode ? '#ccc' : '#444'
    }
  },
  created: function () {
    this.updateNightMode(this.nightMode)
  },
  watch: {
    nightMode: function (n, o) {
      this.updateNightMode(n)
    }
  },
  computed: {
    nightMode: function () {
      return this.$store.state.settings.nightMode
    },
    iconStyle: function () {
      return {
        color: this.nightMode ? '#fff' : '#000'
      }
    },
    activePath: function () {
      return this.$route.path
    },
    hash: function () {
      return COMMITHASH
    },
    branch: function () {
      return BRANCH
    },
    notificationsColor: function () {
      return this.$store.state.notifications.filter(n => n.status === 'warn').length > 0
        ? 'blue' : this.$store.state.notifications.filter(n => n.status === 'error').length > 0
          ? 'red' : 'green'
    },
    notificationCount: function () {
      return this.$store.state.notifications.length
    },
    drawerNetwork: {
      get: function () { return this.drawer === 'network' },
      set: function (v) {
        if (v) this.drawer = 'network'
        else this.drawer = null
      }
    },
    drawerSettings: {
      get: function () { return this.drawer === 'settings' },
      set: function (v) {
        if (v) this.drawer = 'settings'
        else this.drawer = null
      }
    },
    drawerNotifications: {
      get: function () { return this.drawer === 'notifications' },
      set: function (v) {
        if (v) this.drawer = 'notifications'
        else this.drawer = null
      }
    }
  },
  data: function () {
    return {
      drawer: null,
      drawerLeft: true,
      links: [
        { banner: 'Live Beta' },
        { name: 'Home', icon: 'home', path: '/' },
        { divider: true },
        { section: 'Orders' },
        { name: 'Find', icon: 'search', path: '/orders' },
        { name: 'Post', icon: 'create', path: '/post' },
        { divider: true },
        { section: 'Assets' },
        { name: 'Directory', icon: 'view_list', path: '/assets' },
        { name: 'Accounts', icon: 'people', path: '/accounts' },
        { name: 'Schemas', icon: 'developer_board', path: '/schemas' },
        { divider: true },
        { section: 'My Account' },
        { name: 'Orders', icon: 'queue', path: '/account/orders' },
        { name: 'Assets', icon: 'domain', path: '/account/assets' },
        { name: 'Balances', icon: 'account_balance_wallet', path: '/account/balances' },
        { name: 'History', icon: 'history', path: '/account/history' },
        { divider: true },
        { section: 'Miscellaenous' },
        { name: 'Stats', icon: 'graphic_eq', path: '/stats' },
        { name: 'About', icon: 'info', path: '/about' },
        { name: 'Help', icon: 'help', path: '/help' }
      ]
    }
  }
}
</script>

<style>
a {
  text-decoration: none;
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1; 
}

::-webkit-scrollbar-thumb {
  background: #888; 
}

::-webkit-scrollbar-thumb:hover {
  background: #555; 
}
</style>

<style scoped>
a:hover {
  text-decoration: underline;
}

.title {
  font-variant: small-caps;
  position: relative;
  top: -8px;
}

.toolbar {
  padding-right: 0px !important;
}

.input-group {
  min-height: 40px !important;
}

.active {
  border-left: 10px solid #000;
}

.active-night {
  border-left: 10px solid #fff;
}

.inactive {
  margin-left: 10px;
}

.input-group.input-group--solo .input-group__input {
  min-height: 20px;
  padding: 4px 4px;
}

.input-group--text-field {
  height: 20px;
}

.title-drawer {
  left: -5px;
  position: relative;
  bottom: 10px; 
}

.logo {
  position: relative;
  top: 7px;
  left: -5px;
  height: 50px;
  width: 50px;
}

#app {
}

.banner {
  display: block;
  padding-top: 3px;
  height: 30px;
  text-align: center;
}

.drawerLeft * a:hover {
  text-decoration: none !important;
}
</style>
