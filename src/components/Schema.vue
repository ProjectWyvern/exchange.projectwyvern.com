<template>
<v-card :hover="hover" raised style="width: 300px; padding: 5px; margin: 5px;" :height="expand ? '350' : '300'">
  <v-card-media :src="schema.thumbnail" height="200px">
  </v-card-media>
  <v-card-title>
    <h3>{{ schema.name }}</h3>
    <div>{{ schema.description }}</div>
  </v-card-title>
  <v-card-actions v-if="expand" class="actions">
    <v-btn flat target="_blank" :href="schema.website">Website</v-btn>
    <router-link :to="'/schemas/' + schema.name"><v-btn flat>Schema Spec</v-btn></router-link>
  </v-card-actions>
</v-card>
</template>

<script>
export default {
  name: 'schema',
  props: ['schema', 'expand', 'hover'],
  methods: {
    navigate: function (url) {
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped>
.actions {
  justify-content: space-around;
}

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
