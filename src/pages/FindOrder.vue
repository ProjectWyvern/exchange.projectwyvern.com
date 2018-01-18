<template>
<div>
<v-container grid-list-md>
  <v-layout row wrap>
    <v-flex lg1 hidden-xs-only>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-text-field name="filter" label="Filter by title / description" v-model="filter" hide-details></v-text-field>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-select style="margin: 0; width: 49%; display: inline-block;" v-bind:items="sides" v-model="side" label="Side" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="margin: 0; width: 49%; display: inline-block;" v-bind:items="tokens" v-model="token" label="Token" item-text="symbol" item-value="address" autocomplete hide-details></v-select>
    </v-flex>
    <v-flex xs12 md4 lg3>
      <v-select style="width: 49%; display: inline-block;" v-bind:items="saleKinds" v-model="saleKind" label="Method of sale" item-text="name" item-value="value" hide-details></v-select>
      <v-select style="width: 49%; display: inline-block;" v-bind:items="sorts" v-model="sort" label="Sort" item-text="name" item-value="id" hide-details></v-select>
    </v-flex>
    <v-flex xs12 md4 lg3>
    </v-flex>
  </v-layout>
</v-container>
<div class="holder" :style="{maxHeight: maxHeight + 'px'}">
  <v-container grid-list-lg style="height: 2000px;">
    <v-layout row wrap>
      <v-flex xs12 md6 lg3 v-for="(order, index) in orders" :key="index">
        <router-link :to="'/orders/' + order.hash">
          <order hover :order="order.order" :metadata="order.metadata"></order>
        </router-link>
      </v-flex>
    </v-layout>
  </v-container>
</div>
</div>
</template>

<script>
import Order from '../components/Order'

import _tokens from '../wyvern-schemas/build/tokens.json'
var tokens = _tokens.map(t => ({
  symbol: t.symbol,
  address: t.address
}))
tokens.unshift({symbol: 'Any', address: -1})

var orders = []
var order = {order: {paymentToken: '', basePrice: 1}, metadata: {title: 'Some Title', description: 'Some Description', image: 'https://www.cryptokitties.co/images/kitty-eth.svg'}}
for (var i = 0; i < 100; i++) orders.push(order)

export default {
  name: 'find',
  components: { Order },
  metaInfo: {
    title: 'Find Order'
  },
  data: function() {
    return {
      filter: null,
      side: -1,
      sides: [
        {name: 'Any', value: -1},
        {name: 'Buy', value: 0},
        {name: 'Sell', value: 1}
      ],
      token: -1,
      tokens: tokens,
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
      orders: orders
    }
  },
  computed: {
    maxHeight: function() {
      return window.innerHeight - 210;
    }
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
