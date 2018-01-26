<template>
<v-card :hover="hover" raised style="height: 300px; width: 300px;">
  <div class="top">
    <span class="schema"><code>{{ schema }}</code></span>
    <v-btn class="url" @click.stop="navigate(metadata.url)" :href="metadata.url" target="_blank" flat>External URL</v-btn>
  </div>
  <v-card-media :src="metadata.thumbnail" height="150px">
  </v-card-media>
  <v-card-title primary-title>
    <div style="width: 100%;">
      <div style="width: 100%;">
        <h3 style="display: inline-block;">{{ metadata.title }}</h3>
      </div>
      <div style="font-size: 0.9em; max-width: 100%; word-wrap: break-word;">{{ metadata.description }}</div><br />
    </div>
  </v-card-title>
</v-card>
</template>

<script>
export default {
  name: 'asset',
  props: ['metadata', 'schema', 'hover'],
  methods: {
    navigate: function (url) {
      window.open(url, '_blank')
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
