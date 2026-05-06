import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Commandes from './pages/Commandes'
import Tables from './pages/Tables'
import Caisse from './pages/Caisse'
import StocksMenus from './pages/StocksMenus'
import Reservations from './pages/Reservations'
import Stats from './pages/Stats'
import Users from './pages/Users'
import Serveur from './pages/Serveur'

const App: React.FC = () => {
  const location = useLocation()
  const hideNavbarPaths = ['/login', '/caisse', '/admin']
  const hideNavbar = hideNavbarPaths.includes(location.pathname)

  return (
    <div className="w-full min-h-screen">
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/serveur" element={<Serveur />} />
        <Route path="/commandes" element={<Commandes />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/caisse" element={<Caisse />} />
        <Route path="/stocks-menus" element={<StocksMenus />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/statistiques" element={<Stats />} />
        <Route path="/utilisateurs" element={<Users />} />
      </Routes>
    </div>
  )
}

export default App
