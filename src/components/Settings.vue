<template>
<v-list dense>
  <v-dialog v-model="clearLocalStateDialog" max-width="500px">
    <v-card>
      <v-card-title style="font-variant: small-caps; font-size: 1.4em;">
        Clear Local State
      </v-card-title>
      <v-card-text>
      Clearing local state will reset your notifications, network configuration, application settings, and event cache.
      </v-card-text>
    <v-card-actions>
      <v-btn color="primary" dark @click.stop="clearLocalState()">Clear State</v-btn>
      <v-btn color="primary" flat @click.stop="clearLocalStateDialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-list-tile>
    <v-list-tile-content style="font-size: 1.5em; font-variant: small-caps">
      <span style="margin: 0 auto;">Application Settings</span>
    </v-list-tile-content>
  </v-list-tile>
  <br />
  <v-list-tile>
    <v-list-tile-content>
      <v-switch v-model="nightMode" label="Night Mode" :color="color" class="setting setting-switch"></v-switch>
    </v-list-tile-content>
  </v-list-tile>
  <!--
  <v-list-tile>
    <v-list-tile-content>
      <v-switch v-model="advancedMode" label="Advanced Mode" :color="color" class="setting setting-switch"></v-switch>
    </v-list-tile-content>
  </v-list-tile>
  -->
  <v-list-tile style="height: 40px;">
    <v-list-tile-content style="height: 1px;">
      <v-divider dark></v-divider>
    </v-list-tile-content>
  </v-list-tile>
  <v-list-tile>
    <v-list-tile-content>
    <v-btn @click.stop="clearLocalStateDialog = true" flat class="setting">Clear Local State</v-btn>
    </v-list-tile-content>
  </v-list-tile>
</v-list>
</template>

<script>
export default {
  name: 'settings',
  props: ['close'],
  data: function () {
    return {
      clearLocalStateDialog: false
    }
  },
  methods: {
    clearLocalState: function () {
      window.localStorage.clear()
      window.location.reload()
    }
  },
  computed: {
    color: function () {
      return this.$vuetify.theme.primary
    },
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

<style>
.setting-switch label {
  font-size: 1.2em;
}
</style>

<style scoped>
.setting {
  width: 180px;
  margin: 0 auto;
}
</style>
