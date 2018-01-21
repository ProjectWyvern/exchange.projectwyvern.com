<template>
<v-list dense>
  <v-list-tile>
    <v-list-tile-content style="font-size: 1.5em; font-variant: small-caps">
      <span style="margin: 0 auto;">Notifications</span>
    </v-list-tile-content>
  </v-list-tile>
</v-list>
</template>

<script>
export default {
  name: 'notifications',
  props: ['close']
}
</script>

<style scoped>
</style>
