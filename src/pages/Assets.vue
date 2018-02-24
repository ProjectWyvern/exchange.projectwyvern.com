<template>
<v-container>
  <v-dialog v-model="transferDialog" max-width="500px">
    <v-card>
      <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
        Transfer Asset
      </v-card-title>
      <v-card-text>
      <v-text-field style="max-width: 400px;" v-model="transferTarget" label="Destination address" name="transferTarget"></v-text-field>
      <div v-if="transferTarget !== ''">This will transfer ownership of {{ transferAssetTitle }} to {{ transferTarget }}.</div>
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
        <v-flex v-for="(asset, index) in proxyAssets" xs12 xl6 :key="index">
          <router-link :to="'/assets/' + asset.hash">
            <asset hover style="margin: 0 auto; margin-bottom: 1em; width: 300px; height: 350px;" :asset="asset" :schema="asset.schema" :menu="makeMenu(asset, true)"></asset>
          </router-link>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
    <div class="hidden-md-and-up" style="height: 50px; width: 100%;">
    </div>
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
        <v-flex v-for="(asset, index) in personalAssets" xs12 xl6 :key="index">
          <router-link :to="'/assets/' + asset.hash">
            <asset hover style="margin: 0 auto; margin-bottom: 1em; width: 300px; height: 350px;" :asset="asset" :schema="asset.schema" :menu="makeMenu(asset, false)"></asset>
          </router-link>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
import { encodeBuy, encodeCall } from 'wyvern-schemas'

import Asset from '../components/Asset'

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
    transfer: function (proxy) {
      const asset = this.transferAsset
      if (proxy) this.withdraw(asset, this.transferTarget)
      else this.deposit(asset, this.transferTarget)
      this.transferAsset = null
      this.transferDialog = false
    },
    makeMenu: function (asset, proxy) {
      const transfer = () => { this.transferAsset = asset; this.transferDialog = true }
      var items = [
        proxy ? {title: 'Withdraw', func: () => this.withdraw(asset)} : {title: 'Deposit', func: () => this.deposit(asset)},
        {title: 'Transfer', func: () => transfer(proxy)}
      ]
      if (proxy && asset.schema.assetToFields) {
        items.unshift({
          title: 'Sell',
          func: () => {
            const category = this.schemas.filter(s => s.name === asset.schema.name)[0].index
            var query = {category: category, values: encodeURIComponent(JSON.stringify(asset.schema.assetToFields(asset.asset))), side: 'sell', step: 4}
            this.$router.push({path: '/post', query: query})
          }
        })
      }
      return {
        items: items
      }
    }
  },
  asyncComputed: {
    transferAssetTitle: async function () {
      if (!this.transferAsset) return null
      const formatted = await this.transferAsset.schema.formatter(this.transferAsset.asset)
      return formatted.title
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
      return this.$store.state.personalAssets.filter(a => {
        const title = a.formatted.title.toLowerCase()
        return title.indexOf(this.personalFilter.toLowerCase()) !== -1
      })
    },
    proxyAssets: function () {
      return this.$store.state.proxyAssets.filter(a => {
        const title = a.formatted.title.toLowerCase()
        return title.indexOf(this.exchangeFilter.toLowerCase()) !== -1
      })
    },
    schemas: function () {
      return (this.$store.state.web3.schemas || []).map((s, i) => {
        s.index = i
        return s
      })
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
