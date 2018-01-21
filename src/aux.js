import Promise from 'bluebird'
import BigNumber from 'bignumber.js'
// import _ from 'lodash'
// import { Buffer } from 'buffer'
import Web3 from 'web3'

import { WyvernProtocol } from 'wyvern-js'

import _schemas from './wyvern-schemas/build/schemas.json'
import { logger } from './logging.js'

export const orderToJSON = (order) => {
  var asJSON = {
    exchange: order.exchange.toLowerCase(),
    maker: order.maker.toLowerCase(),
    taker: order.taker.toLowerCase(),
    makerFee: order.makerFee.toString(),
    takerFee: order.takerFee.toString(),
    feeRecipient: order.feeRecipient.toLowerCase(),
    side: order.side.toString(),
    saleKind: order.saleKind.toString(),
    target: order.target.toLowerCase(),
    howToCall: order.howToCall.toString(),
    calldata: order.calldata,
    replacementPattern: order.replacementPattern,
    metadataHash: order.metadataHash,
    paymentToken: order.paymentToken.toLowerCase(),
    basePrice: order.basePrice.toString(),
    extra: order.extra.toString(),
    listingTime: order.listingTime.toString(),
    expirationTime: order.expirationTime.toString(),
    salt: order.salt.toString()
  }
  const hash = WyvernProtocol.getOrderHashHex(asJSON)
  asJSON.hash = hash
  asJSON.metadata = order.metadata
  return asJSON
}

export const orderFromJSON = (order) => {
  const hash = WyvernProtocol.getOrderHashHex(order)
  if (hash !== order.hash) throw new Error('Invalid hash: ' + hash + ', ' + order.hash)
  const fromJSON = {
    hash: order.hash,
    metadata: order.metadata,
    exchange: order.exchange,
    maker: order.maker,
    taker: order.taker,
    makerFee: new BigNumber(order.makerFee),
    takerFee: new BigNumber(order.takerFee),
    feeRecipient: order.feeRecipient,
    side: JSON.parse(order.side),
    saleKind: JSON.parse(order.saleKind),
    target: order.target,
    howToCall: JSON.parse(order.howToCall),
    calldata: order.calldata,
    replacementPattern: order.replacementPattern,
    metadataHash: order.metadataHash,
    paymentToken: order.paymentToken,
    basePrice: new BigNumber(order.basePrice),
    extra: new BigNumber(order.extra),
    listingTime: new BigNumber(order.listingTime),
    expirationTime: new BigNumber(order.expirationTime),
    salt: new BigNumber(order.salt)
  }
  return fromJSON
}

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res)
    })
  )

const toProviderInstance = (str) => {
  if (str === 'injected') {
    return window.web3.currentProvider
  } else {
    return new Web3.providers.HttpProvider(str)
  }
}

export var providerInstance

export var protocolInstance

export const web3Actions = {
}

export var poll

export const bind = (store) => {
  var blockNumber

  poll = async () => {
    providerInstance = toProviderInstance(store.state.settings.web3Provider)
    const web3 = new Web3(providerInstance)
    protocolInstance = new WyvernProtocol(providerInstance, {gasPrice: store.state.settings.gasPrice})
    const start = Date.now() / 1000
    const newBlockNumber = await promisify(web3.eth.getBlockNumber)
    const inter = Date.now() / 1000
    const latency = inter - start
    store.commit('setWeb3Latency', latency)
    if (newBlockNumber === blockNumber) return
    blockNumber = newBlockNumber
    const accounts = await promisify(web3.eth.getAccounts)
    const networkId = await promisify(web3.version.getNetwork)
    var network
    switch (networkId) {
      case '1': network = 'main'; break
      case '2': network = 'morden'; break
      case '3': network = 'ropsten'; break
      case '4': network = 'rinkeby'; break
      case '42': network = 'kovan'; break
      default: network = 'unknown'
    }
    const account = accounts[0] ? accounts[0] : null
    const balance = account ? await promisify(c => web3.eth.getBalance(account, c)) : 0
    const base = { account: account, blockNumber: blockNumber, network: network, balance: new BigNumber(balance) }
    store.commit('setWeb3Base', base)

    {
      const traced = await Promise.all(_schemas.filter(s => s.config.network === network).map(async s => {
        const transferEvent = s.config.events.transfer
        if (!transferEvent.index) return []
        const contract = web3.eth.contract([s.config.events.transfer]).at(transferEvent.target)
        const destination = transferEvent.inputs.filter(i => i.destination)[0]
        var filter = {}
        filter[destination.name] = account
        const events = await promisify(c => contract[transferEvent.name](filter, {fromBlock: 0}).get(c))
        const assets = events.map(e => new BigNumber(e.args._tokenId))
        return assets.map(a => ({schema: s.config.name, asset: a}))
      }))
      const assets = [].concat.apply(...traced)
      store.commit('setWeb3Assets', assets)
    }

    const end = Date.now() / 1000
    const diff = end - start
    logger.debug({extra: {latency: latency, diff: diff}}, 'Reloaded web3 state')
  }
  // poll()
  setInterval(poll, 1000)
}

export { WyvernProtocol } from 'wyvern-js'
