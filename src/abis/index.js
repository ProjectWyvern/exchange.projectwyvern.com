export const method = (abi, name) => {
  return abi.filter(x => x.type === 'function' && x.name === name)[0]
}

export const event = (abi, name) => {
  return abi.filter(x => x.type === 'event' && x.name === name)[0]
}

export const ERC20 = require('./ERC20.json')
export const CanonicalWETH = require('./CanonicalWETH.json')
export const WyvernExchange = require('./WyvernExchange.json')
