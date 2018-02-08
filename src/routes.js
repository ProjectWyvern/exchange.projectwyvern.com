import Home from './pages/Home'
import FindOrder from './pages/FindOrder'
import PostOrder from './pages/PostOrder'
import Order from './pages/Order'
import Directory from './pages/Directory'
import Schemas from './pages/Schemas'
import Schema from './pages/Schema'
import Asset from './pages/Asset'
import Assets from './pages/Assets'
import Balances from './pages/Balances'
import History from './pages/History'
import Escrow from './pages/Escrow'
import Stats from './pages/Stats'
import About from './pages/About'
import Help from './pages/Help'

export default [
  { path: '/', component: Home },
  { path: '/orders/find', component: FindOrder },
  { path: '/orders/post', component: PostOrder },
  { path: '/orders/:hash', component: Order },
  { path: '/directory', component: Directory },
  { path: '/directory/:spec', component: Asset },
  { path: '/schemas', component: Schemas },
  { path: '/schemas/:schema', component: Schema },
  { path: '/account/assets', component: Assets },
  { path: '/account/balances', component: Balances },
  { path: '/account/history', component: History },
  { path: '/account/escrow', component: Escrow },
  { path: '/stats', component: Stats },
  { path: '/about', component: About },
  { path: '/help', component: Help }
]
