<template>
<v-container>
<v-layout row wrap>
<v-flex xs12>
<v-progress-linear class="loading" v-if="!base" v-bind:indeterminate="true"></v-progress-linear>
<div v-if="base">
<v-card style="max-width: 400px;">
<v-card-title>
<span v-if="base && account">Authenticated with web3 as {{ account }}.</span>
<span v-if="base && !account">No account specified by web3 provider, read-only mode.</span>
</v-card-title>
</v-card>
<br />
<v-card v-if="account" style="max-width: 400px;">
  <v-card-title style="font-size: 1.2em; margin-bottom: -20px; height: 65px;">
    <div style="width: 100%;">
      <span>Ethereum Balances</span>
      <span style="position: relative; width: 110px; float: right;">
        <v-switch :color="$vuetify.theme.primary" v-model="enabled" :label="enabled ? 'Enabled' : 'Disabled'"></v-switch>
      </span>
    </div>
  </v-card-title>
  <v-card-text>
    <div>Unwrapped <span class="balance">{{ unwrappedBalance.div(Math.pow(10, 18)).toNumber() }} ETH</span></div>
    <div>Wrapped <span class="balance">{{ wrappedBalance.div(Math.pow(10, 18)).toNumber() }} ETH</span></div>
    <div>
      <v-radio-group v-model="which" :mandatory="true" row>
        <v-radio label="Wrap" value="wrap" :color="$vuetify.theme.primary"></v-radio>
        <v-radio label="Unwrap" value="unwrap" :color="$vuetify.theme.primary"></v-radio>
      </v-radio-group>
    </div>
  </v-card-text>
  <v-card-actions style="margin-top: -20px; height: 60px; padding-left: 20px;">
    <v-text-field v-model="amount" label="Amount" style="max-width: 180px;"></v-text-field>
    <v-btn flat @click.native="action()" :disabled="amount === null">{{ which }}</v-btn>
  </v-card-actions>
</v-card>
</div>
</v-flex>
<v-flex v-if="account" xs12>
<br />
<v-card style="max-width: 1000px;">
<v-card-title>
  Tokens
  <v-spacer></v-spacer>
  <v-switch style="position: relative; top: 1.5em; font-size: 1em; right: 1em;" :color="color" v-model="justTracked" label="Only Show Tracked"></v-switch>
  <v-text-field
    append-icon="search"
    label="Search"
    single-line
    hide-details
    v-model="tokenFilter"
  ></v-text-field>
</v-card-title>
<v-data-table v-bind:headers="headers" :items="balances" item-key="symbol" style="max-width: 1000px;" :search="tokenFilter">
  <template slot="items" slot-scope="props">
    <tr>
      <td>{{ props.item.symbol }}</td>
      <td>{{ props.item.name }}</td>
      <td>{{ props.item.balanceOnContract }}</td>
      <td class="text-xs-right"><v-switch style="margin-left: 10px; width: 30px; margin-right: -45px;" :color="color" v-model="props.item.tracked" @click.stop="track(props.item)"></v-switch></td>
      <td class="text-xs-right"><v-switch style="margin-left: 10px; width: 30px; margin-right: -45px;" :color="color" v-model="props.item.enabled" @click.stop="toggle(props.item)"></v-switch></td>
    </tr>
  </template>
</v-data-table>
</v-card>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'

import { encodeCall } from 'wyvern-schemas'
import { WyvernProtocol } from 'wyvern-js'

import { method, CanonicalWETH } from '../abis/index.js'

export default {
  metaInfo: {
    title: 'Account Balances'
  },
  data: function () {
    return {
      amount: null,
      tokenFilter: '',
      justTracked: true,
      which: 'wrap',
      headers: [
        {text: 'Symbol', value: 'symbol', align: 'left'},
        {text: 'Name', value: 'name'},
        {text: 'Token Balance', value: 'balanceOnContract'},
        {text: 'Tracked', value: 'tracked'},
        {text: 'Enabled', value: 'enabled'}
      ]
    }
  },
  methods: {
    toggle: function (token) {
      if (token.enabled) this.unapprove(token)
      else this.approve(token)
    },
    track: function (token) {
      if (token.tracked) this.$store.commit('untrackToken', token.address)
      else this.$store.commit('trackToken', token.address)
    },
    action: function () {
      switch (this.which) {
        case 'wrap': return this.wrap()
        case 'unwrap': return this.unwrap()
      }
    },
    wrap: function () {
      const calldata = encodeCall(method(CanonicalWETH, 'deposit'), [])
      const amount = WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), 18)
      this.$store.dispatch('rawSend', { target: this.tokens.canonicalWrappedEther.address, data: calldata, amount: amount, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    unwrap: function () {
      const amount = WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), 18)
      const calldata = encodeCall(method(CanonicalWETH, 'withdraw'), [amount])
      this.$store.dispatch('rawSend', { target: this.tokens.canonicalWrappedEther.address, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    approve: function (token) {
      const amount = WyvernProtocol.MAX_UINT_256.toString()
      const calldata = encodeCall(method(CanonicalWETH, 'approve'), [WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network), amount])
      this.$store.dispatch('rawSend', { target: token.address, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    unapprove: function (token) {
      const calldata = encodeCall(method(CanonicalWETH, 'approve'), [WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network), '0'])
      this.$store.dispatch('rawSend', { target: token.address, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    }
  },
  computed: {
    color: function () { return this.$vuetify.theme.primary },
    enabled: {
      get: function () { return this.$store.state.web3.base.exchangeApproved.gt(0) },
      set: function (v) {
        if (v) {
          this.approve(this.tokens.canonicalWrappedEther)
        } else {
          this.unapprove(this.tokens.canonicalWrappedEther)
        }
      }
    },
    tokens: function () {
      return this.$store.state.web3.tokens ? this.$store.state.web3.tokens : {}
    },
    balances: function () {
      return !this.$store.state.web3.balances ? [] : this.$store.state.web3.balances.filter(b => !this.justTracked || b.tracked).map(b => {
        const token = this.$store.state.web3.tokens.otherTokens.filter(t => t.address === b.address)[0]
        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balanceOnContract: WyvernProtocol.toUnitAmount(b.balanceOnContract, token.decimals).toNumber(),
          tracked: b.tracked,
          enabled: b.approvedOnExchange.gt(0)
        }
      })
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
    },
    exchangeAvailable: function () {
      return this.$store.state.web3.base.exchangeAvailable
    },
    exchangeLocked: function () {
      return this.$store.state.web3.base.exchangeLocked
    }
  }
}
</script>

<style scoped>
.loading {
  max-width: 700px;
}

.balance {
  position: relative;
  float: right;
}
</style>
