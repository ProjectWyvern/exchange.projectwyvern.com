<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 2em; margin-bottom: 1em; text-align: center; font-variant: small-caps; font-size: 1.5em;">
Account History (settled orders)
</v-flex>
<v-flex v-if="orders" xs12>
<div class="holder" :style="{maxHeight: maxHeight + 'px'}">
  <v-container grid-list-md>
    <v-layout row wrap>
      <v-flex xs12 md6 lg4 xl3 v-for="(order, index) in orders" :key="index">
        <router-link :to="'/orders/' + order.hash">
          <order :order="order"></order>
        </router-link>
      </v-flex>
    </v-layout>
  </v-container>
</div>
</v-flex>
<v-flex v-if="!orders" xs12>
<v-progress-linear v-bind:indeterminate="true"></v-progress-linear>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import { wyvernExchange } from '../aux'
import Order from '../components/Order'

export default {
  name: 'accountHistory',
  components: { Order },
  metaInfo: {
    title: 'Account History'
  },
  data: function () {
    return {
      orders: null
    }
  },
  created: async function () {
    const account = await (new Promise((resolve, reject) => {
      const check = () => {
        if (this.$store.state.web3.base) resolve(this.$store.state.web3.base.account)
        else setTimeout(check, 100)
      }
      check()
    }))
    const settlements = await wyvernExchange.settlements({account: account})
    settlements.map(s => {
      s.order.settlement = s
    })
    this.orders = settlements.map(s => s.order)
  },
  computed: {
    maxHeight: function () {
      return window.innerHeight - 250
    }
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
