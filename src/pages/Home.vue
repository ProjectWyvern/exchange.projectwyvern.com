<template>
<v-container class="home" >
<v-layout row wrap>
<v-flex xs12>
<p>
<v-alert class="alert" icon="priority_high" value="true" outline :style="style">
This is a live beta running on the Ethereum mainnet. The protocol <a href="https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/audits/v1/solidified_audit_report.pdf" target="_blank">has been audited</a> and subjected to a <a href="https://medium.com/project-wyvern/wyvern-protocol-bug-bounty-5k-65c0f8d9998e" target="_blank">public bounty</a>, so it should be solid, but there may be a few UI/UX bugs. Please report issues and send feedback <a href="https://discord.gg/dZZdybs" target="_blank">on Discord</a>.
</v-alert><br />
<v-alert class="alert" icon="help" value="true" outline :style="style">
Not sure what the Wyvern Exchange is or want the ELI5 overview? Read the <a href="https://medium.com/project-wyvern/announcing-the-wyvern-exchange-any-ethereum-asset-any-erc20-token-zero-trust-required-34577c67954d" target="_blank">launch announcement</a>.
</v-alert>
</p><br />
</v-flex xs12>
<v-flex xs12 lg6>
<div class="small-heading">Recently Settled Orders</div>
<br />
<v-layout v-if="settlements" row wrap class="orders" align-content-center>
<v-flex xs12 xl6 v-for="(settlement, index) in settlements" :key="index" style="padding-bottom: 1em;">
<router-link :to="'/orders/' + settlement.order.hash">
  <order hover :order="settlement.order" style="padding-bottom: 1em;"></order>
</router-link>
</v-flex>
</v-layout>
<v-progress-linear class="progress" v-if="!settlements" v-bind:indeterminate="true"></v-progress-linear>
</v-flex>
<v-flex xs12 lg6>
<div class="small-heading">Recently Posted Orders</div>
<br />
<v-layout v-if="orders" row wrap class="orders" align-content-center>
<v-flex xs12 xl6 v-for="(order, index) in orders" :key="index" style="padding-bottom: 1em;">
<router-link :to="'/orders/' + order.hash">
  <order hover :order="order" style="padding-bottom: 1em;"></order>
</router-link>
</v-flex>
</v-layout>
<v-progress-linear class="progress" v-if="!orders" v-bind:indeterminate="true"></v-progress-linear>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import Order from '../components/Order'

export default {
  name: 'home',
  components: { Order },
  metaInfo: {
    title: 'Home'
  },
  created: function () {
    this.reload()
  },
  methods: {
    reload: function () {
      this.$store.dispatch('fetchRecentSettlements', {query: {limit: 4}})
      this.$store.dispatch('fetchRecentOrders', {query: {limit: 4}})
    }
  },
  computed: {
    settlements: function () {
      return this.$store.state.recentSettlements ? this.$store.state.recentSettlements.map(s => { s.order.settlement = s; return s }) : null
    },
    orders: function () {
      return this.$store.state.recentOrders
    },
    style: function () {
      return {color: this.$vuetify.theme.primary + ' !important'}
    }
  }
}
</script>

<style scoped>
.orders {
  font-size: 0.8em;
}

.home {
  font-size: 1.2em;
}

.small-heading {
  text-align: center;
  font-size: 1.3em;
  font-variant: small-caps;
}

.alert a:hover {
  text-decoration: underline;
}

a {
  color: blue;
}

.progress {
  width: 50%;
  margin: 0 auto;
  margin-top: 3em;
}
</style>
