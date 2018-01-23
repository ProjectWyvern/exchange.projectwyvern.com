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
      <div class="header">Select the kind of asset you want to buy or sell.</div>
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
          <v-flex xs12 md6 lg2 v-for="(schema, index) in schemas" :key="index">
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
      Specify asset information.
      </div><br />
      <div>
        <div v-for="(field, index) in fields" :key="index">
          <v-text-field @change="s => values[index] = s" style="max-width: 400px;" :label="field.name + ' (' + field.type + ')'" :name="field.name"></v-text-field>
        </div>
      </div>
      <v-btn color="primary" @click.native="step = 4">Continue</v-btn>
      <v-btn @click.native="step = 2" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="4">
      <div class="explainer">
      Configure order parameters.
      </div><br />
      <v-select style="max-width: 400px;" v-bind:items="saleKinds" v-model="saleKind" label="Method of sale" item-value="value" item-text="text"></v-select>
      <v-select style="max-width: 400px;" v-bind:items="tokens" v-model="token" label="Token" item-text="symbol" item-value="address"></v-select>
      <v-text-field style="max-width: 400px;" v-model="amount" label="Price (tokens)"></v-text-field>
      <v-text-field style="max-width: 400px;" v-model="expiration" label="Order expiration (0 for no expiry)"></v-text-field>
      <v-btn color="primary" @click.native="step = 5">Continue</v-btn>
      <v-btn @click.native="step = 3" flat>Back</v-btn>
    </v-stepper-content>
    <v-stepper-content step="5">
      <div class="explainer">
      Ensure this is the exact order you wish to place.
      </div><br />
      <order v-if="schema && step == 5" :order="order" :metadata="schema.formatter(order.metadata.fields._tokenId)" :schema="schema.name"></order>
      <br />
      <v-btn color="primary" @click.native="post">Post Order</v-btn>
      <v-btn @click.native="step = 4" flat>Back</v-btn>
    </v-stepper-content>
  </v-stepper-items>
</v-stepper>
</v-container>
</template>

<script>
import Vue from 'vue'
import BigNumber from 'bignumber.js'

import { encodeDefaultCall, encodeReplacementPattern } from 'wyvern-schemas'

import Order from '../components/Order'
import { WyvernProtocol, protocolInstance, orderToJSON } from '../aux'

const clone = (obj) => JSON.parse(JSON.stringify(obj))

export default {
  components: { Order },
  metaInfo: {
    title: 'Post Order'
  },
  data: function() {
    const query = this.$route.query
    const step = 1;
    return {
      catfilter: '',
      step: step,
      side: query.side ? query.side : null,
      category: query.category ? query.category : null,
      values: {},
      saleKind: 0,
      saleKinds: [
        {text: 'Fixed Price', value: 0},
        {text: 'English Auction', value: 1},
        {text: 'Dutch Auction', value: 2} 
      ],
      token: null,
      amount: null,
      expiration: 0
    }
  },
  computed: {
    ready: function() {
      return this.$store.state.web3.base ? true : false
    },
    tokens: function() {
      return this.$store.state.web3.tokens ?
        [].concat.apply(this.$store.state.web3.tokens.canonicalWrappedEther)
        : []
    },
    schemas: function() {
      return (this.$store.state.web3.schemas || []).map((s, index) => {
        s.index = index
        return s
      }).filter(s => this.catfilter === '' || s.name.toLowerCase().indexOf(this.catfilter.toLowerCase()) !== -1)
    },
    schema: function() {
      return this.schemas[this.category]
    },
    fields: function() {
      return this.schema ?
        this.schema.functions.transfer.inputs.filter(i => i.kind === 'asset')
        : []
    },
    order: function() {
      const account = this.$store.state.web3.base ? this.$store.state.web3.base.account : ''
      const token = this.tokens.filter(t => t.address === this.token)[0]
      const tokenDecimals = token ? token.decimals : 18
      var calldata = '0x'
      try {
      if (this.schema && Object.keys(this.values).length === this.fields.length) {
        // TODO FIXME
        calldata = encodeDefaultCall(this.schema.functions.transfer, parseInt(this.values[0]))
      }
      const order = {
        exchange: WyvernProtocol.DEPLOYED.rinkeby.WyvernExchange,
        maker: account,
        taker: WyvernProtocol.NULL_ADDRESS,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        feeRecipient: account,
        side: (this.side === 'buy' ? 0 : 1),
        saleKind: this.saleKind,
        target: this.schema ? this.schema.functions.transfer.target : null,
        howToCall: 0,
        calldata: calldata,
        replacementPattern: this.schema ? encodeReplacementPattern(this.schema.functions.transfer) : null,
        metadataHash: '0x',
        paymentToken: this.token,
        basePrice: this.amount !== null ? WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), tokenDecimals) : null,
        extra: 0,
        listingTime: new BigNumber(Math.round(Date.now() / 1000)),
        expirationTime: new BigNumber(this.expiration),
        salt: WyvernProtocol.generatePseudoRandomSalt(),
        metadata: this.metadata
      }
      return order
      } catch(e) { console.log(e) }
    },
    metadata: function() {
      var fields = {}
      this.fields.map((f, i) => {
        fields[f.name] = parseInt(this.values[i])
      })
      return {
        fields: fields,
        schema: this.schema.name
      }
    }
  },
  watch: {
    category: function(n, o) {
      const query = clone(this.$route.query)
      if (n !== null) { query.category = n } else { delete query.category }
      this.$router.push({query: query})
    },
    side: function(n, o) {
      const query = clone(this.$route.query)
      if (n !== null) { query.side = n } else { delete query.side }
      this.$router.push({query: query})
    }
  },
  methods: {
    post: async function() {
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
