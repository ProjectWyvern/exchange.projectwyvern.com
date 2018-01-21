<template>
<v-container>
<v-layout>
<v-flex xs12>
<p>
<v-alert color="info" icon="priority_high" value="true" outline>
This is a prerelease alpha version, running on Ethereum's Rinkeby testnet. Expect UI/UX bugs. Please report issues and send feedback <a href="" target="_blank">using this form</a>.
</v-alert>
</p><br />
<p>
<div class="heading">What is the Wyvern Exchange?</div><br />
The Wyvern Exchange is a decentralized digital asset exchange running on the Ethereum blockchain. Using the Wyvern Exchange, you can buy or sell anything you can represent on Ethereum, from virtual kittens to smart contracts, to or from anyone in the world.
</p><br />
<p>
<div class="heading">Why use the Wyvern Exchange?</div><br />
<div class="small-heading">No trust required.</div><br />
The Wyvern Exchange runs on the <a href="https://projectwyvern.com" target="_blank">Wyvern Protocol</a>, a completely open-source platform for exchanging digital assets represented on the Ethereum blockchain.<br />
Neither we nor anyone you trade with can steal your funds or prevent you from transferring your assets, and if we were to vanish in a quantum anomaly, you could simply run the Exchange yourself.
</p>
<p>
<div class="small-heading">Buy or sell whatever you want.</div><br />
The Wyvern protocol is representation-agnostic. If you can send it with an Ethereum transaction, you can buy or sell it on the Exchange.<br />
The Wyvern Exchange streamlines UI/UX for common asset types - if you'd like your asset to be added, <a href="" target="_blank">let us know</a>.
</p>
<p>
<div class="small-heading">Buy or sell the way you want.</div><br />
Choose your method of sale - the Wyvern Exchange supports fixed-price sales, English auctions, and Dutch auctions natively, and the protocol is easily extensible.<br />
The Exchange is a two-sided marketplace. Both buy-side and sell-side orders are supported: you can sell your digital cat or place an order to buy any digital cat with blue eyes and a red tail.
</p>
<p>
<div class="small-heading">No rent-extracting intermediaries.</div><br />
Right now, during beta, the Wyvern Exchange charges no fees at all.<br />
Later on, a fraction of a percent of each sale will be charged to pay for server infrastructure and support protocol development - but if you don't like that fee, you can run your own version of the Exchange without one!
</p>
<br />
<p>
<div class="heading">How do I get started?</div><br />
Navigate using the left sidebar to browse existing orders (items for sale), place an order of your own, or browse through the digital assets you already possess.
</p>
</v-flex xs12>
</v-layout>
</v-container>
</template>

<script>
export default {
  metaInfo: {
    title: 'Home'
  },
  computed: {
  }
}
</script>

<style scoped>
.heading {
  font-variant: small-caps;
  font-size: 2em;
}

.small-heading {
  font-size: 1.5em;
}

a:hover {
  text-decoration: underline;
}
</style>
