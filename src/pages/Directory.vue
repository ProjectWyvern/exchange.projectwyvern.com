<template>
<v-container>
<v-text-field style="margin-left: 2em; max-width: 400px;" v-model="filter" label="Filter by schema, event name, or arguments" name="filter"></v-text-field>
<v-layout row wrap class="container" :style="style">
</v-layout>
</v-container>
</template>

<script>
// Need to build asset query from search fields.
// Display as grid, sorted by recency.
// Infinite scroll going back / forward in time.
// Goal: easy event search across fields, across particular assets, and across schemas.

export default {
  name: 'directory',
  metaInfo: {
    title: 'Asset Directory'
  },
  data: function () {
    return {
      filter: ''
    }
  },
  created: async function () {
  },
  computed: {
    style: function () {
      return {
        maxHeight: (window.innerHeight - 250) + 'px'
      }
    }
  }
}
</script>

<style scoped>
.container {
  overflow: auto;
  padding-right: 5em;
}
</style>
