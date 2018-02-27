<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
<v-layout row wrap style="margin-bottom: 1em;">
  <v-flex md3 hidden-xs-only></v-flex>
  <v-flex xs12 md6>
    <v-select style="margin: 0; width: 33%; display: inline-block;" @change="(schema) => reload(schema, undefined)" autocomplete v-bind:items="schemas" v-model="schema" label="Schema" item-text="name" item-value="value" hide-details></v-select>
    <v-select style="width: 33%; display: inline-block;" @change="(sort) => reload(undefined, sort)" v-bind:items="sorts" v-model="sort" label="Sort" item-text="name" item-value="id" hide-details></v-select>
    <div style="float: right;">
      <v-btn @click.stop="previous" flat :disabled="offset === 0">Previous Page</v-btn>
      <v-btn @click.stop="next" flat :disabled="assets.length < 20">Next Page</v-btn>
    </div>
  </v-flex>
  <v-flex md3 hidden-xs-only></v-flex>
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
      assetResult: null,
      offset: query.offset ? parseInt(query.offset) : 0,
      schema: query.schema ? query.schema : null,
      sort: query.sort ? parseInt(query.sort) : 1,
      sorts: [
        {name: 'Most Recent', id: 1},
        {name: 'Least Recent', id: 2}
      ]
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
      return this.assetResult
    }
  },
  methods: {
    reload: async function (schema, sort) {
      this.assetResult = null
      var query = {}
      if (this.schema) query.schema = this.schema
      if (schema) query.schema = schema
      if (schema === null) delete query.schema
      if (this.sort) query.order = this.sort
      if (sort) query.order = sort
      query.limit = 20
      query.offset = this.offset
      this.assetResult = await wyvernExchange.assets(query)
    },
    next: function () {
      this.offset += 20
      this.reload()
    },
    previous: function () {
      this.offset -= 20
      this.reload()
    }
  },
  watch: {
    schema: bind('schema'),
    sort: bind('sort'),
    offset: bind('offset')
  }
}
</script>

<style scoped>
.holder {
  overflow: auto;
}
</style>
