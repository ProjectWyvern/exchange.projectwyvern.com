<template>
<v-card :hover="hover" raised style="height: 250px; width: 250px;">
  <v-card-media :src="metadata.thumbnail" height="150px">
  </v-card-media>
  <v-card-title primary-title>
    <div style="width: 100%;">
      <div style="width: 100%;">
        <h3 style="display: inline-block;">{{ metadata.title }}</h3>
      </div>
      <div>{{ metadata.description }}</div><br />
    </div>
  </v-card-title>
</v-card>
</template>

<script>
export default {
  name: 'asset',
  props: ['metadata', 'hover'],
  computed: {
  }
}
</script>

<style scoped>
</style>
