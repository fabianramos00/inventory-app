import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ModalProvider } from '@/context/ModalContext'
import PrivateRoute from '@/components/PrivateRoute'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Inventory from '@/pages/Inventory/Inventory'
import CreateProduct from '@/pages/CreateProduct/CreateProduct'
import Providers from '@/pages/Providers/Providers'
import Sells from './pages/Sells/Sells'
import Orders from './pages/Orders/Orders'
import Users from './pages/Users/Users'

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/create" element={<CreateProduct />} />
                <Route path="/providers" element={<Providers />} />
                <Route path="/sells" element={<Sells />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  )
}
