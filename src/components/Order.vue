<template>
<v-card :hover="hover" raised style="height: 350px; width: 350px;">
  <div style="height: 15px;"></div>
  <asset class="elevation-0" :schema="schema" :metadata="metadata" style="margin-left: 25px"></asset>
  <div class="saleInfoOuter">
    <div class="saleInfo">
    <div class="side">{{ side }}</div>
    <div class="expiry">{{ expiry }}</div>
    <div class="kind">{{ kind }}</div>
    <div class="price">{{ price }} {{ token.symbol }}</div>
    </div>
  </div>
  <v-card-actions v-if="signature">
    <v-btn flat>Details</v-btn>
    <v-btn flat>Match</v-btn>
  </v-card-actions>
</v-card>
</template>

<script>
import BigNumber from 'bignumber.js'

import { WyvernProtocol } from '../aux'
import Asset from './Asset'

export default {
  name: 'order',
  components: { Asset },
  props: ['order', 'schema', 'asset', 'metadata', 'signature', 'hover'],
  computed: {
    token: function() {
      return this.tokens.filter(t => t.address.toLowerCase() === this.order.paymentToken.toLowerCase())[0]
    },
    tokens: function() {
      return this.$store.state.web3.tokens ?
        [].concat(this.$store.state.web3.tokens.canonicalWrappedEther)
        : []
    },
    expiry: function() {
      return this.order.expirationTime.equals(0) ? 'No Expiration' : 'Expires at ' + this.order.expirationTime
    },
    side: function() {
      return this.order.side === 0 ? 'For Purchase' : 'For Sale'
    },
    price: function() {
      return parseFloat(WyvernProtocol.toUnitAmount(this.order.basePrice, this.token.decimals))
    },
    kind: function() {
      return ({
        0: 'Fixed Price',
        1: 'English Auction',
        2: 'Dutch Auction'
      })[this.order.saleKind]
    }
  }
}
</script>

<style scoped>
.saleInfoOuter {
  width: 100%;
}

.saleInfo {
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
  float: right;
  padding-right: 0.4em;
  background: #000;
  color: #fff;
  font-weight: bold;
}

.hash {
  text-align: center;
  line-height: 1.5em;
  padding-bottom: 0.2em;
  font-size: 1.0em;
}
</style>
