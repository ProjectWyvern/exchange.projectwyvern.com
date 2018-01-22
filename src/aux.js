import Promise from 'bluebird'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

import { WyvernProtocol } from 'wyvern-js'
import * as WyvernSchemas from 'wyvern-schemas'

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

export const web3Actions = {
  registerProxy: wrapAction(wrapSend('wyvernProxyRegistry', 'registerProxy')),
  rawSend: wrapAction(async ({ state, commit }, { abi, params, onError, onTxHash, onConfirm }) => {
    const accounts = await promisify(web3.eth.getAccounts)
    const account = accounts[0]
    const encoded = WyvernSchemas.encodeCall(abi, params)
    var obj = {to: abi.target, from: account, data: encoded}
    const estGas = await promisify(c => web3.eth.estimateGas(obj, c))
    obj.gas = estGas
    const txHash = await promisify(c => web3.eth.sendTransaction(obj, c))
    commit('commitTx', { txHash: txHash, params: params })
    onTxHash(txHash)
    track(txHash, (success) => {
      commit('mineTx', { txHash, success })
      onConfirm(success)
    })
  })
}

export var poll

export const bind = (store) => {
  var blockNumber
  var prevNetwork
  var account
  var schemas
  var tokens

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
        gasPrice: store.state.settings.gasPrice,
        wyvernExchangeContractAddress: WyvernProtocol.DEPLOYED[network].WyvernExchange,
        wyvernProxyRegistryContractAddress: WyvernProtocol.DEPLOYED[network].WyvernProxyRegistry
      })
      schemas = WyvernSchemas.schemas[network]
      store.commit('setWeb3Schemas', schemas)
      tokens = WyvernSchemas.tokens[network]
      store.commit('setWeb3Tokens', tokens)
    }

    prevNetwork = network

    const balance = account ? await promisify(c => web3.eth.getBalance(account, c)) : 0
    const base = { account: account, blockNumber: blockNumber, network: network, balance: new BigNumber(balance) }
    store.commit('setWeb3Base', base)

    const proxy = await protocolInstance.wyvernProxyRegistry.proxies.callAsync(account)
    store.commit('setWeb3Proxy', proxy === WyvernProtocol.NULL_ADDRESS ? null : proxy)

    {
      const assetsBySchema = await Promise.all(schemas.map(async s => {
        const transferEvent = s.events.transfer
        const contract = web3.eth.contract([transferEvent]).at(transferEvent.target)
        const destination = transferEvent.inputs.filter(i => i.kind === 'destination')[0]
        const source = transferEvent.inputs.filter(i => i.kind === 'source')[0]
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
          return sendEvents.filter(sE => transferEvent.nftFromInputs(sE.args).toString() === asset.toString() &&
            (sE.args[source.name] === rE.args[destination.name]) &&
            (sE.blockNumber > rE.blockNumber || (sE.blockNumber === rE.blockNumber && sE.transactionIndex > rE.transactionIndex))).length === 0
        }).map(rE => ({
          schema: s,
          asset: transferEvent.nftFromInputs(rE.args),
          proxy: rE.args[destination.name] === proxy
        }))
        return assets
      }))
      const assets = [].concat.apply(...assetsBySchema)
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
