<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 2em; margin-bottom: 1em; text-align: center;" hidden-xs-only>
Asset {{ hash }}
</v-flex>
<v-flex xs12 v-if="!asset">
<div style="width: 50px; margin: 0 auto; margin-top: 70px;">
<v-progress-circular v-bind:size="40" v-bind:indeterminate="true" style="margin: 0 auto;"></v-progress-circular>
</div>
</v-flex>
<v-flex xs12 v-if="asset">
<asset style="margin: 0 auto; width: 300px;" :schema="schema" :asset="asset"></asset>
<br />
<div class="owner" style="text-align: center;">Owned by <router-link :to="'/accounts/' + asset.owner">{{ asset.owner }}</router-link></div>
</v-flex>
<v-flex xs12 v-if="asset && web3" style="margin-top: 2em;">
<div style="text-align: center; line-height: 2em; margin-bottom: 1em;">Order History</div>
<v-layout row wrap>
<v-flex xs12 v-for="(order, index) in asset.orders" :key="index">
<router-link :to="'/orders/' + order.hash">
<v-card width="400" style="padding: 1em; margin: 0 auto; margin-bottom: 1em;" hover>
{{ which(order) }} for {{ amount(order) }} {{ token(order).symbol }} {{ when(order) }}
</v-card>
</router-link>
</v-flex>
</v-layout>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import { WyvernProtocol } from 'wyvern-js'
import moment from 'moment'

import Asset from '../components/Asset'
import { wyvernExchange } from '../aux'

export default {
  name: 'assetPage',
  components: { Asset },
  metaInfo: function () {
    return {
      title: this.asset ? this.asset.formatted.title : 'View Asset'
    }
  },
  data: function () {
    return {
      hash: this.$route.params.hash,
      asset: null
    }
  },
  created: async function () {
    const asset = await wyvernExchange.asset(this.hash)
    this.asset = asset
  },
  computed: {
    web3: function () {
      return !!this.$store.state.web3.tokens
    },
    schema: function () {
      return !this.asset ? null : (this.$store.state.web3.schemas || []).filter(s => s.name === this.asset.schema)[0]
    },
    tokens: function () {
      return !this.$store.state.web3.tokens ? [] : [].concat.apply(this.$store.state.web3.tokens.canonicalWrappedEther, this.$store.state.web3.tokens.otherTokens)
    }
  },
  methods: {
    which: function (order) {
      return order.settlement ? (order.side === 0 ? 'Purchased' : 'Sold') : (order.side === 0 ? 'For purchase' : 'For sale')
    },
    token: function (order) {
      return this.tokens.filter(t => t.address.toLowerCase() === order.paymentToken.toLowerCase())[0]
    },
    amount: function (order) {
      return parseFloat(WyvernProtocol.toUnitAmount(order.settlement ? order.settlement.price : order.basePrice, this.token(order).decimals))
    },
    when: function (order) {
      return order.settlement ? moment(order.settlement.timestamp * 1000).fromNow() : (order.cancelledOrFinalized ? '(cancelled)' : '(active)')
    }
  }
}
</script>

<style scoped>
.owner a { 
  color: #E12D32;
}

.owner a:hover {
  text-decoration: underline;
}
</style>
