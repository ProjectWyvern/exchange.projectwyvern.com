<template>
<v-card raised style="height: 350px; width: 350px;">
  <v-card-media :src="metadata.image" height="200px">
  </v-card-media>
  <v-card-title primary-title>
    <div>
      <h3>{{ metadata.title }}</h3>
      <div>{{ metadata.description }}</div>
    </div>
  </v-card-title>
  <v-card-actions v-if="signature">
    <v-btn flat>Details</v-btn>
    <v-btn flat>Match</v-btn>
  </v-card-actions>
</v-card>
</template>

<script>
export default {
  name: 'order',
  props: ['order', 'metadata', 'signature']
}
</script>

<style scoped>
</style>
