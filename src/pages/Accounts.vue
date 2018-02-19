<template>
<v-container>
<div>Account listing with useful statistics coming soon! Individual account pages accessible at /accounts/[address].</div>
</v-container>
</template>

<script>
import Account from '../components/Account'

export default {
  name: 'accounts',
  components: { Account },
  metaInfo: {
    title: 'Accounts'
  },
  data: function () {
  },
  computed: {
  }
}
</script>

<style scoped>
</style>
