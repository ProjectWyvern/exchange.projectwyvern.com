<template>
<v-container>
  <v-layout row wrap>
    <v-flex xs12 md6>
      <div class="header">
      <v-icon style="margin-right: 0.5em;">device_hub</v-icon>
      Exchange
      </div>
    </v-flex>
    <v-flex xs12 md6>
      <div class="header">
      <v-icon style="margin-right: 0.5em;">person</v-icon>
      Personal
      </div>
      <div :style="containerStyle">
      <v-layout row wrap>
        <v-flex v-for="(asset, index) in personalAssets" xs12 md6 lg6 :key="index">
          <component style="margin: 0 auto; margin-bottom: 1em;" v-bind:is="asset.schema" :metadata="{fields:{_tokenId: asset.asset}}"></component>
        </v-flex>
      </v-layout>
      </div>
    </v-flex>
  </v-layout>
</v-container>
</template>

<script>
// https://github.com/SortableJS/Vue.Draggable

export default {
  metaInfo: {
    title: 'Assets'
  },
  computed: {
    containerStyle: function() {
      return {
        maxHeight: (window.innerHeight - 220) + 'px', 
        overflow: 'auto'
      }
    },
    personalAssets: function() {
      return this.assets
    },
    assets: function() {
      return this.$store.state.web3.assets || []
    }
  }
}
</script>

<style scoped>
.header {
  font-size: 1.3em;
  text-align: center;
  margin-bottom: 1em;
}
</style>
