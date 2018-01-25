import axios from 'axios'

import { orderFromJSON } from './aux'

export default {
  orders: async (endpoint) => {
    const response = await axios.get(`${endpoint}/v1/orders`)
    return response.data.result.map(orderFromJSON)
  },
  order: async (endpoint, hash) => {
    const response = await axios.get(`${endpoint}/v1/orders/${hash}`)
    return orderFromJSON(response.data.result)
  },
  validateOrder: async (endpoint, order) => {
    return axios.post(`${endpoint}/v1/orders/validate`, order)
  },
  postOrder: async (endpoint, order) => {
    return axios.post(`${endpoint}/v1/orders/post`, order)
  }
}
