<template>
<v-card :hover="hover" raised style="height: 350px; width: 300px;">
  <div class="top">
    <span class="schema"><code>{{ schema ? schema.name : asset.schema }}</code></span>
    <v-btn class="url" @click.stop="navigate(metadata.url)" :href="metadata.url" target="_blank" flat>External URL</v-btn>
  </div>
  <v-card-media :src="metadata.thumbnail" height="150px">
  </v-card-media>
  <v-card-title primary-title>
    <div style="width: 80%;">
      <div style="width: 100%;">
        <h3 style="display: inline-block;">{{ metadata.title }}</h3>
      </div>
      <div style="font-size: 0.9em; max-width: 100%; word-wrap: break-word;">{{ metadata.description }}</div><br />
    </div>
    <v-menu bottom left v-if="menu">
      <v-btn icon slot="activator" @click.prevent>
        <v-icon>more_vert</v-icon>
      </v-btn>
      <v-list>
        <v-list-tile v-for="item in menu.items" :key="item.title" @click="item.func()">
          <v-list-tile-title>{{ item.title }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
  </v-card-title>
</v-card>
</template>

<script>
export default {
  name: 'asset',
  props: ['schema', 'hover', 'menu', 'asset'],
  asyncComputed: {
    metadata: async function () {
      if (this.asset.formatted) {
        return this.asset.formatted
      } else {
        return this.schema.formatter(this.asset)
      }
    }
  },
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
