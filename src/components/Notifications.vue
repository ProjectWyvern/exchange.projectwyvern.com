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
  <v-list-tile v-for="(n, index) in notifications" :key="index" class="tile">
    <v-card class="notification">
      <v-card-title>
        <span>{{ format(n.type) }}</span>
        <v-icon v-if="n.finalized" style="margin-left: 5px;" :class="'icon icon-' + n.status">{{ iconify(n.status) }}</v-icon>
        <v-progress-circular style="margin-left: 10px;" v-bind:indeterminate="true" size="20" v-if="!n.finalized"></v-progress-circular>
      </v-card-title>
      <v-card-actions>
        <v-btn class="nbtn" flat @click.native="viewTx(n.txHash)">View TX</v-btn>
        <v-btn class="nbtn" flat :disabled="n.finalized" @click.native="adjustTx(n.txHash)">Adjust TX</v-btn>
        <v-btn class="nbtn" flat @click.native="clear(index)">Clear</v-btn>
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
.tile {
  height: 120px;
}

.notification {
  width: 100%;
}

.nbtn {
  font-size: 1.0em;
  max-width: 80px;
  height: 30px;
  margin: 0;
}

.clearall {
  margin: 0;
  margin-left: 0.4em;
  height: 25px;
  font-size: 0.6em;
}

.icon {
  left: 0.2em;
  position: relative;
  bottom: 0.15em;
}

.icon-ok {
  color: green !important;
}

.icon-warn {
  color: yellow !important;
}

.icon-error {
  color: red !important;
}
</style>
