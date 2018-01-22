<template>
<v-list dense>
  <v-list-tile>
    <v-list-tile-content style="font-size: 1.5em; font-variant: small-caps">
      <span style="margin: 0 auto;">
      Notifications
      <v-btn flat @click.native="clearAll" class="clearall">
      Clear All
      </v-btn>
      </span>
    </v-list-tile-content>
  </v-list-tile>
  <br /><br />
  <v-list-tile v-for="(n, index) in notifications" :key="index">
    <v-card class="notification">
      <v-card-title>
        <span>{{ format(n.type) }}</span>
        <v-icon v-if="n.finalized" :class="'icon ' + n.status">{{ iconify(n.status) }}</v-icon>
      </v-card-title>
      <v-card-actions>
        <v-btn @click.native="viewTx(n.txHash)">View TX</v-btn>
        <v-btn @click.native="clear(index)">Clear</v-btn>
      </v-card-actions>
    </v-card>
  </v-list-tile>
</v-list>
</template>

<script>
export default {
  name: 'notifications',
  props: ['close'],
  methods: {
    iconify: function (status) {
      return ({
        warn: 'warning',
        error: 'error',
        ok: 'check_circle'
      })[status]
    },
    format: function (type) {
      return ({
        commitTx: 'Commit Transaction'
      })[type]
    },
    viewTx: function(txHash) {
      window.open('https://' + this.prefix + 'etherscan.io/tx/' + txHash)
    },
    clear: function(index) {
      this.$store.commit('clearNotification', index)
    },
    clearAll: function() {
      this.$store.commit('clearNotifications')
    }
  },
  computed: {
    prefix: function() {
      return (this.$store.state.web3.base && this.$store.state.web3.base.network !== 'main')
        ? (this.$store.state.web3.base.network + '.') : ''
    },
    notifications: function () {
      return this.$store.state.notifications;
    }
  }
}
</script>

<style scoped>
.notification {
  width: 100%;
}

.clearall {
  margin: 0;
  font-size: 0.7em;
}

.icon {
  left: 0.2em;
  position: relative;
  bottom: 0.15em;
}

.ok {
  color: green !important;
}

.warn {
  color: yellow !important;
}

.error {
  color: red !important;
}
</style>
