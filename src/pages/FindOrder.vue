<template>
<div>
<v-container grid-list-md>
  <v-layout row wrap>
    <v-flex lg3 hidden-xs-only>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-select style="margin: 0; width: 49%; display: inline-block;" @change="dreload" autocomplete v-bind:items="schemas" v-model="schema" label="Schema" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="margin: 0; width: 49%; display: inline-block;" @change="dreload" v-bind:items="saleKinds" v-model="saleKind" label="Method of sale" item-text="name" item-value="value" hide-details></v-select>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-select style="margin: 0; width: 24%; display: inline-block;" @change="dreload" v-bind:items="tokens" v-model="token" label="Token" item-text="symbol" item-value="address" autocomplete hide-details></v-select>
      <v-select style="margin: 0; width: 24%; display: inline-block;" @change="dreload" v-bind:items="sides" v-model="side" label="Side" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="width: 49%; display: inline-block;" @change="dreload" v-bind:items="sorts" v-model="sort" label="Sort" item-text="name" item-value="id" hide-details></v-select>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-btn @click.stop="reload" flat><v-icon>refresh</v-icon></v-btn>
      <v-btn @click.stop="previous" flat :disabled="offset === 0">Previous Page</v-btn>
      <v-btn @click.stop="next" flat :disabled="!orders || orders.length < 20">Next Page</v-btn>
    </v-flex>
  </v-layout>
</v-container>
<div class="holder" :style="{maxHeight: maxHeight + 'px'}">
  <v-container grid-list-md style="padding-left: 15px; padding-right: 15px;">
    <v-layout row wrap v-if="orders">
      <v-flex xs12 md6 lg4 xl3 v-for="(order, index) in orders" :key="index">
        <router-link :to="'/orders/' + order.hash">
          <order hover :order="order" :schema="order.schema"></order>
        </router-link>
      </v-flex>
    </v-layout>
    <v-layout row wrap v-if="!orders">
      <v-flex xs12>
        <v-progress-linear v-bind:indeterminate="true"></v-progress-linear>
      </v-flex>
    </v-layout>
  </v-container>
</div>
</div>
</template>

<script>
import Order from '../components/Order'

import { bind } from '../misc'

export default {
  name: 'find',
  components: { Order },
  metaInfo: {
    title: 'Find Order'
  },
  created: function () {
    this.reload()
  },
  methods: {
    dreload: function () {
      setTimeout(this.reload, 10)
    },
    next: function () {
      this.offset += 20
      this.reload()
    },
    previous: function () {
      this.offset -= 20
      this.reload()
    },
    reload: function () {
      var query = {}
      query.offset = this.offset
      query.schema = this.schema
      if (this.side !== -1) {
        query.side = this.side
      }
      if (this.token) {
        query.paymentToken = this.token
      }
      if (this.saleKind !== -1) {
        query.saleKind = this.saleKind
      }
      query.order = this.sort
      this.$store.dispatch('fetchOrders', {query: query})
    }
  },
  watch: {
    side: bind('side'),
    token: bind('token'),
    saleKind: bind('saleKind'),
    sort: bind('sort'),
    schema: bind('schema'),
    offset: bind('offset')
  },
  data: function () {
    const query = this.$route.query
    return {
      offset: query.offset ? parseInt(query.offset) : 0,
      side: query.side ? parseInt(query.side) : -1,
      sides: [
        {name: 'Any', value: -1},
        {name: 'Buy', value: 0},
        {name: 'Sell', value: 1}
      ],
      token: query.token ? query.token : null,
      saleKind: query.saleKind ? parseInt(query.saleKind) : -1,
      saleKinds: [
        {name: 'Any', value: -1},
        {name: 'Fixed Price', value: 0},
        {name: 'Dutch Auction', value: 1}
      ],
      sort: query.sort ? parseInt(query.sort) : 1,
      sorts: [
        {name: 'Most Recent', id: 1},
        {name: 'Least Recent', id: 2},
        {name: 'Highest Price', id: 3},
        {name: 'Lowest Price', id: 4}
      ],
      schema: query.schema ? query.schema : null
    }
  },
  computed: {
    schemas: function () {
      const s = (this.$store.state.web3.schemas || []).map(s => ({name: s.name, value: s.name}))
      const r = [].concat.apply({name: 'Any', value: null}, s)
      return r
    },
    tokens: function () {
      return this.$store.state.web3.tokens
        ? [].concat.apply([].concat.apply({symbol: 'Any', address: null}, [this.$store.state.web3.tokens.canonicalWrappedEther]), this.$store.state.web3.tokens.otherTokens)
        : []
    },
    orders: function () {
      const orders = !this.$store.state.web3.schemas ? null : !this.$store.state.orders ? null : this.$store.state.orders.map(o => {
        const schema = this.$store.state.web3.schemas.filter(s => s.name === o.metadata.schema)[0]
        o.schema = schema
        return o
      })
      return orders
    },
    maxHeight: function () {
      return window.innerHeight - 210
    }
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
