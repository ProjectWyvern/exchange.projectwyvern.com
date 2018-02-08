<template>
<v-container>
<v-text-field style="margin-left: 2em; max-width: 400px;" v-model="filter" label="Filter by schema, event name, or arguments" name="filter"></v-text-field>
<v-layout row wrap class="container" :style="style">
<v-flex xs12 v-for="(event, index) in events" :key="index">
<event :schema="event.schema" :asset="event.asset" :event="event.event"></event>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import Event from '../components/Event'
import { waitForWeb3, getRecentEvents } from '../aux'

// Need to build event query from search fields.
// Goal: easy event search across fields, across particular assets, and across schemas.

export default {
  components: { Event },
  metaInfo: {
    title: 'Asset Directory'
  },
  data: function () {
    return {
      events: [],
      filter: ''
    }
  },
  created: async function () {
    await waitForWeb3()
    const evts = await getRecentEvents(this.$store.state.web3.schemas, this.$store.state.web3.base.blockNumber - 50000)
    this.events = evts
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
