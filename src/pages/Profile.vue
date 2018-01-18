<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
Authenticated with web3 as {account}, resolved through ENS as {ens}.
</v-flex>
<v-flex xs12>
Balances by token (stored on Exchange / approved for use / in account)
</v-flex>
</v-layout>
</v-container>
</template>

<script>
export default {
  metaInfo: {
    title: 'Profile'
  }
}
</script>

<style scoped>
</style>
