<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
<v-progress-linear class="loading" v-if="!base" v-bind:indeterminate="true"></v-progress-linear>
<div>
<span v-if="base && account">Authenticated with web3 as {{ account }}.</span>
<span v-if="base && !account">No account specified by web3 provider, read-only mode.</span>
</div>
<div v-if="base">
<div>Unwrapped balance: {{ unwrappedBalance.div(Math.pow(10, 18)).toNumber() }} Ether</div>
<div>Wrapped balance: {{ wrappedBalance.div(Math.pow(10, 18)).toNumber() }} Ether</div><br />
<v-text-field v-model="amount" label="Amount" style="max-width: 200px;"></v-text-field>
<v-btn @click.native="wrap()" :disabled="amount === null">Wrap</v-btn>
<v-btn @click.native="unwrap()" :disabled="amount === null">Unwrap</v-btn>
<v-btn @click.native="approve()">Approve</v-btn>
</div>
</v-flex>
<!--<v-flex xs12>
Balances by token (stored on Exchange / approved for use / in account).
</v-flex>-->
</v-layout>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'

import { encodeWETHDeposit, encodeWETHWithdrawal, encodeCall } from 'wyvern-schemas'

import { WyvernProtocol } from '../aux'

export default {
  metaInfo: {
    title: 'Account Tokens'
  },
  data: function () {
    return {
      amount: null
    }
  },
  methods: {
    wrap: function () {
      const { target, calldata } = encodeWETHDeposit(this.tokens)
      const amount = WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), 18)
      console.log(amount)
      this.$store.dispatch('rawSend', { target: target, data: calldata, amount: amount, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    unwrap: function () {
      const amount = WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), 18)
      const { target, calldata } = encodeWETHWithdrawal(this.tokens, amount)
      this.$store.dispatch('rawSend', { target: target, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    approve: function () {
      // FIXME
      const amount = WyvernProtocol.toBaseUnitAmount(new BigNumber(10000000000000), 18).toString()
      const abi = {'constant': false, 'inputs': [{'name': 'guy', 'type': 'address'}, {'name': 'wad', 'type': 'uint256'}], 'name': 'approve', 'outputs': [{'name': '', 'type': 'bool'}], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}
      const calldata = encodeCall(abi, [WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network), amount])
      this.$store.dispatch('rawSend', { target: this.tokens.canonicalWrappedEther.address, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    }
  },
  computed: {
    tokens: function () {
      return this.$store.state.web3.tokens ? this.$store.state.web3.tokens : {}
    },
    base: function () {
      return !!this.$store.state.web3.base
    },
    account: function () {
      return this.$store.state.web3.base ? this.$store.state.web3.base.account : null
    },
    unwrappedBalance: function () {
      return this.$store.state.web3.base.unwrappedBalance
    },
    wrappedBalance: function () {
      return this.$store.state.web3.base.wrappedBalance
    }
  }
}
</script>

<style scoped>
.loading {
  max-width: 700px;
}
</style>
