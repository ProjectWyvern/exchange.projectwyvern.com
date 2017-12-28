<template>
<v-app id="app">
  <v-navigation-drawer fixed clipped app v-model="drawerLeft">
    <v-list dense>
      <template v-for="(l, i) in links">
        <v-subheader v-if="l.section">{{ l.section }}</v-subheader>
        <v-divider v-else-if="l.divider" />
        <router-link :to="l.path" v-else-if="!l.divider">
          <v-list-tile>
            <v-list-tile-avatar>
              <v-icon>{{ l.icon }}</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>
              {{ l.name }}
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </router-link>
      </template>
    </v-list>
  </v-navigation-drawer>
  <v-navigation-drawer fixed clipped app right v-model="drawerRight">
    <v-list dense>
      <v-list-tile>
        <v-list-tile-action>
          <v-icon>exit_to_app</v-icon>
        </v-list-tile-action>
        <v-list-tile-content>
          <v-list-tile-title>Exit</v-list-tile-title>
        </v-list-tile-content>
      </v-list-tile>
    </v-list>
  </v-navigation-drawer>
  <v-toolbar app dark clipped-left fixed class="toolbar">
    <v-toolbar-title :style="$vuetify.breakpoint.smAndUp ? 'width: 300px; min-width: 250px' : 'min-width: 72px'">
      <img src="/img/logo-square-red-transparent-200x200.png" class="logo" />
      <v-toolbar-side-icon class="title-drawer" @click.stop="drawerLeft = !drawerLeft"></v-toolbar-side-icon>
      <span class="title hidden-xs-only">Wyvern Exchange</span>
    </v-toolbar-title>
    <v-text-field
      light
      solo
      prepend-icon="search"
      placeholder="Search"
      style="max-width: 500px; min-width: 128px;"
    ></v-text-field>
    <div class="d-flex align-center" style="margin-left: auto">
      <v-btn icon>
        <v-icon>notifications</v-icon>
      </v-btn>
      <v-btn icon @click.stop="drawerRight = !drawerRight">
        <v-icon>network_check</v-icon>
      </v-btn>
    </div>
  </v-toolbar>
  <v-content>
    <router-view>
      <v-container fluid></v-container>
    </router-view>
  </v-content>
  <v-footer app class="footer hidden-xs-only">
  © 2017 Project Wyvern Developers. This application is completely open-source and you can run it yourself if you like; see the <a style="margin-left: 0px; margin-right: 4px;" href="https://github.com/projectwyvern/exchange.projectwyvern.com">Github repository</a> for instructions.
  </v-footer>
</v-app>
</template>

<script>
export default {
  name: 'app',
  metaInfo: {
    title: '',
    titleTemplate: 'Wyvern Exchange • %s'
  },
  data: function() {
    return {
      drawerLeft: true,
      drawerRight: false,
      links: [
        { name: 'Home', icon: 'home', path: '/' },
        { divider: true },
        { section: 'Items' },
        { name: 'Find', icon: 'search', path: '/items/find' },
        { name: 'Browse', icon: 'grid_on', path: '/items/browse' },
        { name: 'Post', icon: 'create', path: '/items/post' },
        { divider: true },
        { section: 'Account' },
        { name: 'Profile', icon: 'person', path: '/account/profile' },
        { name: 'History', icon: 'history', path: '/account/history' },
        { name: 'Escrow', icon: 'account_balance', path: '/account/escrow' },
        { divider: true },
        { section: 'Exchange' },
        { name: 'Stats', icon: 'graphic_eq', path: '/stats' },
        { name: 'About', icon: 'info', path: '/about' },
        { name: 'Help', icon: 'help', path: '/help' }
      ]
    }
  }
}
</script>

<style scoped>
a {
  text-decoration: none;
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
  font-family: "Raleway", sans-serif !important;
}

.footer {
  margin-left: 1em;
}

.footer > a:hover {
  text-decoration: underline;
}
</style>
