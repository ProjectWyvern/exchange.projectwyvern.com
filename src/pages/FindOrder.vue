<template>
<div>
<v-container grid-list-md>
  <v-layout row wrap>
    <v-flex lg1 hidden-xs-only>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-text-field name="filter" label="Filter by title / description" v-model="filter" hide-details></v-text-field>
    </v-flex>
    <v-flex lg1 hidden-xs-only>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-select style="margin: 0; width: 32%; display: inline-block;" v-bind:items="schemas" v-model="schema" label="Schema" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="margin: 0; width: 32%; display: inline-block;" v-bind:items="sides" v-model="side" label="Side" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="margin: 0; width: 32%; display: inline-block;" v-bind:items="tokens" v-model="token" label="Token" item-text="symbol" item-value="address" autocomplete hide-details></v-select>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-select style="width: 49%; display: inline-block;" v-bind:items="saleKinds" v-model="saleKind" label="Method of sale" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="width: 49%; display: inline-block;" v-bind:items="sorts" v-model="sort" label="Sort" item-text="name" item-value="id" hide-details></v-select>
    </v-flex>
    <v-flex xs12 md4 lg1>
      <v-btn @click.native="reload()" flat><v-icon>refresh</v-icon></v-btn>
    </v-flex>
  </v-layout>
</v-container>
<div class="holder" :style="{maxHeight: maxHeight + 'px'}">
  <v-container grid-list-lg style="height: 2000px;">
    <v-layout row wrap v-if="orders">
      <v-flex xs12 md6 lg4 xl3 v-for="(order, index) in orders" :key="index">
        <router-link :to="'/orders/' + order.hash">
          <order hover :order="order" :schema="order.schema.name" :metadata="order.schema.formatter(order.metadata.nft)"></order>
        </router-link>
      </v-flex>
    </v-layout>
    <v-layout row wrap v-if="!orders">
      <v-flex xs1></v-flex>
      <v-flex xs10>
        <v-progress-linear v-bind:indeterminate="true"></v-progress-linear>
      </v-flex>
      <v-flex xs1></v-flex>
    </v-layout>
  </v-container>
</div>
</div>
</template>

<script>
import Order from '../components/Order'

export default {
  name: 'find',
  components: { Order },
  metaInfo: {
    title: 'Find Order'
  },
  created: function () {
    if (this.$store.state.orders === null) { this.$store.dispatch('fetchOrders') }
  },
  methods: {
    reload: function () {
      this.$store.dispatch('fetchOrders')
    }
  },
  data: function () {
    return {
      filter: null,
      side: -1,
      sides: [
        {name: 'Any', value: -1},
        {name: 'Buy', value: 0},
        {name: 'Sell', value: 1}
      ],
      token: -1,
      saleKind: -1,
      saleKinds: [
        {name: 'Any', value: -1},
        {name: 'Fixed Price', value: 0},
        {name: 'English Auction', value: 1},
        {name: 'Dutch Auction', value: 2}
      ],
      sort: 0,
      sorts: [
        {name: 'Most Recent', id: 0},
        {name: 'Least Recent', id: 1},
        {name: 'Highest Price', id: 2},
        {name: 'Lowest Price', id: 3}
      ],
      schema: null
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
        ? [].concat.apply([].concat.apply({symbol: 'Any', address: -1}, [this.$store.state.web3.tokens.canonicalWrappedEther]), this.$store.state.web3.tokens.otherTokens)
        : []
    },
    orders: function () {
      return !this.$store.state.web3.schemas ? null : !this.$store.state.orders ? null : this.$store.state.orders.map(o => {
        const schema = this.$store.state.web3.schemas.filter(s => s.name === o.metadata.schema)[0]
        o.schema = schema
        o.formatted = o.schema.formatter(o.metadata.nft)
        return o
      }).filter(o => {
        return (
          (this.schema === null || o.schema.name === this.schema) &&
          (this.token === -1 || o.paymentToken === this.token) &&
          (this.saleKind === -1 || o.saleKind === this.saleKind) &&
          (this.side === -1 || o.side === this.side) &&
          (this.filter === null || o.formatted.title.toLowerCase().indexOf(this.filter.toLowerCase()) !== -1)
        )
      })
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
