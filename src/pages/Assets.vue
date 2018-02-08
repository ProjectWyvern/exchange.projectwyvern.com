<template>
<v-container>
  <v-dialog v-model="transferDialog" max-width="500px">
    <v-card>
      <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
        Transfer Asset
      </v-card-title>
      <v-card-text>
      <v-text-field style="max-width: 400px;" v-model="transferTarget" label="Destination address" name="transferTarget"></v-text-field>
      <div v-if="transferTarget !== ''">This will transfer ownership of {{ transferAsset ? transferAsset.schema.formatter(transferAsset.asset).title : '' }} to {{ transferTarget }}.</div>
      </v-card-text>
    <v-card-actions>
      <v-btn color="primary" :disabled="transferTarget === ''" @click.stop="transfer()">Transfer</v-btn>
      <v-btn color="primary" flat @click.stop="transferDialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-layout row wrap>
    <v-flex xs12 md6>
      <div class="header">
      <div class="header-start">
      <v-icon style="margin-right: 0.5em;">device_hub</v-icon>
      Exchange <i style="font-size: 0.8em">(sorted by recency)</i>
      </div>
      <v-text-field style="max-width: 200px; display: inline-block;" v-model="exchangeFilter" label="Filter by name" name="exchangeFilter"></v-text-field>
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
          <router-link :to="'/assets/abc'">
            <asset hover style="margin: 0 auto; margin-bottom: 1em;" :metadata="asset.schema.formatter(asset.asset)" :schema="asset.schema.name" :menu="makeMenu(asset)"></asset>
          </router-link>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
    <v-flex xs12 md6>
      <div class="header">
      <div class="header-start">
      <v-icon style="margin-right: 0.5em;">person</v-icon>
      Personal <i style="font-size: 0.8em">(sorted by recency)</i>
      </div>
      <v-text-field style="max-width: 200px; display: inline-block;" v-model="personalFilter" label="Filter by name" name="personalFilter"></v-text-field>
      </div>
      <div v-if="!ready" style="margin-top: 2em; text-align: center;">
        <v-progress-circular size="40" v-bind:indeterminate="true"></v-progress-circular>
      </div>
      <div :style="containerStyle">
      <v-layout row wrap>
        <v-flex v-for="(asset, index) in personalAssets" xs12 md6 lg6 :key="index">
          <router-link :to="'/assets/abc'">
            <asset hover style="margin: 0 auto; margin-bottom: 1em;" :metadata="asset.schema.formatter(asset.asset)" :schema="asset.schema.name" :menu="makeMenu(asset)"></asset>
          </router-link>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
import Asset from '../components/Asset'

import { encodeBuy, encodeCall } from 'wyvern-schemas'

export default {
  components: { Asset },
  metaInfo: {
    title: 'Account Assets'
  },
  data: function () {
    return {
      personalFilter: '',
      exchangeFilter: '',
      transferDialog: false,
      transferAsset: null,
      transferTarget: ''
    }
  },
  methods: {
    registerProxy: function () {
      this.$store.dispatch('registerProxy', { params: [], onError: console.log, onTxHash: console.log, onConfirm: console.log })
    },
    withdraw: function (asset, to) {
      const { target, calldata } = encodeBuy(asset.schema, asset.asset, to || this.$store.state.web3.base.account)
      const proxyABI = {'constant': false, 'inputs': [{'name': 'dest', 'type': 'address'}, {'name': 'howToCall', 'type': 'uint8'}, {'name': 'calldata', 'type': 'bytes'}], 'name': 'proxyAssert', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}
      const data = encodeCall(proxyABI, [target, 0, Buffer.from(calldata.slice(2), 'hex')])
      this.$store.dispatch('rawSend', { target: this.$store.state.web3.proxy, data: data, amount: 0, onError: console.log, onTxHash: console.log, onConfirm: console.log })
    },
    deposit: function (asset, to) {
      const abi = asset.schema.functions.transfer(asset.asset)
      const recipient = abi.inputs.filter(i => i.kind === 'replaceable')[0]
      recipient.value = to || this.$store.state.web3.proxy
      const params = abi.inputs.map(i => i.value.toString())
      const data = encodeCall(abi, params)
      this.$store.dispatch('rawSend', { target: abi.target, data: data, amount: 0, onError: console.log, onTxHash: console.log, onConfirm: console.log })
    },
    transfer: function () {
      const asset = this.transferAsset
      if (asset.proxy) this.withdraw(asset, this.transferTarget)
      else this.deposit(asset, this.transferTarget)
      this.transferAsset = null
      this.transferDialog = false
    },
    makeMenu: function (asset) {
      const transfer = () => { this.transferAsset = asset; this.transferDialog = true }
      return {
        items: [
          asset.proxy ? {title: 'Withdraw', func: () => this.withdraw(asset)} : {title: 'Deposit', func: () => this.deposit(asset)},
          {title: 'Transfer', func: transfer}
        ]
      }
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
        maxHeight: (window.innerHeight - 270) + 'px',
        overflow: 'auto'
      }
    },
    personalAssets: function () {
      return this.assets.filter(a => !a.proxy).filter(a => {
        const title = a.schema.formatter(a.asset).title.toLowerCase()
        return title.indexOf(this.personalFilter.toLowerCase()) !== -1
      })
    },
    proxyAssets: function () {
      return this.assets.filter(a => a.proxy).filter(a => {
        const title = a.schema.formatter(a.asset).title.toLowerCase()
        return title.indexOf(this.exchangeFilter.toLowerCase()) !== -1
      })
    },
    assets: function () {
      return this.$store.state.web3.assets || []
    }
  }
}
</script>

<style scoped>
.header {
  width: 100%;
  font-size: 1.3em;
  text-align: center;
  margin-bottom: 1em;
}

.header-start {
  display: inline-block;
  margin-left: 2em;
  margin-right: 1em;
  position: relative;
  bottom: 2em;
}
</style>
