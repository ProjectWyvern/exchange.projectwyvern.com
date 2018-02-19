<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
<v-layout row wrap>
  <v-flex xs12 md6>
    <v-text-field style="margin-left: 2em; max-width: 400px;" v-model="filter" label="Filter by title or description" name="filter"></v-text-field>
  </v-flex>
  <v-flex xs12 md6>
<v-select style="margin: 0; width: 49%; display: inline-block;" @change="reload" autocomplete v-bind:items="schemas" v-model="schema" label="Schema" item-text="name" item-value="value" hide-details></v-select>
  </v-flex>
</v-layout>
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
import Asset from '../components/Asset'

export default {
  name: 'directory',
  components: { Asset },
  metaInfo: {
    title: 'Asset Directory'
  },
  data: function () {
    const query = this.$route.query
    return {
      filter: '',
      assetResult: null,
      schema: query.schema ? query.schema : null
    }
  },
  created: function () {
    this.reload()
  },
  computed: {
    schemas: function () {
      const s = (this.$store.state.web3.schemas || []).map(s => ({name: s.name, value: s.name}))
      const r = [].concat.apply({name: 'Any', value: null}, s)
      return r
    },
    maxHeight: function () {
      return window.innerHeight - 240
    },
    assets: function () {
      return !this.assetResult ? null : this.assetResult.filter(a => {
        return a.formatted.title.indexOf(this.filter) !== -1
      })
    }
  },
  methods: {
    reload: async function (schema) {
      this.assetResult = null
      var query = {}
      if (this.schema) query.schema = this.schema
      if (schema) query.schema = schema
      if (schema === null) delete query.schema
      query.limit = 1000
      this.assetResult = await wyvernExchange.assets(query)
    }
  },
  watch: {
    schema: bind('schema')
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
