import axios from 'axios'

import { orderFromJSON } from './aux'

export default {
  orders: async (endpoint) => {
    const response = await axios.get(`${endpoint}/v1/orders`)
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(response.data.result.map(orderFromJSON)), 1000)
    })
  },
  order: async (endpoint, hash) => {
    const response = await axios.get(`${endpoint}/v1/orders/${hash}`)
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(orderFromJSON(response.data.result)), 1000)
    })
  },
  validateOrder: async (endpoint, order) => {
    return axios.post(`${endpoint}/v1/orders/validate`, order)
  },
  postOrder: async (endpoint, order) => {
    return axios.post(`${endpoint}/v1/orders/post`, order)
  }
}
