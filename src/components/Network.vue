<template>
<v-list dense>
  <v-list-tile>
    <v-list-tile-content style="font-size: 1.5em; font-variant: small-caps">
      <span style="margin: 0 auto;">Network Configuration</span>
    </v-list-tile-content>
  </v-list-tile>
  <v-list-tile style="height: 60px; margin-top: 10px;">
    <v-list-tile-content style="height: 60px;">
      <v-progress-linear v-if="!network" v-bind:indeterminate="true"></v-progress-linear>
      <span v-if="network" style="font-size: 1.0em; margin: 0 auto;">Connected to {{ network }}</span>
      <span v-if="network && blockNumber" style="font-size: 1.0em; margin: 0 auto;">Block {{ blockNumber }}</span>
      <span v-if="network && latency" style="font-size: 1.0em; margin: 0 auto;">Latency {{ latency }}s</span>
    </v-list-tile-content>
  </v-list-tile>
  <br />
  <v-list-tile>
    <v-list-tile-content>
      <v-select v-bind:items="providers" v-model="provider" label="Web3 Provider" item-value="value" item-text="text"></v-select>
    </v-list-tile-content>
  </v-list-tile>
  <br />
  <v-list-tile>
    <v-list-tile-content>
      <v-select v-bind:items="servers" v-model="server" label="Orderbook Server" item-value="value" item-text="text"></v-select>
    </v-list-tile-content>
  </v-list-tile>
</v-list>
</template>

<script>
const capitalize = (str) => {
  return str[0].toUpperCase() + str.slice(1)
}

export default {
  name: 'network',
  props: ['close'],
  data: function() {
    return {
      providers: [
        {text: 'Injected (Metamask/Parity)', value: 'injected'},
        {text: 'Localhost (Testing)', value: 'http://localhost:8545'},
        {text: 'Infura [Rinkeby]', value: 'https://rinkeby.infura.io/'}
      ],
      servers: [
        {text: 'Localhost (Testing)', value: 'http://127.0.0.1:8080'},
        {text: 'Wyvern Exchange [Rinkeby]', value: 'http://37.187.38.165:8080'}
      ]
    }
  },
  computed: {
    network: function() {
      return this.$store.state.web3.base ? capitalize(this.$store.state.web3.base.network) : null
    },
    blockNumber: function() {
      return this.$store.state.web3.base ? this.$store.state.web3.base.blockNumber : null
    },
    latency: function() {
      return Math.round(this.$store.state.web3.latency * 1000) / 1000
    },
    provider: {
      get: function() {
        return this.$store.state.settings.web3Provider
      },
      set: function(v) {
        this.$store.commit('setWeb3Provider', v)
      }
    },
    server: {
      get: function() {
        return this.$store.state.settings.orderbookServer
      },
      set: function(v) {
        this.$store.commit('setOrderbookServer', v)
      }
    }
  },
}
</script>

<style scoped>
</style>
