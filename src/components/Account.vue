<template>
<v-card :hover="hover" raised style="width: 300px; padding: 5px; margin: 5px;" :height="expand ? '350' : '300'">
  </v-card-media>
  <v-card-title>
    <h3>Account</h3>
  </v-card-title>
  <v-card-actions v-if="expand" class="actions">
    <v-btn flat target="_blank" href="#">View on Etherscan</v-btn>
  </v-card-actions>
</v-card>
</template>

<script>
export default {
  name: 'account',
  props: ['expand', 'hover'],
  methods: {
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
