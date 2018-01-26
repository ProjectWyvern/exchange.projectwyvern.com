import Home from './pages/Home'
import FindOrder from './pages/FindOrder'
import PostOrder from './pages/PostOrder'
import Order from './pages/Order'
import Directory from './pages/Directory'
import Schemas from './pages/Schemas'
import Asset from './pages/Asset'
import Assets from './pages/Assets'
import Tokens from './pages/Tokens'
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
  { path: '/assets/directory', component: Directory },
  { path: '/assets/schemas', component: Schemas },
  { path: '/assets/:spec', component: Asset },
  { path: '/account/assets', component: Assets },
  { path: '/account/tokens', component: Tokens },
  { path: '/account/history', component: History },
  { path: '/account/escrow', component: Escrow },
  { path: '/stats', component: Stats },
  { path: '/about', component: About },
  { path: '/help', component: Help }
]
