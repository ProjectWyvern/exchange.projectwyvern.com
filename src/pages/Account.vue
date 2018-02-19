<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 2em; margin-bottom: 1em; text-align: center;">
Account {{ address }}
</v-flex>
<v-flex xs12 v-if="assets">
  <div class="holder" :style="{maxHeight: maxHeight + 'px'}">
    <v-container grid-list-md>
      <v-layout row wrap>
        <v-flex xs12 md6 lg4 xl3 v-for="(asset, index) in assets" :key="index">
          <router-link :to="'/assets/' + asset.hash">
            <asset hover :asset="asset"></asset>
          </router-link>
        </v-flex>
      </v-layout>
    </v-container>
  </div>
</v-flex>
<v-flex xs12 v-if="!assets">
<v-progress-linear v-bind:indeterminate="true"></v-progress-linear>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import { wyvernExchange } from '../aux'
import Account from '../components/Account'
import Asset from '../components/Asset'

export default {
  name: 'account',
  components: { Account, Asset },
  metaInfo: {
    title: 'Account'
  },
  data: function () {
    return {
      address: this.$route.params.address,
      assets: null
    }
  },
  created: async function () {
    const assets = await wyvernExchange.assets({owner: this.address.toLowerCase(), limit: 1000})
    this.assets = assets
  },
  computed: {
    maxHeight: function () {
      return window.innerHeight - 240
    }
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
