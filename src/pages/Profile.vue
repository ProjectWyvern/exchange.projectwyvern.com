<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
<v-progress-linear class="loading" v-if="!base" v-bind:indeterminate="true"></v-progress-linear>
<span v-if="base && account">Authenticated with web3 as {{ account }}.</span>
<span v-if="base && !account">No account specified by web3 provider, read-only mode.</span>
</v-flex>
<!--<v-flex xs12>
Balances by token (stored on Exchange / approved for use / in account).
</v-flex>-->
</v-layout>
</v-container>
</template>

<script>
export default {
  metaInfo: {
    title: 'Profile'
  },
  computed: {
    base: function() {
      return this.$store.state.web3.base ? true : false
    },
    account: function() {
      return this.$store.state.web3.base ? this.$store.state.web3.base.account : null
    }
  }
}
</script>

<style scoped>
.loading {
  max-width: 700px;
}
</style>
