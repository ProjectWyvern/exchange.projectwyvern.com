import Promise from 'bluebird'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import { WyvernProtocol } from 'wyvern-js'
import * as WyvernSchemas from 'wyvern-schemas'

import api from './api'
import { logger } from './logging.js'
import { method, WyvernExchange, ERC20, CanonicalWETH } from './abis/index.js'

const encodeCall = WyvernSchemas.encodeCall

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
    salt: new BigNumber(order.salt),
    v: parseInt(order.v),
    r: order.r,
    s: order.s
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
      if (tx.blockHash && tx.blockHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
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

const postOrder = async ({ state, commit }, { order, callback }) => {
  const valid = await protocolInstance.wyvernExchange.validateOrder_.callAsync(
    [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.paymentToken],
    [order.makerFee, order.takerFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
    order.side,
    order.saleKind,
    order.howToCall,
    order.calldata,
    order.replacementPattern,
    order.metadataHash,
    parseInt(order.v),
    order.r || '0x',
    order.s || '0x')
  if (!valid) throw new Error('Order did not pass validation!')
  await api.postOrder(state.settings.orderbookServer, order)
  callback()
}

const atomicMatch = async ({ state, commit }, { buy, sell, onError, onTxHash, onConfirm }) => {
  console.log('atomicMatch', buy, sell)
  const accounts = await promisify(web3.eth.getAccounts)
  const account = accounts[0]
  console.log('from', account)
  console.log(protocolInstance.wyvernExchange)
  console.log('buy.maker', buy.maker)
  console.log('sell.maker', sell.maker)
  web3.eth.defaultAccount = account

  /* this is a bug, short-circuit not working properly */
  if (!buy.r || !buy.s) {
    buy.v = sell.v
    buy.r = sell.r
    buy.s = sell.s
  } else {
    sell.v = buy.v
    sell.r = buy.r
    sell.s = buy.s
  }

  const buyValid = await protocolInstance.wyvernExchange.validateOrder_.callAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt],
    buy.side,
    buy.saleKind,
    buy.howToCall,
    buy.calldata,
    buy.replacementPattern,
    buy.metadataHash,
    buy.v, buy.r, buy.s,
    { from: account })
  console.log('buyValid', buyValid)
  const sellValid = await protocolInstance.wyvernExchange.validateOrder_.callAsync(
    [sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.paymentToken],
    [sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    sell.side,
    sell.saleKind,
    sell.howToCall,
    sell.calldata,
    sell.replacementPattern,
    sell.metadataHash,
    sell.v, sell.r, sell.s)
  console.log('sellValid', sellValid)
  const ordersCanMatch = await protocolInstance.wyvernExchange.ordersCanMatch_.callAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    [buy.side, buy.saleKind, buy.howToCall, sell.side, sell.saleKind, sell.howToCall],
    buy.calldata,
    sell.calldata,
    buy.replacementPattern,
    sell.replacementPattern,
    buy.metadataHash,
    sell.metadataHash,
    { from: account }
  )
  console.log('ordersCanMatch', ordersCanMatch)
  const orderCalldataCanMatch = await protocolInstance.wyvernExchange.orderCalldataCanMatch.callAsync(buy.calldata, buy.replacementPattern, sell.calldata, sell.replacementPattern)
  console.log('orderCalldataCanMatch', orderCalldataCanMatch)

  const proxyABI = {'target': state.web3.proxy, 'constant': false, 'inputs': [{'name': 'dest', 'type': 'address'}, {'name': 'howToCall', 'type': 'uint8'}, {'name': 'calldata', 'type': 'bytes'}], 'name': 'proxyAssert', 'outputs': [], 'payable': false, 'stateMutability': 'nonpayable', 'type': 'function'}
  const sellProxy = (web3.eth.contract([proxyABI])).at(state.web3.proxy)
  console.log(sellProxy, buy.target, buy.howToCall, buy.calldata)
  const sellProxySim = await promisify(c => sellProxy.proxyAssert.call(buy.target, buy.howToCall, buy.calldata, {from: account}, c))
  console.log('sellProxySim', sellProxySim)

  const atomicMatchSimulation = await protocolInstance.wyvernExchange.atomicMatch_.estimateGasAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    [buy.side, buy.saleKind, buy.howToCall, sell.side, sell.saleKind, sell.howToCall],
    buy.calldata,
    sell.calldata,
    buy.replacementPattern,
    sell.replacementPattern,
    buy.metadataHash,
    sell.metadataHash,
    [buy.v, sell.v],
    [buy.r, buy.s, sell.r, sell.s],
    { from: account }
  )
  console.log('atomicMatchSimulation', atomicMatchSimulation)

  const txHash = await protocolInstance.wyvernExchange.atomicMatch_.sendTransactionAsync(
    [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.paymentToken],
    [buy.makerFee, buy.takerFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerFee, sell.takerFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
    [buy.side, buy.saleKind, buy.howToCall, sell.side, sell.saleKind, sell.howToCall],
    buy.calldata,
    sell.calldata,
    buy.replacementPattern,
    sell.replacementPattern,
    buy.metadataHash,
    sell.metadataHash,
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

export const trackOrder = async (commit, hash) => {
  if (!protocolInstance) {
    return
  }
  const currentPrice = Math.pow(10, 18)
  commit('setOrderData', { hash, key: 'currentPrice', value: currentPrice })
}

export var poll

export const bind = (store) => {
  var blockNumber
  var prevNetwork
  var account
  var schemas
  var tokens
  var proxy

  poll = async () => {
    providerInstance = toProviderInstance(store.state.settings.web3Provider)
    web3 = new Web3(providerInstance)

    const start = Date.now() / 1000
    const newBlockNumber = await promisify(web3.eth.getBlockNumber)
    const inter = Date.now() / 1000
    const latency = inter - start
    store.commit('setWeb3Latency', latency)
    if (newBlockNumber === blockNumber) return
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
      store.commit('setWeb3Schemas', schemas)
      tokens = WyvernSchemas.tokens[network]
      store.commit('setWeb3Tokens', tokens)
    }

    if (proxy === null || network !== prevNetwork) {
      proxy = await protocolInstance.wyvernProxyRegistry.proxies.callAsync(account)
      store.commit('setWeb3Proxy', proxy === WyvernProtocol.NULL_ADDRESS ? null : proxy)
    }

    prevNetwork = network

    const unwrappedBalance = account ? await promisify(c => web3.eth.getBalance(account, c)) : 0
    const wrappedBalance = account ? await promisify(c => web3.eth.call({from: account, to: tokens.canonicalWrappedEther.address, data: encodeCall(method(CanonicalWETH, 'balanceOf'), [account])}, c)) : 0
    const exchangeAvailable = account ? await promisify(c => web3.eth.call({from: account, to: WyvernProtocol.getExchangeContractAddress(network), data: encodeCall(method(WyvernExchange, 'availableFor'), [account, tokens.canonicalWrappedEther.address])}, c)) : 0
    const exchangeLocked = account ? await promisify(c => web3.eth.call({from: account, to: WyvernProtocol.getExchangeContractAddress(network), data: encodeCall(method(WyvernExchange, 'lockedFor'), [account, tokens.canonicalWrappedEther.address])}, c)) : 0
    const exchangeApproved = account ? await promisify(c => web3.eth.call({from: account, to: tokens.canonicalWrappedEther.address, data: encodeCall(method(CanonicalWETH, 'allowance'), [account, WyvernProtocol.getExchangeContractAddress(network)])}, c)) : 0
    const base = { account: account, blockNumber: blockNumber, network: network, unwrappedBalance: new BigNumber(unwrappedBalance), wrappedBalance: new BigNumber(wrappedBalance), exchangeAvailable: new BigNumber(exchangeAvailable), exchangeLocked: new BigNumber(exchangeLocked), exchangeApproved: new BigNumber(exchangeApproved) }
    store.commit('setWeb3Base', base)

    await Promise.all(store.state.trackedOrders.map(hash => {
      return trackOrder(store.commit, hash)
    }))

    {
      const balances = await Promise.all(tokens.otherTokens.map(async t => {
        const balanceOnContract = account ? await promisify(c => web3.eth.call({from: account, to: t.address, data: encodeCall(method(ERC20, 'balanceOf'), [account])}, c)) : 0
        const availableOnExchange = account ? await promisify(c => web3.eth.call({from: account, to: WyvernProtocol.getExchangeContractAddress(network), data: encodeCall(method(WyvernExchange, 'availableFor'), [account, t.address])}, c)) : 0
        const lockedOnExchange = account ? await promisify(c => web3.eth.call({from: account, to: WyvernProtocol.getExchangeContractAddress(network), data: encodeCall(method(WyvernExchange, 'lockedFor'), [account, t.address])}, c)) : 0
        const approvedOnExchange = account ? await promisify(c => web3.eth.call({from: account, to: t.address, data: encodeCall(method(ERC20, 'allowance'), [account, WyvernProtocol.getExchangeContractAddress(network)])}, c)) : 0
        return { address: t.address, balanceOnContract: new BigNumber(balanceOnContract), availableOnExchange: new BigNumber(availableOnExchange), lockedOnExchange: new BigNumber(lockedOnExchange), approvedOnExchange: new BigNumber(approvedOnExchange) }
      }))
      store.commit('setWeb3Balances', balances)
    }

    {
      const assetsBySchema = await Promise.all(schemas.map(async s => {
        if (!account) return []
        const transferEvent = s.events.transfer
        const tokensOfOwnerByIndexFunction = s.functions.tokensOfOwnerByIndex
        if (transferEvent) {
          const contract = web3.eth.contract([transferEvent]).at(transferEvent.target)
          const destination = transferEvent.inputs.filter(i => i.kind === 'destination')[0]
          const source = transferEvent.inputs.filter(i => i.kind === 'source')[0]
          if (!destination || !source) return [] // TODO
          var receiveFilter = {}
          receiveFilter[destination.name] = [account]
          if (proxy !== null) receiveFilter[destination.name].push(proxy)
          const receiveEvents = await promisify(c => contract[transferEvent.name](receiveFilter, {fromBlock: 0}).get(c))
          var sendFilter = {}
          sendFilter[source.name] = [account]
          if (proxy !== null) sendFilter[source.name].push(proxy)
          const sendEvents = await promisify(c => contract[transferEvent.name](sendFilter, {fromBlock: 0}).get(c))
          const assets = receiveEvents.filter(rE => {
            const asset = transferEvent.nftFromInputs(rE.args)
            return sendEvents.filter(sE => JSON.stringify(transferEvent.nftFromInputs(sE.args)) === JSON.stringify(asset) &&
              (sE.args[source.name] === rE.args[destination.name]) &&
              (sE.blockNumber > rE.blockNumber || (sE.blockNumber === rE.blockNumber && sE.transactionIndex > rE.transactionIndex))).length === 0
          }).map(rE => ({
            schema: s,
            asset: transferEvent.nftFromInputs(rE.args),
            proxy: rE.args[destination.name] === proxy
          }))
          return assets
        } else if (tokensOfOwnerByIndexFunction) {
          const contract = web3.eth.contract([tokensOfOwnerByIndexFunction]).at(tokensOfOwnerByIndexFunction.target)
          const owner = tokensOfOwnerByIndexFunction.inputs.filter(i => i.kind === 'owner')[0]
          const index = tokensOfOwnerByIndexFunction.inputs.filter(i => i.kind === 'index')[0]
          if (!owner || !index) return []
          var assets = []
          const fetch = async (indexValue, address, isProxy) => {
            owner.value = address
            index.value = indexValue
            const result = await promisify(c => contract[tokensOfOwnerByIndexFunction.name].call(owner.value, index.value, {from: account}, c))
            const nft = tokensOfOwnerByIndexFunction.nftFromOutputs(result)
            if (nft === null) {
            } else {
              assets.push({schema: s, asset: nft, proxy: isProxy})
              return fetch(indexValue + 1)
            }
          }
          await fetch(0, account, false)
          await fetch(0, proxy, true)
          return assets
        } else {
          return []
        }
      }))
      const assets = [].concat.apply(...assetsBySchema).reverse()
      store.commit('setWeb3Assets', assets)
    }

    {
      const contract = web3.eth.contract(WyvernExchange).at(WyvernProtocol.getExchangeContractAddress(network))
      const events = await promisify(c => contract.allEvents({fromBlock: 0}).get(c))
      console.log('exchange events', events)
    }

    const end = Date.now() / 1000
    const diff = end - start
    logger.debug({extra: {latency: latency, diff: diff}}, 'Reloaded web3 state')
  }
  // poll()
  setInterval(poll, 1000)
}

export { WyvernProtocol } from 'wyvern-js'
