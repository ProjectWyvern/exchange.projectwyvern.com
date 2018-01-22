<template>
<v-container>
  <v-layout row wrap>
    <v-flex xs12 md6>
      <div class="header">
      <v-icon style="margin-right: 0.5em;">device_hub</v-icon>
      Exchange
      </div>
      <div v-if="!ready" style="margin-top: 2em; text-align: center;">
        <v-progress-circular size="40" v-bind:indeterminate="true"></v-progress-circular>
      </div>
      <div v-if="ready && !proxy" style="padding-top: 2em; text-align: center;">
      <v-btn @click.native="registerProxy">Initialize Account</v-btn>
      </div>
      <v-layout row wrap>
        <v-flex v-for="(asset, index) in proxyAssets" xs12 md6 lg6 :key="index">
          <asset style="margin: 0 auto; margin-bottom: 1em;" :metadata="asset.schema.formatter(asset.asset)"></asset>
        </v-flex>
      </v-layout>
    </v-flex>
    <v-flex xs12 md6>
      <div class="header">
      <v-icon style="margin-right: 0.5em;">person</v-icon>
      Personal
      </div>
      <div v-if="!ready" style="margin-top: 2em; text-align: center;">
        <v-progress-circular size="40" v-bind:indeterminate="true"></v-progress-circular>
      </div>
      <div :style="containerStyle">
      <v-layout row wrap>
        <v-flex v-for="(asset, index) in personalAssets" xs12 md6 lg6 :key="index">
          <v-tooltip bottom>
            <asset @click.native="deposit(asset)" hover slot="activator" style="margin: 0 auto; margin-bottom: 1em;" :metadata="asset.schema.formatter(asset.asset)"></asset>
            <span>Click to deposit asset to Exchange</span>
          </v-tooltip>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
// https://github.com/SortableJS/Vue.Draggable
import Asset from '../components/Asset'

export default {
  components: { Asset },
  metaInfo: {
    title: 'Assets'
  },
  methods: {
    registerProxy: function() {
      this.$store.dispatch('registerProxy', { params: [], onError: console.log, onTxHash: console.log, onConfirm: console.log })
    },
    deposit: function(asset) {
      const abi = asset.schema.functions.transfer
      console.log('deposit', asset, abi, this.$store.state.web3.proxy)
      this.$store.dispatch('rawSend', { abi: abi, params: [this.$store.state.web3.proxy, asset.asset.toNumber()], onError: console.log, onTxHash: console.log, onConfirm: console.log })
    }
  },
  computed: {
    ready: function() {
      return this.$store.state.web3.proxy !== undefined
    },
    proxy: function() {
      return this.$store.state.web3.proxy
    },
    containerStyle: function() {
      return {
        maxHeight: (window.innerHeight - 220) + 'px', 
        overflow: 'auto'
      }
    },
    personalAssets: function() {
      return this.assets.filter(a => !a.proxy)
    },
    proxyAssets: function() {
      return this.assets.filter(a => a.proxy)
    },
    assets: function() {
      return this.$store.state.web3.assets || []
    }
  }
}
</script>

<style scoped>
.header {
  font-size: 1.3em;
  text-align: center;
  margin-bottom: 1em;
}
</style>
