<template>
<v-container>
  <v-layout row wrap>
    <v-flex xs12 md6>
      <div class="header">
      <v-icon style="margin-right: 0.5em;">device_hub</v-icon>
      Exchange <i style="font-size: 0.8em">(sorted by recency)</i>
      </div>
      <div v-if="!ready" style="margin-top: 2em; text-align: center;">
        <v-progress-circular size="40" v-bind:indeterminate="true"></v-progress-circular>
      </div>
      <div v-if="ready && !proxy" style="padding-top: 2em; text-align: center;">
      <v-btn @click.stop="registerProxy">Initialize Account</v-btn>
      </div>
      <div :style="containerStyle">
      <v-layout row wrap>
        <v-flex v-for="(asset, index) in proxyAssets" xs12 md6 lg6 :key="index">
          <v-tooltip bottom>
            <asset @click.native="withdraw(asset)" hover slot="activator" style="margin: 0 auto; margin-bottom: 1em;" :metadata="asset.schema.formatter(asset.asset)" :schema="asset.schema.name"></asset>
            <span>Click to withdraw asset from Exchange</span>
          </v-tooltip>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
    <v-flex xs12 md6>
      <div class="header">
      <v-icon style="margin-right: 0.5em;">person</v-icon>
      Personal <i style="font-size: 0.8em">(sorted by recency)</i>
      </div>
      <div v-if="!ready" style="margin-top: 2em; text-align: center;">
        <v-progress-circular size="40" v-bind:indeterminate="true"></v-progress-circular>
      </div>
      <div :style="containerStyle">
      <v-layout row wrap>
        <v-flex v-for="(asset, index) in personalAssets" xs12 md6 lg6 :key="index">
          <v-tooltip bottom>
            <asset @click.native="deposit(asset)" hover slot="activator" style="margin: 0 auto; margin-bottom: 1em;" :metadata="asset.schema.formatter(asset.asset)" :schema="asset.schema.name"></asset>
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

import { encodeBuy, encodeCall } from 'wyvern-schemas'

export default {
  components: { Asset },
  metaInfo: {
    title: 'Account Assets'
  },
  methods: {
    registerProxy: function () {
      this.$store.dispatch('registerProxy', { params: [], onError: console.log, onTxHash: console.log, onConfirm: console.log })
    },
    withdraw: function (asset) {
      const { target, calldata } = encodeBuy(asset.schema, asset.asset, this.$store.state.web3.base.account)
      const proxyABI = {'constant': false, 'inputs': [{'name': 'dest', 'type': 'address'}, {'name': 'howToCall', 'type': 'uint8'}, {'name': 'calldata', 'type': 'bytes'}], 'name': 'proxyAssert', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}
      const data = encodeCall(proxyABI, [target, 0, Buffer.from(calldata.slice(2), 'hex')])
      this.$store.dispatch('rawSend', { target: this.$store.state.web3.proxy, data: data, amount: 0, onError: console.log, onTxHash: console.log, onConfirm: console.log })
    },
    deposit: function (asset) {
      const abi = asset.schema.functions.transfer(asset.asset)
      const recipient = abi.inputs.filter(i => i.kind === 'replaceable')[0]
      recipient.value = this.$store.state.web3.proxy
      const params = abi.inputs.map(i => i.value.toString())
      const data = encodeCall(abi, params)
      this.$store.dispatch('rawSend', { target: abi.target, data: data, amount: 0, onError: console.log, onTxHash: console.log, onConfirm: console.log })
    }
  },
  computed: {
    ready: function () {
      return this.$store.state.web3.proxy !== undefined
    },
    proxy: function () {
      return this.$store.state.web3.proxy
    },
    containerStyle: function () {
      return {
        maxHeight: (window.innerHeight - 220) + 'px',
        overflow: 'auto'
      }
    },
    personalAssets: function () {
      return this.assets.filter(a => !a.proxy)
    },
    proxyAssets: function () {
      return this.assets.filter(a => a.proxy)
    },
    assets: function () {
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
