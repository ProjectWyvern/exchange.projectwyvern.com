<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
<schema expand="true" :schema="schema"></schema>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import Schema from '../components/Schema'

// Display transfer function & event.
// Link to asset list (directory).
// Link to "buy an asset like this" / "sell an asset like this".

export default {
  name: 'schemaPage',
  components: { Schema },
  metaInfo: function () {
    return {
      title: 'Schema for ' + this.$route.params.schema
    }
  },
  computed: {
    schemas: function () {
      return this.$store.state.web3.schemas || []
    },
    schema: function () {
      return this.schemas.filter(s => s.name === this.$route.params.schema)[0]
    }
  }
}
</script>

<style scoped>
</style>
