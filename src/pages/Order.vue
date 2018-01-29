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
<asset style="margin: 0 auto;" :metadata="metadata" :schema="schema.name"></asset>
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
<v-btn v-if="!matching && !matched" raised @click.native="match()">
Match
</v-btn>
<v-progress-circular v-bind:size="40" style="margin-left: 20px;" v-if="matching && !matched" v-bind:indeterminate="true"></v-progress-circular>
<v-icon v-if="matched" style="color: green; margin-left: 30px;">
check_circle
</v-icon>
</div>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'
import { encodeBuy, encodeSell } from 'wyvern-schemas'

import Asset from '../components/Asset'
import { WyvernProtocol } from '../aux'

export default {
  name: 'orderPage',
  components: { Asset },
  metaInfo: {
    title: 'View Order'
  },
  created: function () {
    this.$store.dispatch('fetchOrder', { hash: this.$route.params.hash })
  },
  destroyed: function () {
    this.$store.commit('untrackOrder', this.hash)
  },
  data: function () {
    return {
      matching: false,
      matched: false,
      hash: this.$route.params.hash
    }
  },
  methods: {
    match: function () {
      const buy = this.order.side === 0 ? this.order : this.orderToMatch
      const sell = this.order.side === 0 ? this.orderToMatch : this.order
      const onTxHash = () => { this.matching = true }
      const onConfirm = () => { this.matched = true }
      this.$store.dispatch('atomicMatch', { buy: buy, sell: sell, onError: console.log, onTxHash: onTxHash, onConfirm: onConfirm })
    }
  },
  computed: {
    metadata: function () {
      return !this.schema ? {} : this.schema.formatter(this.order.metadata.nft)
    },
    tokens: function () {
      return this.$store.state.web3.tokens
        ? [].concat(this.$store.state.web3.tokens.canonicalWrappedEther)
        : []
    },
    token: function () {
      return !this.order ? '' : this.tokens.filter(t => t.address.toLowerCase() === this.order.paymentToken.toLowerCase())[0]
    },
    expiry: function () {
      return !this.order ? '' : (this.order.expirationTime.equals(0) ? 'No Expiration' : 'Expires at ' + (new Date(this.order.expirationTime.toNumber())).toString())
    },
    side: function () {
      return !this.order ? '' : (this.order.side === 0 ? 'For Purchase' : 'For Sale')
    },
    price: function () {
      return parseFloat(WyvernProtocol.toUnitAmount(this.order.basePrice, this.token.decimals))
    },
    kind: function () {
      return !this.order ? '' : ({
        0: 'Fixed Price',
        1: 'English Auction',
        2: 'Dutch Auction'
      })[this.order.saleKind]
    },
    schema: function () {
      return (!this.order || !this.$store.state.web3.schemas) ? null : this.$store.state.web3.schemas.filter(s => s.name === this.order.metadata.schema)[0]
    },
    orderToMatch: function () {
      if (!this.order || !this.$store.state.web3.base || !this.schema) return {}
      const account = this.$store.state.web3.base.account
      const { target, calldata, replacementPattern } = this.order.side === 0 ? encodeSell(this.schema, this.order.metadata.nft) : encodeBuy(this.schema, this.order.metadata.nft, account)
      return {
        exchange: this.order.exchange,
        maker: account,
        taker: WyvernProtocol.NULL_ADDRESS,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        feeRecipient: account,
        side: (this.order.side + 1) % 2,
        saleKind: 0,
        target: target,
        howToCall: this.order.howToCall,
        calldata: calldata,
        replacementPattern: replacementPattern,
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
    order: function () {
      return this.$store.state.ordersByHash[this.$route.params.hash]
    }
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
