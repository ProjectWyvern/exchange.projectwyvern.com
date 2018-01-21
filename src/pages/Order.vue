<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 4em; text-align: center;" hidden-xs-only>
Order {{ this.$route.params.hash }}
</v-flex>
<v-flex xs12 v-if="!order">
<div style="width: 50px; margin: 0 auto; margin-top: 70px;">
<v-progress-circular v-bind:size="40" v-bind:indeterminate="true" style="margin: 0 auto;"></v-progress-circular>
</div>
</v-flex>
<v-flex xs12 v-if="order">
<component v-bind:is="order.metadata.schema" style="margin: 0 auto;" :metadata="order.metadata"></component>
</v-flex>
<v-flex xs12 v-if="order">
<div style="text-align: center; line-height: 4em;">
Price and settlement information.
</div>
</v-flex>
<v-flex xs12 v-if="order">
<div style="margin: 0 auto; width: 100px;">
<v-btn raised>
Match
</v-btn>
</div>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import Asset from '../components/Asset'

export default {
  name: 'orderPage',
  components: { Asset },
  metaInfo: {
    title: 'View Order'
  },
  created: function() {
    this.$store.dispatch('fetchOrder', { hash: this.$route.params.hash })
  },
  computed: {
    order: function() {
      return this.$store.state.ordersByHash[this.$route.params.hash]
    },
    
  }
}
</script>

<style scoped>
</style>
