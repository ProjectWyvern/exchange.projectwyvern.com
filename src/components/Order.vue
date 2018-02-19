<template>
<v-card :hover="hover" raised style="height: 330px; width: 330px;">
  <div style="height: 15px;"></div>
  <asset class="elevation-0" :schema="schema" :asset="asset || order.asset" style="margin-left: 15px;"></asset>
  <div class="saleInfoOuter">
    <div class="saleInfo">
    <div class="side">{{ side }}</div>
    <div class="kind">{{ kind }}</div>
    <div class="price">{{ price }} {{ token.symbol }}</div>
    <div class="expiry">{{ expiry }}</div>
    </div>
  </div>
</v-card>
</template>

<script>
import moment from 'moment'

import { WyvernProtocol } from '../aux'
import Asset from './Asset'

export default {
  name: 'order',
  components: { Asset },
  props: ['order', 'schema', 'hover', 'asset'],
  computed: {
    token: function () {
      return this.tokens.filter(t => t.address.toLowerCase() === this.order.paymentToken.toLowerCase())[0]
    },
    tokens: function () {
      return this.$store.state.web3.tokens
        ? [].concat.apply(this.$store.state.web3.tokens.canonicalWrappedEther, this.$store.state.web3.tokens.otherTokens)
        : []
    },
    expiry: function () {
      return this.order.settlement ? '' : this.order.expirationTime.equals(0) ? 'No Expiration' : 'Expires ' + moment(this.order.expirationTime.toNumber() * 1000).fromNow()
    },
    side: function () {
      return this.order.settlement ? (this.order.side === 0 ? 'Purchased' : 'Sold') : (this.order.side === 0 ? 'For Purchase' : 'For Sale')
    },
    price: function () {
      return this.token ? parseFloat(WyvernProtocol.toUnitAmount(this.order.basePrice, this.token.decimals)) : 0
    },
    kind: function () {
      return ({
        0: 'Fixed Price',
        1: 'Dutch Auction'
      })[this.order.saleKind]
    }
  }
}
</script>

<style scoped>
.saleInfoOuter {
  width: 100%;
  font-size: 0.9em;
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
