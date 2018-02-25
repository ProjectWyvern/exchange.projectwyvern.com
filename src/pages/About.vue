<template>
<v-container>
<p>
<div class="heading">What is the Wyvern Exchange?</div><br />
The Wyvern Exchange is a decentralized digital asset exchange running on the Ethereum blockchain.<br />
Using the Wyvern Exchange, you can buy or sell anything you can represent on Ethereum, from virtual kittens to ENS names to smart contracts, to or from anyone in the world.
</p><br />
<p>
<div class="heading">Why use the Wyvern Exchange?</div><br />
<div class="small-heading">No counterparty trust required.</div><br />
The Wyvern Exchange runs on the <a href="https://projectwyvern.com" target="_blank">Wyvern Protocol</a>, a completely open-source platform for exchanging digital assets represented on the Ethereum blockchain.<br />
Neither we nor anyone you trade with can steal your funds or prevent you from transferring your assets, and if we were to vanish in a quantum anomaly, you could simply run the Exchange yourself.
The Wyvern Protocol has been <a href="https://github.com/ProjectWyvern/wyvern-ethereum/blob/master/audits/v1/solidified_audit_report.pdf" target="_blank">privately audited</a> and subjected to a <a href="https://medium.com/project-wyvern/wyvern-protocol-bug-bounty-5k-65c0f8d9998e" target="_blank">public bug bounty</a>.
</p>
<p>
<div class="small-heading">Buy or sell whatever you want.</div><br />
The Wyvern Protocol is representation-agnostic. If you can send it with an Ethereum transaction, you can buy or sell it on the Exchange.<br />
The Wyvern Exchange streamlines UI/UX for common asset types - if you'd like your asset to be added, <a href="https://github.com/projectwyvern/wyvern-schemas/issues" target="_blank">let us know</a>.
</p>
<p>
<div class="small-heading">Buy or sell the way you want.</div><br />
Choose your method of sale - the Wyvern Exchange supports fixed-price sales and Dutch auctions right now, and later protocol versions will add more options.<br />
Buy or sell assets for any ERC20-compatible Ethereum token (buyer and seller must agree on the token; 0x-based seamless exchange coming soon).<br />
The Exchange is a two-sided marketplace. Both buy-side and sell-side orders are supported: you can sell your particular digital cat or place an order to buy any digital cat with blue eyes and a red tail.
</p>
<p>
<div class="small-heading">No rent-extracting intermediaries.</div><br />
Right now, during beta, the Wyvern Exchange charges no fees at all.<br />
Later on, a fraction of a percent of each sale will be charged to pay for server infrastructure and support protocol development - but if you don't like that fee, you can run your own version of the Exchange without one!
</p>
<br />
<p>
<div class="heading">How do I get started?</div><br />
<router-link to="/orders">Browse existing orders</router-link>, <router-link to="/post">place an order of your own</router-link>, or <router-link to="/account/assets">browse through the digital assets you already possess</router-link>.
</p>
<br />
<div class="heading">Learn More</div><br />
</p>
<p>
The Wyvern Protocol is governed by the <a href="https://dao.projectwyvern.com" target="_blank">Wyvern DAO</a>, a decentralized autonomous organization. Anyone who holds WYV tokens is a shareholder in the Wyvern DAO and may directly vote on governance decisions or delegate their votes to a trusted party who will do so in their stead.
</p>
<p>
All application code is open-source. To request a fix or suggest an improvement, please open an issue or submit a pull request using the <a href="https://github.com/ProjectWyvern/exchange.projectwyvern.com">Github repository</a>.
</p>
<p>
To learn more about the Wyvern project, visit <a href="https://projectwyvern.com" target="_blank">projectwyvern.com</a>. You can also follow us on <a href="https://twitter.com/WyvernExchange" target="_blank">Twitter</a> or <a href="https://medium.com/project-wyvern" target="_blank">Medium</a>.
</p>
<p>
For realtime support and discussion, join our <a href="https://discord.gg/dZZdybs">Discord</a>.
</p>
</v-container>
</template>

<script>
export default {
  metaInfo: {
    title: 'About'
  }
}
</script>

<style scoped>
a:hover {
  text-decoration: underline;
}

a {
  color: #E12D32;
}

.heading {
  font-variant: small-caps;
  font-size: 2em;
}

.small-heading {
  font-size: 1.5em;
}
</style>
