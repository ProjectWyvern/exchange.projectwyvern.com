<template>
<v-container class="home">
<v-layout row wrap>
<v-flex xs12>
<p>
<v-alert icon="priority_high" value="true" outline :style="style">
This is a live beta running on the Ethereum mainnet. The protocol <a href="https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/audits/v1/solidified_audit_report.pdf" target="_blank">has been audited</a> and subjected to a <a href="https://medium.com/project-wyvern/wyvern-protocol-bug-bounty-5k-65c0f8d9998e" target="_blank">public bounty</a>, so it should be solid, but there may be a few UI/UX bugs. Please report issues and send feedback <a href="https://discord.gg/dZZdybs" target="_blank">on Discord</a>.
</v-alert><br />
<v-alert icon="help" value="true" outline :style="style">
Not sure what the Wyvern Exchange is or want the ELI5 overview? Read the <a href="" target="_blank">launch announcement</a>.
</v-alert>
</p><br />
</v-flex xs12>
<v-flex xs12 md6>
<div class="small-heading">Recently Settled Orders</div>
<v-layout v-if="settlements" row wrap>
<v-flex xs12 v-for="(settlement, index) in settlements" :key="index">
{{ settlement.transactionHashIndex }}
</v-flex>
</v-layout>
<v-progress-linear class="progress" v-if="!settlements" v-bind:indeterminate="true"></v-progress-linear>
</v-flex>
<v-flex xs12 md6>
<div class="small-heading">Recently Posted Orders</div>
<v-flex xs12 v-for="(order, index) in orders" :key="index">
{{ order.hash }}
</v-flex>
<v-progress-linear class="progress" v-if="!orders" v-bind:indeterminate="true"></v-progress-linear>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
export default {
  name: 'home',
  metaInfo: {
    title: 'Home'
  },
  created: function () {
    this.reload()
  },
  methods: {
    reload: function () {
      this.$store.dispatch('fetchRecentSettlements', {})
      this.$store.dispatch('fetchRecentOrders', {})
    }
  },
  computed: {
    settlements: function () {
      return this.$store.state.recentSettlements
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
.home {
  font-size: 1.2em;
}

.small-heading {
  text-align: center;
  font-size: 1.3em;
  font-variant: small-caps;
}

a:hover {
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
