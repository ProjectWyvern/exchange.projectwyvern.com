<template>
<v-container>
<v-dialog v-model="postDialog" max-width="500px">
  <v-card>
    <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
      Post Order
    </v-card-title>
    <v-card-text v-if="posted">
      <v-icon style="color: green; margin-left: 10px; margin-right: 10px;">
      check_circle
      </v-icon>
      Order posted, redirecting.
    </v-card-text>
    <v-card-text v-else-if="postFailed">
      Error: {{ postError }}<br />
      If you're trying to sell an asset, ensure you own the asset and that you've deposited it to your Exchange account.
    </v-card-text>
    <v-card-text v-else-if="posting">
      <v-progress-circular v-bind:size="15" style="margin-left: 10px; margin-right: 10px;" v-bind:indeterminate="true"></v-progress-circular> 
      <span v-if="authorizing">Authorize the order by signing it in Metamask.</span>
      <span v-if="!authorizing">Order authorized, posting to orderbook.</span>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" flat @click.stop="postDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
<v-dialog v-model="depositDialog" max-width="500px">
  <v-card>
    <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
      Deposit Asset
    </v-card-title>
    <v-card-text v-if="deposited">
      <v-icon style="color: green; margin-left: 10px; margin-right: 10px;">
      check_circle
      </v-icon>
      Deposited, refreshing.
    </v-card-text>
    <v-card-text v-else-if="depositFailed">
      Deposit failed, check your transaction.
    </v-card-text>
    <v-card-text v-else-if="depositing">
      <v-progress-circular v-bind:size="15" style="margin-left: 10px; margin-right: 10px;" v-bind:indeterminate="true"></v-progress-circular> 
      <span v-if="!depositTx">Confirm deposit transaction in Metamask.</span>
      <span v-if="depositTx">Waiting for transaction to confirm...
        <v-btn flat target="_blank" :href="getUrl(depositTx)">View Transaction</v-btn>
      </span>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" flat @click.stop="depositDialog = false">Close</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
<v-progress-linear v-if="!ready" v-bind:indeterminate="true"></v-progress-linear>
<v-stepper v-if="ready" v-model="step">
  <v-stepper-header>
    <v-stepper-step step="1">Select category</v-stepper-step>
    <v-divider></v-divider>
    <v-stepper-step step="2">Select side</v-stepper-step>
    <v-divider></v-divider>
    <v-stepper-step step="3">Describe asset</v-stepper-step>
    <v-divider></v-divider>
    <v-stepper-step step="4">Configure order</v-stepper-step>
    <v-divider></v-divider>
    <v-stepper-step step="5">Preview and confirm</v-stepper-step>
  </v-stepper-header>
  <v-stepper-items>
   <v-stepper-content step="1">
      <div class="explainer">
      Select the kind of asset you want to buy or sell from the available categories, or select the "Custom" category to specify all fields manually.<br />
      If you want to sell a particular asset you already own, it may be easier to do so using the context menus on the <router-link to="/account/assets">assets page</router-link>.
      </div>
      <div v-if="schema" style="margin-bottom: 1em;">
        <schema expand="true" @click.native="category = schema.index" :schema="schema"></schema>
      </div>
      <div v-if="!schema" class="category">
        <v-text-field style="max-width: 400px;" v-model="catfilter" label="Filter by name" name="catfilter"></v-text-field>
        <v-layout row wrap class="category-inner">
          <v-flex xs12 md6 lg4 xl3 v-for="(schema, index) in schemas" :key="index">
            <schema hover @click.native="category = schema.index" :schema="schema"></schema>
          </v-flex>
        </v-layout>
      </div>
      <v-btn v-if="schema" color="primary" @click.native="step = 2">Continue</v-btn>
      <v-btn v-if="schema" @click.native="category = null" flat>Cancel</v-btn>
    </v-stepper-content>
    <v-stepper-content step="2">
      <div class="header">Select the side of the order you wish to place.</div>
      <v-radio-group v-model="side" :mandatory="true">
        <v-radio :color="$vuetify.theme.primary" label="Sell-side" value="sell"></v-radio>
        <v-radio :color="$vuetify.theme.primary" label="Buy-side" value="buy"></v-radio>
      </v-radio-group>
      <div class="explainer">
      Sell-side orders allow you to sell a specific asset you already own. Buy-side orders allow you to buy a particular asset, or to buy any asset with certain characteristics.
      <v-alert icon="priority_high" v-if="side === 'sell' && !proxy" value="true" outline :style="alertStyle" class="alert">
      To sell an asset, you need to first initialize your account, which you can do on the <router-link to="/account/assets">Account page</router-link>.
      </v-alert>
      </div><br />
      <v-btn :disabled="!side || side === 'sell' && !proxy" color="primary" @click.native="step = 3">Continue</v-btn>
      <v-btn @click.native="side = null; step = 1" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="3">
      <div class="explainer">
      Specify asset information, identifying the particular asset or class of assets you wish to buy or sell.
      </div><br />
      <div>
        <div v-for="(field, index) in fields" :key="index">
          <v-select v-if="field.type === 'enum'" @input="unifyValues(); valueChange()" v-model="values[field.name]" :items="field.values.map(v => ({value: v}))" item-value="value" item-text="value" single-line bottom :label="field.name + ' (' + field.type + ') - ' + field.description" :name="field.name" autocomplete></v-select>
          <v-text-field v-if="field.type !== 'enum'" @input="unifyValues(); valueChange()" v-model="values[field.name]" style="max-width: 600px;" :label="field.name + ' (' + field.type + ') - ' + field.description" :name="field.name" :readonly="field.readOnly"></v-text-field>
        </div>
      </div>
      <div style="margin-bottom: 1em;" class="checkingTransfer">
        <span v-if="checkingTransfer">
          <v-progress-circular v-bind:size="15" style="margin-right: 10px;" v-bind:indeterminate="true"></v-progress-circular>
          Checking ability to transfer asset...
        </span>
        <span v-if="!checkingTransfer && !canTransfer">
          <v-icon style="color: red; margin-right: 10px;">error</v-icon>
          Asset cannot be transferred - 
          <span v-if="transferError === 'not_found'">asset not found.</span>
          <span v-if="transferError === 'must_deposit'">you must <a @click.stop="deposit()">deposit it</a> first.</span>
          <span v-if="transferError === 'not_yours'">you do not own it.</span>
        </span>
        <span v-if="!checkingTransfer && canTransfer">
          <v-icon style="color: green; margin-right: 10px;">check_circle</v-icon>
          Asset can be transferred.
        </span>
      </div>
      <v-btn :disabled="!canTransfer" color="primary" @click.native="step = 4">Continue</v-btn>
      <v-btn @click.native="step = 2; values = {}; valueChange()" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="4">
      <div class="explainer">
      Configure order parameters, the conditions under which you will buy or sell the asset in question.
      </div><br />
      <v-select prepend-icon="compare_arrows" style="max-width: 400px;" v-bind:items="saleKinds" v-model="saleKind" label="Method of sale" item-value="value" item-text="text"></v-select>
      <v-select prepend-icon="account_balance_wallet" style="max-width: 400px;" autocomplete v-bind:items="tokens" v-model="token" label="Token" item-text="symbol" item-value="address"></v-select>
      <v-text-field prepend-icon="payment" style="max-width: 400px;" v-model="amount" :label="saleKind === 0 ? 'Price (tokens)': 'Starting price (tokens)'"></v-text-field>
      <v-text-field v-if="saleKind === 1" prepend-icon="publish" style="max-width: 400px;" v-model="endingPrice" label="Ending price (tokens)"></v-text-field>
      <v-menu style="max-width: 400px;" lazy :close-on-content-click="false" v-model="dateMenu" transition="scale-transition" offset-y full-width :nudge-right="40" max-width="290px" min-width="290px">
        <v-text-field slot="activator" label="Order expiration date (default never)" v-model="expirationDate" prepend-icon="event" readonly></v-text-field>
        <v-date-picker v-model="expirationDate" no-title scrollable actions>
          <template slot-scope="{ save, cancel }">
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn flat color="primary" @click="cancel">Cancel</v-btn>
              <v-btn flat color="primary" @click="save">OK</v-btn>
            </v-card-actions>
          </template>
        </v-date-picker>
      </v-menu>
      <v-menu v-if="expirationDate !== null" style="max-width: 400px;" lazy :close-on-content-click="false" v-model="timeMenu" transition="scale-transition" offset-y full-width :nudge-right="40" max-width="290px" min-width="290px">
        <v-text-field slot="activator" label="Order expiration time" v-model="expirationTime" prepend-icon="access_time" readonly></v-text-field>
        <v-time-picker v-model="expirationTime" format="24hr" autosave></v-time-picker>
      </v-menu>
      <v-btn color="primary" @click.native="step = 5">Continue</v-btn>
      <v-btn @click.native="step = 3" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="5">
      <div class="explainer">
      Ensure this is the exact order you wish to place. Once you press "Post Order", you will be prompted to sign the order, then it will be submitted to the orderbook.
      </div><br />
      <div v-if="schema && step === 5">
        <order :order="order" :asset="metadata.asset" :schema="schema"></order>
      </div>
      <br />
      <v-btn color="primary" @click.native="post">Post Order</v-btn>
      <v-btn @click.native="step = 4" flat>Back</v-btn>
    </v-stepper-content>
  </v-stepper-items>
</v-stepper>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'
import _ from 'lodash'

import { encodeCall, encodeSell, encodeBuy } from 'wyvern-schemas'
import { feeRecipient } from 'wyvern-exchange'

import Order from '../components/Order'
import Schema from '../components/Schema'
import { findAsset, WyvernProtocol, protocolInstance, orderToJSON } from '../aux'

const clone = (obj) => JSON.parse(JSON.stringify(obj))

const bind = function (name) {
  return function (n, o) {
    const query = clone(this.$route.query)
    if (n !== null) { query[name] = n } else { delete query[name] }
    this.$router.push({query: query})
  }
}

export default {
  components: { Order, Schema },
  metaInfo: {
    title: 'Post Order'
  },
  created: function () {
    if (this.step === 3) {
      const check = () => {
        if (this.ready) {
          setTimeout(this.checkTransfer, 500)
        } else {
          setTimeout(check, 100)
        }
      }
      check()
    }
  },
  data: function () {
    const query = this.$route.query
    const step = query.step ? parseInt(query.step) : 1
    return {
      authorizing: false,
      postDialog: false,
      postFailed: false,
      postError: null,
      posting: false,
      posted: false,
      depositDialog: false,
      depositFailed: false,
      depositing: false,
      deposited: false,
      depositTx: null,
      catfilter: '',
      checkingTransfer: true,
      transferError: null,
      canTransfer: false,
      step: step,
      side: query.side ? query.side : null,
      category: query.category !== undefined ? query.category : null,
      values: query.values ? JSON.parse(decodeURIComponent(query.values)) : {},
      saleKind: query.saleKind ? parseInt(query.saleKind) : 0,
      saleKinds: [
        {text: 'Fixed Price', value: 0},
        {text: 'Dutch Auction', value: 1}
      ],
      token: query.token ? query.token : null,
      amount: query.amount ? parseFloat(query.amount) : null,
      minimumBidIncrement: null,
      endingPrice: null,
      dateMenu: false,
      timeMenu: false,
      expirationDate: null,
      expirationTime: null
    }
  },
  computed: {
    alertStyle: function () {
      return {color: this.$vuetify.theme.primary + ' !important', marginTop: '2em'}
    },
    proxy: function () {
      return !this.ready ? null : this.$store.state.web3.proxy
    },
    ready: function () {
      return !!this.$store.state.web3.base
    },
    tokens: function () {
      return this.$store.state.web3.tokens
        ? [].concat.apply(this.$store.state.web3.tokens.canonicalWrappedEther, this.$store.state.web3.tokens.otherTokens)
        : []
    },
    schemas: function () {
      return (this.$store.state.web3.schemas || []).map((s, index) => {
        s.index = index
        return s
      }).filter(s => this.catfilter === '' || s.name.toLowerCase().indexOf(this.catfilter.toLowerCase()) !== -1)
    },
    schema: function () {
      return this.schemas[this.category]
    },
    fields: function () {
      return this.schema ? this.schema.fields : []
    },
    expiration: function () {
      if (this.expirationDate === null && this.expirationTime === null) {
        return 0
      }
      var dateStr = this.expirationDate
      if (this.expirationTime !== null) {
        dateStr += ' ' + this.expirationTime
      }
      const offset = (new Date()).getTimezoneOffset() * 60
      return (Date.parse(dateStr) / 1000) + offset
    },
    extra: function () {
      return this.saleKind === 0 ? 0 : Math.abs(this.amount - this.endingPrice)
    },
    order: function () {
      const account = this.$store.state.web3.base ? this.$store.state.web3.base.account : ''
      const token = this.tokens.filter(t => t.address === this.token)[0]
      const asset = this.schema.assetFromFields(this.values)
      const { target, calldata, replacementPattern } = this.side === 'buy' ? encodeBuy(this.schema, asset, account) : encodeSell(this.schema, asset)
      const order = {
        exchange: WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network),
        maker: account,
        taker: WyvernProtocol.NULL_ADDRESS,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        feeRecipient: feeRecipient,
        side: (this.side === 'buy' ? 0 : 1),
        saleKind: this.saleKind,
        target: target,
        howToCall: 0,
        calldata: calldata,
        replacementPattern: replacementPattern,
        staticTarget: WyvernProtocol.NULL_ADDRESS,
        staticExtradata: '0x',
        paymentToken: this.token,
        basePrice: this.amount !== null ? WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), token.decimals) : null,
        extra: WyvernProtocol.toBaseUnitAmount(new BigNumber(this.extra), token.decimals),
        listingTime: new BigNumber(Math.round(Date.now() / 1000 - 100)),
        expirationTime: new BigNumber(this.expiration),
        salt: WyvernProtocol.generatePseudoRandomSalt(),
        metadata: this.metadata
      }
      return order
    },
    metadata: function () {
      return {
        asset: this.schema.assetFromFields(this.values),
        schema: this.schema.name
      }
    }
  },
  watch: {
    category: bind('category'),
    side: bind('side'),
    step: bind('step'),
    token: bind('token'),
    amount: bind('amount')
  },
  methods: {
    getUrl: function (hash) {
      const prefix = (this.$store.state.web3.base && this.$store.state.web3.base.network !== 'main')
        ? (this.$store.state.web3.base.network + '.') : ''
      return 'https://' + prefix + 'etherscan.io/tx/' + hash
    },
    deposit: function () {
      this.depositFailed = false
      this.deposited = false
      this.depositTx = null
      this.depositing = true
      this.depositDialog = true
      const asset = this.schema.assetFromFields(this.values)
      const abi = this.schema.functions.transfer(asset)
      const recipient = abi.inputs.filter(i => i.kind === 'replaceable')[0]
      recipient.value = this.$store.state.web3.proxy
      const data = encodeCall(abi, abi.inputs.map(i => i.value.toString()))
      const onConfirm = (ok) => {
        this.depositing = false
        if (ok) {
          this.deposited = true
          setTimeout(() => {
            this.depositDialog = false
            this.checkTransfer()
          }, 1500)
        } else {
          this.depositFailed = true
        }
      }
      const onTxHash = (txHash) => {
        this.depositTx = txHash
      }
      const onError = () => {
        this.depositing = false
        this.depositFailed = true
      }
      this.$store.dispatch('rawSend', { target: abi.target, data: data, amount: 0, onError: onError, onTxHash: onTxHash, onConfirm: onConfirm })
    },
    checkTransfer: _.debounce(async function () {
      this.checkingTransfer = true
      this.transferError = null
      const asset = this.schema.assetFromFields(this.values)
      const where = await findAsset(this.$store.state, asset, this.schema)
      if (this.side === 'buy') {
        if (where === 'unknown') {
          this.canTransfer = false
          this.transferError = 'not_found'
          this.checkingTransfer = false
        } else {
          this.canTransfer = true
          this.checkingTransfer = false
        }
      } else {
        if (where === 'proxy') {
          this.canTransfer = true
          this.checkingTransfer = false
        } else if (where === 'account') {
          this.canTransfer = false
          this.transferError = 'must_deposit'
          this.checkingTransfer = false
        } else if (where === 'other') {
          this.canTransfer = false
          this.transferError = 'not_yours'
          this.checkingTransfer = false
        } else if (where === 'unknown') {
          this.canTransfer = true
          this.checkingTransfer = false
        }
      }
    }, 500),
    valueChange: function () {
      const query = clone(this.$route.query)
      if (Object.keys(this.values).length > 0) {
        query.values = encodeURIComponent(JSON.stringify(this.values))
      } else {
        delete query.values
      }
      this.$router.push({query: query})
      this.checkTransfer()
    },
    unifyValues: function () {
      if (this.schema.unifyFields) {
        this.values = this.schema.unifyFields(this.values)
      }
    },
    post: async function () {
      this.postDialog = true
      this.authorizing = true
      this.posting = true
      this.posted = false
      this.postFailed = false
      var order = orderToJSON(this.order)
      var signature
      try {
        signature = await protocolInstance.signOrderHashAsync(order.hash, this.order.maker)
        this.authorizing = false
      } catch (err) {
        this.postFailed = true
        this.postError = 'Signature rejected!'
        return
      }
      order.v = signature.v
      order.r = signature.r
      order.s = signature.s
      const callback = () => {
        this.posted = true
        setTimeout(() => this.$router.push('/orders/' + order.hash), 500)
      }
      const onError = (err) => {
        this.postFailed = true
        this.postError = err
      }
      this.$store.dispatch('postOrder', { order: order, callback: callback, onError: onError })
    }
  }
}
</script>

<style scoped>
.explainer {
  padding-top: 1em;
  padding-bottom: 1em;
  font-size: 1.0em;
}

.header {
  margin-top: 1em;
  margin-bottom: 1em;
}

.category-inner {
  margin-bottom: 2em;
  max-height: 800px;
  overflow: auto;
}

a {
  color: #E12D32;
}

.alert a:hover {
  text-decoration: underline;
}

.checkingTransfer a:hover {
  text-decoration: underline;
}
</style>
