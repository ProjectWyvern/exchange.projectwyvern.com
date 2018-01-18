<template>
<v-card :hover="hover" raised style="height: 350px; width: 350px;">
  <v-card-media :src="metadata.image" height="200px">
  </v-card-media>
  <v-card-title primary-title>
    <div style="width: 100%;">
      <div style="width: 100%;">
        <h3 style="display: inline-block;">{{ metadata.title }}</h3>
        <span class="elevation-5 price">On Sale for {{ price }} {{ token.symbol }}</span>
      </div>
      <div>{{ metadata.description }}</div><br />
    </div>
  </v-card-title>
  <v-card-actions v-if="signature">
    <v-btn flat>Details</v-btn>
    <v-btn flat>Match</v-btn>
  </v-card-actions>
</v-card>
</template>

<script>
import _tokens from '../wyvern-schemas/build/tokens.json'

export default {
  name: 'order',
  props: ['order', 'metadata', 'signature', 'hover'],
  computed: {
    token: function() {
      return _tokens.filter(t => t.address === this.order.paymentToken)[0]
    },
    price: function() {
      return this.order.basePrice
    }
  }
}
</script>

<style scoped>
.price {
  position: relative;
  bottom: 0.4em;
  float: right;
  background: #000;
  color: #fff;
  padding: 0.3em;
}
</style>
