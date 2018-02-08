<template>
<v-card :hover="hover" raised style="height: 100px; width: 100%; margin: 1em;">
  <div class="top">
    <span class="schema"><code>{{ schema.name }}</code></span>
    <v-btn class="url" :href="url" target="_blank" flat>View Transaction</v-btn>
  </div>
  <v-card-title primary-title>
    {{ event.event }} of {{ title }} {{ info }}
  </v-card-title>
</v-card>
</template>

<script>
export default {
  name: 'event',
  props: ['schema', 'asset', 'event', 'hover'],
  methods: {
  },
  computed: {
    url: function () {
      return 'https://etherscan.io'
    },
    title: function () {
      return this.schema.formatter(this.asset).title
    },
    info: function () {
      const from = this.event.args[this.schema.events.transfer.inputs.filter(i => i.kind === 'source')[0].name]
      const to = this.event.args[this.schema.events.transfer.inputs.filter(i => i.kind === 'destination')[0].name]
      return 'from ' + from + ' to ' + to
    }
  }
}
</script>

<style scoped>
.top {
  padding-top: 5px;
  padding-left: 5px;
  padding-right: 5px;
  height: 30px;
}

.schema {
  float: left;
  font-size: 0.8em;
}

.url {
  float: right;
  z-index: 1;
  margin: 0px;
  height: 20px;
  font-size: 0.8em;
}
</style>
