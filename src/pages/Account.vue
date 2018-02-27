<template>
<v-container>
<v-layout row wrap>
<v-flex xs12 style="line-height: 2em; margin-bottom: 1em; text-align: center;">
Account {{ address }}
<div style="float: right; padding-right: 8em;">
  <v-btn @click.stop="previous" flat :disabled="offset === 0">Previous Page</v-btn>
  <v-btn @click.stop="next" flat>Next Page</v-btn>
</div>
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
import { bind } from '../misc'
import Account from '../components/Account'
import Asset from '../components/Asset'

export default {
  name: 'account',
  components: { Account, Asset },
  metaInfo: function () {
    return {
      title: 'Account ' + this.address
    }
  },
  data: function () {
    const query = this.$route.query
    return {
      address: this.$route.params.address,
      offset: query.offset ? parseInt(query.offset) : 0,
      assets: null
    }
  },
  created: async function () {
    await this.reload()
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
      this.assets = null
      const assets = await wyvernExchange.assets({owner: this.address.toLowerCase(), limit: 20, offset: this.offset})
      this.assets = assets
    }
  },
  computed: {
    maxHeight: function () {
      return window.innerHeight - 240
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
