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
    <div>Exchange Available <span class="balance">{{ exchangeAvailable.div(Math.pow(10, 18)).toNumber() }} ETH</span></div>
    <div>Exchange Locked <span class="balance">{{ exchangeLocked.div(Math.pow(10, 18)).toNumber() }} ETH</span></div>
    <div>
      <v-radio-group v-model="which" :mandatory="true" row>
        <v-radio label="Wrap" value="wrap" :color="$vuetify.theme.primary"></v-radio>
        <v-radio label="Unwrap" value="unwrap" :color="$vuetify.theme.primary"></v-radio>
        <v-radio label="Withdraw" value="withdraw" :color="$vuetify.theme.primary"></v-radio>
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
<v-data-table v-bind:headers="headers" :items="balances" item-key="symbol" class="elevation-2" style="max-width: 1000px;">
  <template slot="items" slot-scope="props">
    <tr @click="props.expanded = !props.expanded">
      <td>{{ props.item.symbol }}</td>
      <td class="text-xs-right">{{ props.item.name }}</td>
      <td class="text-xs-right">{{ props.item.balanceOnContract }}</td>
      <td class="text-xs-right">{{ props.item.availableOnExchange }}</td>
      <td class="text-xs-right">{{ props.item.lockedOnExchange }}</td>
      <td class="text-xs-right"><v-switch style="margin-left: 40px; width: 30px; margin-right: -15px;" :color="$vuetify.theme.primary" :value="props.item.enabled"></v-switch></td>
    </tr>
  </template>
  <template slot="expand" slot-scope="props">
    <v-card flat>
      <v-card-text style="padding: 0; padding-left: 2em; padding-top: 1em; height: 80px;">
        <v-text-field hide-details label="Amount" style="height: 50px; max-width: 180px;"></v-text-field>
        <v-btn flat style="position: relative; left: 200px; bottom: 40px;">Withdraw</v-btn>
      </v-card-text>
    </v-card>
  </template>
</v-data-table>
</v-flex>
</v-layout>
</v-container>
</template>

<script>
import BigNumber from 'bignumber.js'

import { encodeCall } from 'wyvern-schemas'
import { WyvernProtocol } from 'wyvern-js'

import { method, CanonicalWETH, WyvernExchange } from '../abis/index.js'

export default {
  metaInfo: {
    title: 'Account Balances'
  },
  data: function () {
    return {
      amount: null,
      which: 'wrap',
      headers: [
        {text: 'Symbol', value: 'symbol', align: 'left'},
        {text: 'Name', value: 'name'},
        {text: 'Token Balance', value: 'balanceOnContract'},
        {text: 'Exchange Available', value: 'availableOnExchange'},
        {text: 'Exchange Locked', value: 'lockedOnExchange'},
        {text: 'Enabled', value: 'enabled'}
      ]
    }
  },
  methods: {
    action: function () {
      switch (this.which) {
        case 'wrap': return this.wrap()
        case 'unwrap': return this.unwrap()
        case 'withdraw': return this.withdraw()
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
    withdraw: function () {
      const amount = WyvernProtocol.toBaseUnitAmount(new BigNumber(this.amount), 18)
      const calldata = encodeCall(method(WyvernExchange, 'withdraw'), [this.$store.state.web3.base.account, this.tokens.canonicalWrappedEther.address, amount.toString(), this.$store.state.web3.base.account])
      this.$store.dispatch('rawSend', { target: WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network), data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    approve: function () {
      const amount = WyvernProtocol.MAX_UINT_256.toString()
      const calldata = encodeCall(method(CanonicalWETH, 'approve'), [WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network), amount])
      this.$store.dispatch('rawSend', { target: this.tokens.canonicalWrappedEther.address, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    },
    unapprove: function () {
      const calldata = encodeCall(method(CanonicalWETH, 'approve'), [WyvernProtocol.getExchangeContractAddress(this.$store.state.web3.base.network), '0'])
      this.$store.dispatch('rawSend', { target: this.tokens.canonicalWrappedEther.address, data: calldata, amount: 0, onTxHash: console.log, onError: console.log, onConfirm: console.log })
    }
  },
  computed: {
    enabled: {
      get: function () { return this.$store.state.web3.base.exchangeApproved.equals(WyvernProtocol.MAX_UINT_256) },
      set: function (v) {
        if (v) {
          this.approve()
        } else {
          this.unapprove()
        }
      }
    },
    tokens: function () {
      return this.$store.state.web3.tokens ? this.$store.state.web3.tokens : {}
    },
    balances: function () {
      return !this.$store.state.web3.balances ? [] : this.$store.state.web3.balances.map(b => {
        const token = this.$store.state.web3.tokens.otherTokens.filter(t => t.address === b.address)[0]
        return {
          symbol: token.symbol,
          name: token.name,
          balanceOnContract: WyvernProtocol.toUnitAmount(b.balanceOnContract, token.decimals).toNumber(),
          availableOnExchange: WyvernProtocol.toUnitAmount(b.availableOnExchange, token.decimals).toNumber(),
          lockedOnExchange: WyvernProtocol.toUnitAmount(b.lockedOnExchange, token.decimals).toNumber(),
          enabled: b.approvedOnExchange.equals(WyvernProtocol.MAX_UINT_256)
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
