<template>
<v-container>
<v-dialog v-model="matchDialog" max-width="500px">
  <v-card>
    <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
      Matching Order
    </v-card-title>
    <v-card-text>
      <div>
        <v-progress-circular v-bind:size="20" style="margin-left: 10px; margin-right: 10px; top: 5px;" v-if="matchStage === 'checking' && !checkFailed" v-bind:indeterminate="true"></v-progress-circular>
        <v-icon v-if="matchStage === 'checking' && checkFailed" style="color: red; margin-left: 10px; margin-right: 10px;">error</v-icon>
        <v-icon v-if="matchStage !== 'checking'" style="color: green; margin-left: 10px; margin-right: 10px;">check_circle</v-icon>
        <span v-if="!checkError">Checking order parameters and token balances...</span>
        <span v-if="checkError">{{ checkError }}</span>
      </div>
      <br />
      <div v-if="matchStage !== 'checking'">
        <v-progress-circular v-bind:size="20" style="margin-left: 10px; margin-right: 10px; top: 5px;" v-if="matchStage === 'simulating' && !simulationFailed" v-bind:indeterminate="true"></v-progress-circular>
        <v-icon v-if="matchStage === 'simulating' && simulationFailed" style="color: red; margin-left: 10px; margin-right: 10px;">error</v-icon>
        <v-icon v-if="matchStage === 'matching' || matchStage === 'settled'" style="color: green; margin-left: 10px; margin-right: 10px;">check_circle</v-icon>
        <span v-if="!simulationFailed">Simulating order settlement...</span>
        <span v-if="simulationFailed">Match simulation failed. Order may have already been matched.</span>
      </div>
      <br />
      <div v-if="matchStage === 'matching' || matchStage === 'settled'">
        <v-progress-circular v-bind:size="20" style="margin-left: 10px; margin-right: 10px; top: 5px;" v-if="matchStage === 'matching'" v-bind:indeterminate="true"></v-progress-circular>
        <v-icon v-if="matchStage === 'settled'" style="color: green; margin-left: 10px; margin-right: 10px;">check_circle</v-icon>
        <span v-if="matchStage === 'matching'">
          Matching order...
          <span v-if="!matchTx">You will need to approve the transaction.</span>
          <v-btn flat v-if="matchTx" target="_blank" :href="getUrl(matchTx)" style="">View Transaction</v-btn>
        </span>
        <span v-if="matchStage === 'settled'">{{ order.asset.formatted.title }} has been transferred.</span>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" flat @click.stop="matchDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
<v-dialog v-model="cancelDialog" max-width="500px">
  <v-card>
    <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
      Cancelling Order
    </v-card-title>
    <v-card-text v-if="cancelled">
      <v-icon style="color: green; margin-left: 10px; margin-right: 10px;">
      check_circle
      </v-icon>
      Order cancelled.
    </v-card-text>
    <v-card-text v-else-if="cancelFailed">
      Transaction rejected, this order may have already been matched or cancelled.
    </v-card-text>
    <v-card-text v-else-if="cancelling">
      <v-progress-circular v-bind:size="40" style="margin-left: 20px;" v-bind:indeterminate="true"></v-progress-circular> 
      <div v-if="!cancelTx" style="margin-top: 1em; margin-left: 1em;">You will need to approve the transaction.</div><br />
      <v-btn v-if="cancelTx" target="_blank" :href="getUrl(cancelTx)" style="margin-top: 2em;">View Transaction</v-btn>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" flat @click.stop="cancelDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
<v-layout row wrap>
<v-flex xs12 style="line-height: 2em; margin-bottom: 1em; text-align: center;" hidden-xs-only>
Order {{ hash }}
</v-flex>
<v-flex xs12 v-if="!order">
<div style="width: 50px; margin: 0 auto; margin-top: 70px;">
<v-progress-circular v-bind:size="40" v-bind:indeterminate="true" style="margin: 0 auto;"></v-progress-circular>
</div>
</v-flex>
<v-flex xs12 v-if="order">
<router-link :to="'/assets/' + order.asset.hash">
<asset style="height: 350px; width: 300px; margin: 0 auto;" :schema="schema" :asset="order.asset"></asset>
</router-link>
</v-flex>
<v-flex xs12 v-if="order && order.settlement">
<div style="text-align: center; line-height: 4em;">
<div class="saleInfo">
<div class="side">{{ side }}</div>
{{ expiry }} by <router-link :to="'/accounts/' + order.settlement.maker">{{ order.settlement.maker }}</router-link> <br />to <router-link :to="'/accounts/' + order.settlement.taker">{{ order.settlement.taker }}</router-link> for
<div v-if="price !== null" class="price">{{ price }} {{ token.symbol }}</div>
</div>
<v-btn target="_blank" :href="transactionUrl">View Transaction</v-btn>
</div>
</v-flex>
<v-flex xs12 v-if="order && !order.settlement">
<div style="text-align: center; line-height: 4em;">
<div class="saleInfo">
<div class="side">{{ side }} by <router-link :to="'/accounts/' + order.maker">{{ order.maker }}</router-link></div>
<div class="expiry">{{ expiry }}</div>
<div class="kind">{{ kind }}</div>
<div v-if="price !== null" class="price">{{ price }} {{ token.symbol }}</div>
</div>
</div>
</v-flex>
<v-flex xs12 v-if="order && !order.settlement && order.cancelledOrFinalized">
<div style="margin: 0 auto; width: 200px;">
This order has been cancelled.
</div>
</v-flex>
<v-flex xs12 v-else-if="order && !order.settlement">
<div style="margin: 0 auto; width: 100px;">
<v-btn v-if="mine" raised @click.native="cancel()">Cancel</v-btn>
<v-btn v-if="!mine" raised @click.native="match()">Match</v-btn>
</div>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'
import moment from 'moment'
import { encodeBuy, encodeSell } from 'wyvern-schemas'

import Asset from '../components/Asset'
import { WyvernProtocol } from '../aux'

export default {
  name: 'orderPage',
  components: { Asset },
  metaInfo: function () {
    return {
      title: this.order ? this.order.asset.formatted.title : 'View Order'
    }
  },
  created: function () {
    this.$store.dispatch('fetchOrder', { hash: this.hash })
  },
  destroyed: function () {
    this.$store.commit('untrackOrder', this.hash)
  },
  data: function () {
    return {
      matchDialog: false,
      matchStage: null,
      matchTx: null,
      cancelDialog: false,
      cancelTx: null,
      cancelFailed: false,
      cancelling: false,
      cancelled: false,
      simulationFailed: false,
      checkFailed: false,
      checkError: null,
      hash: this.$route.params.hash
    }
  },
  methods: {
    cancel: function () {
      const onTxHash = (txHash) => { this.cancelTx = txHash }
      const onConfirm = () => { this.cancelled = true; this.$store.dispatch('fetchOrder', { hash: this.hash }) }
      const onError = () => { this.cancelFailed = true }
      this.cancelling = true
      this.cancelled = false
      this.cancelFailed = false
      this.cancelDialog = true
      this.$store.dispatch('cancelOrder', { order: this.order, onTxHash: onTxHash, onConfirm: onConfirm, onError: onError })
    },
    match: function () {
      const buy = this.order.side === 0 ? this.order : this.orderToMatch
      const sell = this.order.side === 0 ? this.orderToMatch : this.order
      const onCheck = (ok, err) => { this.checkFailed = !ok; if (!err) this.matchStage = 'simulating'; this.checkError = err }
      const onTxHash = (txHash) => { this.matchStage = 'matching'; this.matchTx = txHash }
      const onConfirm = (success) => { this.matchStage = 'settled'; this.$store.dispatch('fetchOrder', { hash: this.hash }) }
      const onError = (err) => { console.log(err); this.simulationFailed = true }
      this.matchStage = 'checking'
      this.simulationFailed = false
      this.checkFailed = false
      this.matchDialog = true
      this.$store.dispatch('atomicMatch', { buy: buy, sell: sell, onCheck: onCheck, onError: onError, onTxHash: onTxHash, onConfirm: onConfirm })
    },
    getUrl: function (hash) {
      const prefix = (this.$store.state.web3.base && this.$store.state.web3.base.network !== 'main')
        ? (this.$store.state.web3.base.network + '.') : ''
      return 'https://' + prefix + 'etherscan.io/tx/' + hash
    }
  },
  computed: {
    transactionUrl: function () {
      const hash = this.order.settlement ? this.order.settlement.transactionHashIndex.slice(0, 66) : ''
      const prefix = (this.$store.state.web3.base && this.$store.state.web3.base.network !== 'main')
        ? (this.$store.state.web3.base.network + '.') : ''
      return 'https://' + prefix + 'etherscan.io/tx/' + hash
    },
    tokens: function () {
      return this.$store.state.web3.tokens
        ? [].concat(this.$store.state.web3.tokens.canonicalWrappedEther, this.$store.state.web3.tokens.otherTokens)
        : []
    },
    token: function () {
      return !this.order ? '' : this.tokens.filter(t => t.address.toLowerCase() === this.order.paymentToken.toLowerCase())[0]
    },
    expiry: function () {
      return !this.order ? '' : (this.order.settlement ? moment(this.order.settlement.timestamp * 1000).fromNow() : this.order.expirationTime.equals(0) ? 'No Expiration' : 'Expires at ' + (new Date(this.order.expirationTime.toNumber() * 1000)).toString())
    },
    side: function () {
      return this.order.settlement ? (this.order.side === 0 ? 'Purchased' : 'Sold') : (this.order.side === 0 ? 'For purchase' : 'For sale')
    },
    price: function () {
      return this.token ? (this.order.settlement ? parseFloat(WyvernProtocol.toUnitAmount(this.order.settlement.price, this.token.decimals)) : (this.order && this.order.currentPrice ? parseFloat(WyvernProtocol.toUnitAmount(this.order.currentPrice, this.token.decimals)) : null)) : null
    },
    kind: function () {
      return !this.order ? '' : ({
        0: 'Fixed Price',
        1: 'Dutch Auction'
      })[this.order.saleKind]
    },
    schema: function () {
      return (!this.order || !this.$store.state.web3.schemas) ? null : this.$store.state.web3.schemas.filter(s => s.name === this.order.metadata.schema)[0]
    },
    mine: function () {
      return this.order && this.$store.state.web3.base && this.order.maker === this.$store.state.web3.base.account
    },
    orderToMatch: function () {
      if (!this.order || !this.$store.state.web3.base || !this.schema) return {}
      const account = this.$store.state.web3.base.account
      const { target, calldata, replacementPattern } = this.order.side === 0 ? encodeSell(this.schema, this.order.metadata.asset) : encodeBuy(this.schema, this.order.metadata.asset, account)
      return {
        exchange: this.order.exchange,
        maker: account,
        taker: WyvernProtocol.NULL_ADDRESS,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        feeRecipient: WyvernProtocol.NULL_ADDRESS,
        side: (this.order.side + 1) % 2,
        saleKind: 0,
        target: target,
        howToCall: this.order.howToCall,
        calldata: calldata,
        replacementPattern: replacementPattern,
        staticTarget: WyvernProtocol.NULL_ADDRESS,
        staticExtradata: '0x',
        paymentToken: this.order.paymentToken,
        basePrice: this.order.basePrice,
        extra: 0,
        listingTime: new BigNumber(Math.round(Date.now() / 1000 - 1000)),
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

.saleInfo a {
  color: blue;
}

.saleInfo a:hover {
  text-decoration: underline;
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
