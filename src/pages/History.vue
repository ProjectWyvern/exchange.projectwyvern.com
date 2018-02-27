<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 2em; margin-bottom: 1em; text-align: center; font-variant: small-caps; font-size: 1.5em;">
Account History (settled orders)
<div style="float: right; padding-right: 8em;">
  <v-btn @click.stop="previous" flat :disabled="offset === 0">Previous Page</v-btn>
  <v-btn @click.stop="next" flat :disabled="!orders || orders.length < 20">Next Page</v-btn>
</div>
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
import { bind } from '../misc'
import Order from '../components/Order'

export default {
  name: 'accountHistory',
  components: { Order },
  metaInfo: {
    title: 'Account History'
  },
  data: function () {
    const query = this.$route.query
    return {
      orders: null,
      offset: query.offset ? parseInt(query.offset) : 0
    }
  },
  created: async function () {
    await (new Promise((resolve, reject) => {
      const check = () => {
        if (this.$store.state.web3.base) resolve(this.$store.state.web3.base.account)
        else setTimeout(check, 100)
      }
      check()
    }))
    this.reload()
  },
  methods: {
    previous: function () {
      this.offset -= 20
      this.reload()
    },
    next: function () {
      this.offset += 20
      this.reload()
    },
    reload: async function () {
      this.orders = null
      const settlements = await wyvernExchange.settlements({account: this.$store.state.web3.base.account, limit: 20, offset: this.offset})
      settlements.map(s => {
        s.order.settlement = s
      })
      this.orders = settlements.map(s => s.order)
    }
  },
  computed: {
    maxHeight: function () {
      return window.innerHeight - 250
    }
  },
  watch: {
    offset: bind('offset')
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
