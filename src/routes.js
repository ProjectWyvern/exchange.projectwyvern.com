import Home from './pages/Home'
import FindItem from './pages/FindItem'
import BrowseItems from './pages/BrowseItems'
import PostItem from './pages/PostItem'
import Item from './pages/Item'
import Assets from './pages/Assets'
import Profile from './pages/Profile'
import History from './pages/History'
import Escrow from './pages/Escrow'
import Stats from './pages/Stats'
import About from './pages/About'
import Help from './pages/Help'

export default [
  { path: '/', component: Home },
  { path: '/items/find', component: FindItem },
  { path: '/items/browse', component: BrowseItems },
  { path: '/items/post', component: PostItem },
  { path: '/items/:id', component: Item },
  { path: '/account/assets', component: Assets },
  { path: '/account/profile', component: Profile },
  { path: '/account/history', component: History },
  { path: '/account/escrow', component: Escrow },
  { path: '/stats', component: Stats },
  { path: '/about', component: About },
  { path: '/help', component: Help }
]
