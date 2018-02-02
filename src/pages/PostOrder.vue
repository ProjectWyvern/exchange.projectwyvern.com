<template>
<v-container>
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
      Select the kind of asset you want to buy or sell from the available categories, or select the "Custom" category to specify all fields manually.
      </div>
      <div v-if="schema" style="margin-bottom: 1em;">
        <v-card raised style="padding: 5px; margin: 5px; width: 300px; height: 350px;">
          <v-card-media height="200px" :src="schema.thumbnail"></v-card-media>
          <v-card-title>
            <div>
              <h3>{{ schema.name }}</h3>
              <div>{{ schema.description }}</div>
            </div>
          </v-card-title>
          <v-card-actions>
            <v-btn flat target="_blank" :href="schema.website">Website</v-btn>
          </v-card-actions>
        </v-card>
      </div>
      <div v-if="!schema" class="category">
        <v-text-field style="max-width: 400px;" v-model="catfilter" label="Filter by name" name="catfilter"></v-text-field>
        <v-layout row wrap class="category-inner">
          <v-flex xs12 md6 lg4 xl3 v-for="(schema, index) in schemas" :key="index">
            <v-card raised hover style="padding: 5px; margin: 5px; width: 300px; height: 300px;" @click.native="category = schema.index">
              <v-card-media height="200px" :src="schema.thumbnail"></v-card-media>
              <v-card-title>
                <div>
                  <h3>{{ schema.name }}</h3>
                  <div>{{ schema.description }}</div>
                </div>
              </v-card-title>
            </v-card>
          </v-flex>
        </v-layout>
      </div>
      <v-btn v-if="schema" color="primary" @click.native="step = 2">Continue</v-btn>
      <v-btn v-if="schema" @click.native="category = null" flat>Cancel</v-btn>
    </v-stepper-content>
    <v-stepper-content step="2">
      <div class="header">Select the side of the order you wish to place.</div>
      <v-radio-group v-model="side" :mandatory="true">
        <v-radio color="black" label="Sell-side" value="sell"></v-radio>
        <v-radio color="black" label="Buy-side" value="buy"></v-radio>
      </v-radio-group>
      <div class="explainer">
      Sell-side orders allow you to sell a specific asset you already own. Buy-side orders allow you to buy a particular asset, or to buy any asset with certain characteristics.
      </div><br />
      <v-btn :disabled="!side" color="primary" @click.native="step = 3">Continue</v-btn>
      <v-btn @click.native="side = null; step = 1" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="3">
      <div class="explainer">
      Specify asset information, identifying the particular asset or class of assets you wish to buy or sell.
      </div><br />
      <div>
        <div v-for="(field, index) in fields" :key="index">
          <v-text-field @input="unifyValues()" v-model="values[field.name]" style="max-width: 600px;" :label="field.name + ' (' + field.type + ') - ' + field.description" :name="field.name" :readonly="field.readOnly"></v-text-field>
        </div>
      </div>
      <v-btn color="primary" @click.native="step = 4">Continue</v-btn>
      <v-btn @click.native="step = 2" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="4">
      <div class="explainer">
      Configure order parameters, the conditions under which you will buy or sell the asset in question.
      </div><br />
      <v-select prepend-icon="compare_arrows" style="max-width: 400px;" v-bind:items="saleKinds" v-model="saleKind" label="Method of sale" item-value="value" item-text="text"></v-select>
      <v-select prepend-icon="account_balance_wallet" style="max-width: 400px;" v-bind:items="tokens" v-model="token" label="Token" item-text="symbol" item-value="address"></v-select>
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
      <order v-if="schema && step == 5" :order="order" :metadata="previewMetadata" :schema="schema.name"></order>
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

import { encodeSell, encodeBuy } from 'wyvern-schemas'

import Order from '../components/Order'
import { WyvernProtocol, protocolInstance, orderToJSON } from '../aux'

const clone = (obj) => JSON.parse(JSON.stringify(obj))

export default {
  components: { Order },
  metaInfo: {
    title: 'Post Order'
  },
  data: function () {
    const query = this.$route.query
    const step = 1
    return {
      catfilter: '',
      step: step,
      side: query.side ? query.side : null,
      category: query.category ? query.category : null,
      values: {},
      saleKind: 0,
      saleKinds: [
        {text: 'Fixed Price', value: 0},
        {text: 'Dutch Auction', value: 1}
      ],
      token: null,
      amount: null,
      minimumBidIncrement: null,
      endingPrice: null,
      dateMenu: false,
      timeMenu: false,
      expirationDate: null,
      expirationTime: null
    }
  },
  computed: {
    previewMetadata: function () {
      return this.schema.formatter(this.order.metadata.nft)
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
      try {
        const account = this.$store.state.web3.base ? this.$store.state.web3.base.account : ''
        const token = this.tokens.filter(t => t.address === this.token)[0]
        const nft = this.schema.nftFromFields(this.values)
        const { target, calldata, replacementPattern } = this.side === 'buy' ? encodeBuy(this.schema, nft, account) : encodeSell(this.schema, nft)
        const order = {
          exchange: WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network),
          maker: account,
          taker: WyvernProtocol.NULL_ADDRESS,
          makerFee: new BigNumber(0),
          takerFee: new BigNumber(0),
          feeRecipient: account,
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
          listingTime: new BigNumber(Math.round(Date.now() / 1000)),
          expirationTime: new BigNumber(this.expiration),
          salt: WyvernProtocol.generatePseudoRandomSalt(),
          metadata: this.metadata
        }
        return order
      } catch (e) { console.log(e) }
    },
    metadata: function () {
      return {
        nft: this.schema.nftFromFields(this.values),
        schema: this.schema.name
      }
    }
  },
  watch: {
    category: function (n, o) {
      const query = clone(this.$route.query)
      if (n !== null) { query.category = n } else { delete query.category }
      this.$router.push({query: query})
    },
    side: function (n, o) {
      const query = clone(this.$route.query)
      if (n !== null) { query.side = n } else { delete query.side }
      this.$router.push({query: query})
    }
  },
  methods: {
    unifyValues: function () {
      if (this.schema.unifyFields) {
        this.values = this.schema.unifyFields(this.values)
      }
    },
    post: async function () {
      console.log(this.order)
      var order = orderToJSON(this.order)
      const signature = await protocolInstance.signOrderHashAsync(order.hash, this.order.maker)
      order.v = signature.v
      order.r = signature.r
      order.s = signature.s
      const callback = () => {
        this.$router.push('/orders/' + order.hash)
      }
      this.$store.dispatch('postOrder', { order: order, callback: callback, onError: console.log })
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

.category {
  margin-bottom: 2em;
  max-height: 400px;
  overflow: auto;
}
</style>
