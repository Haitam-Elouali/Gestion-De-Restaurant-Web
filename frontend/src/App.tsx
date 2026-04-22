import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Commandes from './pages/Commandes'
import Tables from './pages/Tables'
import Caisse from './pages/Caisse'
import StocksMenus from './pages/StocksMenus'
import Reservations from './pages/Reservations'
import Stats from './pages/Stats'
import Users from './pages/Users'

const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
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
