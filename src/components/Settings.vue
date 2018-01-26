<template>
<v-list dense>
  <v-list-tile>
    <v-list-tile-content style="font-size: 1.5em; font-variant: small-caps">
      <span style="margin: 0 auto;">Application Settings</span>
    </v-list-tile-content>
  </v-list-tile>
  <br />
  <v-list-tile>
    <v-list-tile-content>
      <v-switch v-model="nightMode" label="Night Mode"></v-switch>
    </v-list-tile-content>
  </v-list-tile>
  <v-list-tile>
    <v-list-tile-content>
      <v-switch v-model="advancedMode" label="Advanced Mode"></v-switch>
    </v-list-tile-content>
  </v-list-tile>
  <v-list-tile>
    <v-list-tile-content>
    Clear Local State
    </v-list-tile-content>
  </v-list-tile>
</v-list>
</template>

<script>
export default {
  name: 'settings',
  props: ['close'],
  computed: {
    nightMode: {
      get: function () {
        return this.$store.state.settings.nightMode
      },
      set: function (v) {
        this.$store.commit('setNightMode', v)
      }
    },
    advancedMode: {
      get: function () {
        return this.$store.state.settings.advancedMode
      },
      set: function (v) {
        this.$store.commit('setAdvancedMode', v)
      }
    }
  }
}
</script>

<style scoped>
</style>
