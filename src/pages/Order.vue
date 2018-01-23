<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 4em; text-align: center;" hidden-xs-only>
Order {{ this.$route.params.hash }}
</v-flex>
<v-flex xs12 v-if="!order">
<div style="width: 50px; margin: 0 auto; margin-top: 70px;">
<v-progress-circular v-bind:size="40" v-bind:indeterminate="true" style="margin: 0 auto;"></v-progress-circular>
</div>
</v-flex>
<v-flex xs12 v-if="order">
<asset style="margin: 0 auto;" :metadata="schema.formatter(order.metadata.fields._tokenId)" :schema="schema.name"></asset>
</v-flex>
<v-flex xs12 v-if="order">
<div style="text-align: center; line-height: 4em;">
<div class="saleInfo">
<div class="side">{{ side }}</div>
<div class="expiry">{{ expiry }}</div>
<div class="kind">{{ kind }}</div>
<div class="price">{{ price }} {{ token.symbol }}</div>
</div>
</div>
</v-flex>
<v-flex xs12 v-if="order">
<div style="margin: 0 auto; width: 100px;">
<v-btn raised @click.native="match()">
Match
</v-btn>
</div>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'
import { encodeCall } from 'wyvern-schemas'

import Asset from '../components/Asset'
import { WyvernProtocol } from '../aux'

export default {
  name: 'orderPage',
  components: { Asset },
  metaInfo: {
    title: 'View Order'
  },
  created: function() {
    this.$store.dispatch('fetchOrder', { hash: this.$route.params.hash })
  },
  methods: {
    match: function() {
      const matchFunction = WyvernProtocol.EXCHANGE_ABI.filter(f => f.name === 'atomicMatch_')[0]
      const buy = this.orderToMatch
      const sell = this.order
      this.$store.dispatch('atomicMatch', { buy: buy, sell: sell, onError: console.log, onTxHash: console.log, onConfirm: console.log })
    }
  },
  computed: {
    tokens: function() {
      return this.$store.state.web3.tokens ?
        [].concat(this.$store.state.web3.tokens.canonicalWrappedEther)
        : []
    },
    token: function() {
      return this.tokens.filter(t => t.address.toLowerCase() === this.order.paymentToken.toLowerCase())[0]
    },
    expiry: function() {
      return 'No Expiration'
    },
    side: function() {
      return 'For Sale'
    },
    price: function() {
      return parseFloat(WyvernProtocol.toUnitAmount(this.order.basePrice, this.token.decimals))
    },
    kind: function() {
      return 'Fixed Price'
    },
    schema: function() {
      return !this.order ? null : this.$store.state.web3.schemas.filter(s => s.name === this.order.metadata.schema)[0]
    },
    orderToMatch: function() {
      const account = this.$store.state.web3.base ? this.$store.state.web3.base.account : ''
      const calldata = encodeCall(this.schema.functions.transfer, [account, this.order.metadata.fields._tokenId])
      return !this.order ? {} : {
        exchange: this.order.exchange,
        maker: account,
        taker: WyvernProtocol.NULL_ADDRESS,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        feeRecipient: account,
        side: (this.order.side + 1) % 2,
        saleKind: 0,
        target: this.order.target,
        howToCall: this.order.howToCall,
        calldata: this.order.calldata, // todo fixme
        replacementPattern: this.order.replacementPattern, // todo fixme
        metadataHash: '0x',
        paymentToken: this.order.paymentToken,
        basePrice: this.order.basePrice,
        extra: 0,
        listingTime: new BigNumber(Math.round(Date.now() / 1000)),
        expirationTime: 0,
        salt: WyvernProtocol.generatePseudoRandomSalt(),
        metadata: {} 
      }
    },
    order: function() {
      return this.$store.state.ordersByHash[this.$route.params.hash]
    },
  }
}
</script>

<style scoped>
.saleInfo {
  padding-top: 1.5em;
  padding-bottom: 1.5em;
  padding-left: 0.5em;
  padding-right: 0.5em;
  line-height: 1.5em;
  margin: 0 auto;
}

.side, .kind, .expiry, .price {
  display: inline-block;
  padding-left: 0.4em;
}

.price {
  padding-right: 0.4em;
  background: #000;
  color: #fff;
  font-weight: bold;
}
</style>
