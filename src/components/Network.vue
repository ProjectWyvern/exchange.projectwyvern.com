<template>
<v-list dense>
  <v-list-tile @click.stop="close()">
    <v-list-tile-action>
      <v-icon>exit_to_app</v-icon>
    </v-list-tile-action>
    <v-list-tile-content>
      <v-list-tile-title>Exit</v-list-tile-title>
    </v-list-tile-content>
  </v-list-tile>
</v-list>
</template>

<script>
export default {
  name: 'network',
  props: ['close']
}
</script>

<style scoped>
</style>
