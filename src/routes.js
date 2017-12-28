import Home from './pages/Home'
import NewItem from './pages/NewItem'
import FindItem from './pages/FindItem'
import Item from './pages/Item'
import Escrow from './pages/Escrow'
import Stats from './pages/Stats'
import Help from './pages/Help'

export default [
  { path: '/', component: Home },
  { path: '/items/new', component: NewItem },
  { path: '/items/find', component: FindItem },
  { path: '/items/:id', component: Item },
  { path: '/escrow', component: Escrow },
  { path: '/stats', component: Stats },
  { path: '/help', component: Help }
]
