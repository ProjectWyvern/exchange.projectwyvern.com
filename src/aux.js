import Promise from 'bluebird'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import * as exchangeAPI from 'wyvern-exchange'
import { WyvernProtocol } from 'wyvern-js'
import * as WyvernSchemas from 'wyvern-schemas'

import { logger } from './logging.js'
import { cachedAsync } from './cache.js'
import { method, ERC20, CanonicalWETH } from './abis/index.js'

const encodeCall = WyvernSchemas.encodeCall

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res)
    })
  )

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
    staticTarget: order.staticTarget.toLowerCase(),
    staticExtradata: order.staticExtradata,
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

const toProviderInstance = (str) => {
  if (str === 'injected') {
    return window.web3.currentProvider
  } else {
    return new Web3.providers.HttpProvider(str)
  }
}

export var wyvernExchange
export var providerInstance
export var protocolInstance
export var web3

var txCallbacks = {}

export const track = (txHash, onConfirm) => {
  if (txCallbacks[txHash]) {
    txCallbacks[txHash].push(onConfirm)
  } else {
    txCallbacks[txHash] = [onConfirm]
    const poll = async () => {
      if (!web3) {
        setTimeout(poll, 1000)
        return
      }
      const tx = await promisify(c => web3.eth.getTransaction(txHash, c))
      if (tx && tx.blockHash && tx.blockHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        const receipt = await promisify(c => web3.eth.getTransactionReceipt(txHash, c))
        const status = parseInt(receipt.status) === 1
        txCallbacks[txHash].map(f => f(status))
        delete txCallbacks[txHash]
      } else {
        setTimeout(poll, 1000)
      }
    }
    poll()
  }
}

const wrapAction = (func) => {
  return async (fst, snd) => {
    try {
      await func(fst, snd)
    } catch (err) {
      const { onError } = snd
      onError(err)
    }
  }
}

const wrapSend = (contract, method) => {
  return async ({ state, commit }, { params, onError, onTxHash, onConfirm }) => {
    const accounts = await promisify(web3.eth.getAccounts)
    const account = accounts[0]
    params.push({from: account})
    const txHash = await protocolInstance[contract][method].sendTransactionAsync(...params)
    commit('commitTx', { txHash: txHash, params: params })
    onTxHash(txHash)
    track(txHash, (success) => {
      commit('mineTx', { txHash: txHash, success: success })
      onConfirm(success)
    })
  }
}

const postOrder = async ({ state, commit }, { order, callback, onError }) => {
  const hash = await protocolInstance.wyvernExchange.hashOrder_.callAsync(
    [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
    [order.makerFee, order.takerFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
    order.side,
    order.saleKind,
    order.howToCall,
    order.calldata,
    order.replacementPattern,
    order.staticExtradata)
  if (hash !== order.hash) return onError('Hashes did not match: ', hash + ', ' + order.hash + '!')
  const valid = await protocolInstance.wyvernExchange.validateOrder_.callAsync(
    [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
    [order.makerFee, order.takerFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
    order.side,
    order.saleKind,
    order.howToCall,
    order.calldata,
    order.replacementPattern,
    order.staticExtradata,
    parseInt(order.v),
    order.r || '0x',
    order.s || '0x')
  if (!valid) return onError('Order did not pass validation!')
  try {
    await wyvernExchange.postOrder(order)
  } catch (err) {
    return onError('Orderbook rejected order!')
  }
  callback()
}

const cancelOrder = async ({ state, commit }, { order, onTxHash, onConfirm }) => {
  const accounts = await promisify(web3.eth.getAccounts)
  const account = accounts[0]
  const txHash = await protocolInstance.wyvernExchange.cancelOrder_.sendTransactionAsync(
    [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
    [order.makerFee, order.takerFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
    order.side,
    order.saleKind,
    order.howToCall,
    order.calldata,
    order.replacementPattern,
    order.staticExtradata,
    order.v, order.r, order.s,
    {from: account})
  commit('commitTx', { txHash: txHash })
  onTxHash(txHash)
  track(txHash, (success) => {
    commit('mineTx', { txHash: txHash, success: success })
    onConfirm(success)
  })
}

const atomicMatch = async ({ state, commit }, { buy, sell, onError, onTxHash, onConfirm }) => {
  const accounts = await promisify(web3.eth.getAccounts)
  const account = accounts[0]

  /* This is a bug, short-circuit not working properly. */
  if (!buy.r || !buy.s) {
    buy.v = sell.v
    buy.r = sell.r
    buy.s = sell.s
  } else {
    sell.v = buy.v
    sell.r = buy.r
    sell.s = buy.s
  }

  const txHash = await protocolInstance.wyvernExchange.atomicMatch_.sendTransactionAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    [buy.side, buy.saleKind, buy.howToCall, sell.side, sell.saleKind, sell.howToCall],
    buy.calldata,
    sell.calldata,
    buy.replacementPattern,
    sell.replacementPattern,
    buy.staticExtradata,
    sell.staticExtradata,
    [buy.v, sell.v],
    [buy.r, buy.s, sell.r, sell.s],
    { from: account }
  )
  commit('commitTx', { txHash: txHash })
  onTxHash(txHash)
  track(txHash, (success) => {
    commit('mineTx', { txHash: txHash, success: success })
    onConfirm(success)
  })
}

export const web3Actions = {
  registerProxy: wrapAction(wrapSend('wyvernProxyRegistry', 'registerProxy')),
  atomicMatch: wrapAction(atomicMatch),
  postOrder: wrapAction(postOrder),
  cancelOrder: wrapAction(cancelOrder),
  rawSend: wrapAction(async ({ state, commit }, { target, data, amount, onError, onTxHash, onConfirm }) => {
    const accounts = await promisify(web3.eth.getAccounts)
    const account = accounts[0]
    var obj = {to: target, from: account, data: data, value: amount}
    const result = await promisify(c => web3.eth.call(obj, c))
    const estGas = await promisify(c => web3.eth.estimateGas(obj, c))
    obj.gas = estGas
    const txHash = await promisify(c => web3.eth.sendTransaction(obj, c))
    commit('commitTx', { txHash: txHash, estGas: estGas, simulationResult: result })
    onTxHash(txHash)
    track(txHash, (success) => {
      commit('mineTx', { txHash, success })
      onConfirm(success)
    })
  })
}

export const trackOrder = async (store, hash) => {
  if (!protocolInstance) {
    return
  }
  const order = store.state.ordersByHash[hash]
  const currentPrice = await protocolInstance.wyvernExchange.calculateCurrentPrice_.callAsync(
    [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
    [order.makerFee, order.takerFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
    order.side,
    order.saleKind,
    order.howToCall,
    order.calldata,
    order.replacementPattern,
    order.staticExtradata
  )
  store.commit('setOrderData', { hash, key: 'currentPrice', value: currentPrice })
}

export var poll

var onWeb3Called

export const bind = (store) => {
  var blockNumber
  var prevNetwork
  var account
  var schemas
  var tokens
  var proxy

  poll = async (force) => {
    providerInstance = toProviderInstance(store.state.settings.web3Provider)
    web3 = new Web3(providerInstance)
    wyvernExchange = new exchangeAPI.WyvernExchange(store.state.settings.orderbookServer)

    const start = Date.now() / 1000
    const newBlockNumber = await promisify(web3.eth.getBlockNumber)
    const inter = Date.now() / 1000
    const latency = inter - start
    store.commit('setWeb3Latency', latency)
    if (!force && newBlockNumber === blockNumber) return
    blockNumber = newBlockNumber
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

    if (network !== prevNetwork) {
      const accounts = await promisify(web3.eth.getAccounts)
      account = accounts[0] ? accounts[0] : null
      protocolInstance = new WyvernProtocol(providerInstance, {
        network: network,
        gasPrice: store.state.settings.gasPrice
      })
      schemas = WyvernSchemas.schemas[network]
      window.formatters = {}
      schemas.map(s => {
        s.formatter = cachedAsync(s.formatter, 'schema:formatter:' + s.name)
        window.formatters[s.name] = s.formatter
      })
      store.commit('setWeb3Schemas', schemas)
      tokens = WyvernSchemas.tokens[network]
      store.commit('setWeb3Tokens', tokens)
    }

    if (proxy === null || network !== prevNetwork) {
      proxy = await protocolInstance.wyvernProxyRegistry.proxies.callAsync(account)
      if (proxy === WyvernProtocol.NULL_ADDRESS) {
        proxy = null
      }
      store.commit('setWeb3Proxy', proxy)
    }

    const transformAsset = (asset) => {
      asset.schema = schemas.filter(s => s.name === asset.schema)[0]
      return asset
    }

    store.dispatch('fetchPersonalAssets', {query: { owner: account.toLowerCase(), limit: 1000 }, transform: arr => arr.map(transformAsset)})
    if (proxy !== null) {
      store.dispatch('fetchProxyAssets', {query: { owner: proxy.toLowerCase(), limit: 1000 }, transform: arr => arr.map(transformAsset)})
    }

    prevNetwork = network

    const unwrappedBalance = account ? await promisify(c => web3.eth.getBalance(account, c)) : 0
    const wrappedBalance = account ? await promisify(c => web3.eth.call({from: account, to: tokens.canonicalWrappedEther.address, data: encodeCall(method(CanonicalWETH, 'balanceOf'), [account])}, c)) : 0
    const exchangeApproved = account ? await promisify(c => web3.eth.call({from: account, to: tokens.canonicalWrappedEther.address, data: encodeCall(method(CanonicalWETH, 'allowance'), [account, WyvernProtocol.getExchangeContractAddress(network)])}, c)) : 0
    const base = { account: account, blockNumber: blockNumber, network: network, unwrappedBalance: new BigNumber(unwrappedBalance), wrappedBalance: new BigNumber(wrappedBalance), exchangeApproved: new BigNumber(exchangeApproved) }
    store.commit('setWeb3Base', base)

    await Promise.all(store.state.trackedOrders.map(hash => {
      return trackOrder(store, hash)
    }))

    {
      const balances = await Promise.all(tokens.otherTokens.map(async t => {
        const tracked = store.state.settings.trackedTokens[t.address]
        var balanceOnContract = 0
        var approvedOnExchange = 0
        if (tracked) {
          balanceOnContract = account ? await promisify(c => web3.eth.call({from: account, to: t.address, data: encodeCall(method(ERC20, 'balanceOf'), [account])}, c)) : 0
          if (balanceOnContract === '0x') balanceOnContract = 0
          approvedOnExchange = account ? await promisify(c => web3.eth.call({from: account, to: t.address, data: encodeCall(method(ERC20, 'allowance'), [account, WyvernProtocol.getExchangeContractAddress(network)])}, c)) : 0
          if (approvedOnExchange === '0x') approvedOnExchange = 0
        }
        return { tracked: tracked, address: t.address, balanceOnContract: new BigNumber(balanceOnContract), approvedOnExchange: new BigNumber(approvedOnExchange) }
      }))
      store.commit('setWeb3Balances', balances)
    }

    const end = Date.now() / 1000
    const diff = end - start
    logger.debug({extra: {latency: latency, diff: diff}}, 'Reloaded web3 state')

    if (!onWeb3Called) {
      store.state.notifications.filter(n => !n.finalized).map(n => {
        const hash = n.txHash
        track(hash, (success) => {
          store.commit('mineTx', { txHash: hash, success: success })
        })
      })
    }
  }
  poll()
  setInterval(poll, 1000)
}

export { WyvernProtocol } from 'wyvern-js'
