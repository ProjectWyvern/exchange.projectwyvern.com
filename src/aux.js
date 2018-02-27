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

export const promisify = (inner) =>
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

export const findAsset = async (state, asset, schema) => {
  var owner
  const ownerOf = schema.functions.ownerOf
  if (ownerOf) {
    const abi = ownerOf(asset)
    const contract = web3.eth.contract([abi]).at(abi.target)
    if (abi.inputs.filter(x => x.value === undefined).length === 0) {
      owner = await promisify(c => contract[abi.name].call(...abi.inputs.map(i => i.value.toString()), c))
      owner = owner.toLowerCase()
    }
  }
  /* This is a bit Ethercraft-specific. Not sure what other ERC20 pseudo-NFTs we might need to support. */
  var proxyCount
  var myCount
  const countOf = schema.functions.countOf
  if (countOf) {
    const abi = countOf(asset)
    const contract = web3.eth.contract([abi]).at(abi.target)
    if (state.web3.proxy) {
      proxyCount = await promisify(c => contract[abi.name].call([state.web3.proxy], c))
      proxyCount = proxyCount.toNumber()
    } else {
      proxyCount = 0
    }
    myCount = await promisify(c => contract[abi.name].call([state.web3.base.account], c))
    myCount = myCount.toNumber()
  }
  if (owner !== undefined) {
    if (owner.toLowerCase() === state.web3.proxy.toLowerCase()) {
      return 'proxy'
    } else if (owner.toLowerCase() === state.web3.base.account.toLowerCase()) {
      return 'account'
    } else if (owner === '0x') {
      return 'unknown'
    } else {
      return 'other'
    }
  } else if (myCount !== undefined && proxyCount !== undefined) {
    if (proxyCount >= 1000000000000000000) {
      return 'proxy'
    } else if (myCount >= 1000000000000000000) {
      return 'account'
    } else {
      return 'other'
    }
  }
  return 'unknown'
}

const depositAsset = async ({ state, commit }, asset, schema, onTxHash, onConfirm) => {
  const abi = schema.functions.transfer(asset)
  const recipient = abi.inputs.filter(i => i.kind === 'replaceable')[0]
  recipient.value = state.web3.proxy
  const data = encodeCall(abi, abi.inputs.map(i => i.value.toString()))
  const accounts = await promisify(web3.eth.getAccounts)
  const account = accounts[0]
  var obj = {to: abi.target, from: account, data: data, value: 0}
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
}

const atomicMatch = async ({ state, commit }, { buy, sell, asset, schema, onError, onCheck, onTxHash, onConfirm }) => {
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

  if (sell.maker.toLowerCase() === account.toLowerCase() && sell.feeRecipient === WyvernProtocol.NULL_ADDRESS) {
    if (!state.web3.proxy) {
      return onCheck(false, 'You must initialize your account before matching a purchase order. You can do so on the "Assets" page under "My Account" on the left.')
    }
    const where = await findAsset(state, asset, schema)
    if (where === 'proxy') {
    } else if (where === 'account') {
      onCheck(true, 'You must first deposit this asset.')
      await promisify(c => {
        const onTxHash = (txHash) => onCheck(true, 'Awaiting transaction confirmation...')
        const onConfirm = (success) => {
          if (success) c(null, null)
          else c(true, null)
        }
        depositAsset({ state, commit }, asset, schema, onTxHash, onConfirm)
      })
      onCheck(true, 'Rechecking order parameters...')
    } else if (where === 'other') {
      return onCheck(false, 'You do not own this asset.')
    }
  }

  if (buy.maker.toLowerCase() === account.toLowerCase()) {
    const required = buy.basePrice /* no buy-side auctions for now */
    var balance = await promisify(c => web3.eth.call({from: account, to: buy.paymentToken, data: encodeCall(method(CanonicalWETH, 'balanceOf'), [account])}, c))
    balance = new BigNumber(balance)
    if (balance.toNumber() < required.toNumber()) {
      if (buy.paymentToken === state.web3.tokens.canonicalWrappedEther.address) return onCheck(false, 'Insufficient balance. You may need to wrap Ether.')
      else return onCheck(false, 'Insufficient balance.')
    }
    var approved = await promisify(c => web3.eth.call({from: account, to: buy.paymentToken, data: encodeCall(method(CanonicalWETH, 'allowance'), [account, WyvernProtocol.getExchangeContractAddress(state.web3.base.network)])}, c))
    approved = new BigNumber(approved)
    if (approved.toNumber() < required.toNumber()) {
      onCheck(true, 'You must approve this token for use.')
      const txHash = await promisify(c => web3.eth.sendTransaction({from: account, to: buy.paymentToken, data: encodeCall(method(CanonicalWETH, 'approve'), [WyvernProtocol.getExchangeContractAddress(state.web3.base.network), WyvernProtocol.MAX_UINT_256.toString()])}, c))
      onCheck(true, 'Waiting for approval transaction to confirm...')
      commit('commitTx', { txHash })
      return promisify(c => {
        track(txHash, async success => {
          commit('mineTx', { txHash, success })
          if (success) {
            try {
              await atomicMatch({ state, commit }, { buy, sell, onError, onCheck, onTxHash, onConfirm })
              c(null, null)
            } catch (err) {
              c(err, null)
            }
          }
        })
      })
    }
  }

  const buyValid = await protocolInstance.wyvernExchange.validateOrder_.callAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt],
    buy.side,
    buy.saleKind,
    buy.howToCall,
    buy.calldata,
    buy.replacementPattern,
    buy.staticExtradata,
    buy.v, buy.r, buy.s,
    { from: account })
  console.log('buyValid', buyValid)
  const sellValid = await protocolInstance.wyvernExchange.validateOrder_.callAsync(
    [sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken],
    [sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    sell.side,
    sell.saleKind,
    sell.howToCall,
    sell.calldata,
    sell.replacementPattern,
    sell.staticExtradata,
    sell.v, sell.r, sell.s,
    { from: account })
  console.log('sellValid', sellValid)
  const ordersCanMatch = await protocolInstance.wyvernExchange.ordersCanMatch_.callAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    [buy.side, buy.saleKind, buy.howToCall, sell.side, sell.saleKind, sell.howToCall],
    buy.calldata,
    sell.calldata,
    buy.replacementPattern,
    sell.replacementPattern,
    buy.staticExtradata,
    sell.staticExtradata,
    { from: account }
  )
  console.log('ordersCanMatch', ordersCanMatch)
  const orderCalldataCanMatch = await protocolInstance.wyvernExchange.orderCalldataCanMatch.callAsync(buy.calldata, buy.replacementPattern, sell.calldata, sell.replacementPattern)
  console.log('orderCalldataCanMatch', orderCalldataCanMatch)

  onCheck(buyValid && sellValid && ordersCanMatch)

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
    [buy.r, buy.s, sell.r, sell.s, '0x0000000000000000000000000000000000000000000000000000000000000000'],
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
      schemas.map(s => {
        const func = s.formatter
        s.formatter = (asset) => cachedAsync((asset) => func(asset, web3), 'schema:formatter:' + s.name)(asset)
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

    if (account) {
      store.dispatch('fetchPersonalAssets', {query: { owner: account.toLowerCase(), limit: 1000 }, transform: arr => arr.map(transformAsset)})
      if (proxy !== null) {
        store.dispatch('fetchProxyAssets', {query: { owner: proxy.toLowerCase(), limit: 1000 }, transform: arr => arr.map(transformAsset)})
      }
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

    {
      /* This is very Ethercraft-specific. */
      const assets = await Promise.all(schemas.filter(s => s.functions.countOf).map(async s => {
        const countOf = s.functions.countOf
        const schemaAssets = await Promise.all(s.allAssets.map(async asset => {
          var proxyCount = 0
          var myCount = 0
          const abi = countOf(asset)
          const contract = web3.eth.contract([abi]).at(abi.target)
          if (proxy) {
            proxyCount = await promisify(c => contract[abi.name].call([proxy], c))
            proxyCount = proxyCount.toNumber()
          }
          myCount = await promisify(c => contract[abi.name].call([account], c))
          myCount = myCount.toNumber()
          myCount /= 1000000000000000000
          proxyCount /= 1000000000000000000
          myCount = Math.floor(myCount)
          proxyCount = Math.floor(proxyCount)
          var assets = []
          if (myCount > 0 || proxyCount > 0) {
            const formatted = await s.formatter(asset)
            const hash = WyvernProtocol.getAssetHashHex(s.hash(asset), s.name)
            for (var i = 0; i < myCount; i++) assets.push({proxy: false, asset: asset, schema: s, formatted: formatted, hash: hash})
            for (i = 0; i < proxyCount; i++) assets.push({proxy: true, asset: asset, schema: s, formatted: formatted, hash: hash})
          }
          return assets
        }))
        return [].concat(...schemaAssets)
      }))
      store.commit('setWeb3Assets', [].concat(...assets))
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
