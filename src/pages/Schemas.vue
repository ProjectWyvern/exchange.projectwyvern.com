<template>
<v-container>
<div>Displaying asset schemas for currently configured network: {{ network }}. {{ schemas.length }} schema(s) matched query.</div>
<br />
<v-text-field style="max-width: 400px; display: inline-block;" v-model="filter" label="Filter by name" name="filter"></v-text-field>
<v-layout row wrap>
<v-flex xs12 md6 lg4 xl3 v-for="(schema, index) in schemas" :key="index">
<router-link :to="'/assets?schema=' + schema.name"><schema hover :schema="schema"></schema></router-link>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import Schema from '../components/Schema'

const capitalize = s => s[0].toUpperCase() + s.slice(1)

export default {
  components: { Schema },
  metaInfo: {
    title: 'Asset Schemas'
  },
  data: function () {
    return {
      filter: ''
    }
  },
  computed: {
    network: function () {
      return this.$store.state.web3.base ? capitalize(this.$store.state.web3.base.network) : null
    },
    schemas: function () {
      return (this.$store.state.web3.schemas || []).map((s, index) => {
        s.index = index
        return s
      }).filter(s => this.filter === '' || s.name.toLowerCase().indexOf(this.filter.toLowerCase()) !== -1)
    }
  }
}
</script>

<style scoped>
</style>
