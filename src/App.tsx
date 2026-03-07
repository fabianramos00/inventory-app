import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ModalProvider } from '@/context/ModalContext'
import PrivateRoute from '@/components/PrivateRoute'
import SuperuserRoute from '@/components/SuperuserRoute'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/Login/Login'
import Dashboard from '@/pages/Dashboard/Dashboard'
import Inventory from '@/pages/Inventory/Inventory'
import ProductForm from '@/pages/ProductForm/ProductForm'
import Providers from '@/pages/Providers/Providers'
import Clients from '@/pages/Clients/Clients'
import Sales from './pages/Sales/Sales'
import SaleForm from './pages/SaleForm/SaleForm'
import Orders from './pages/Orders/Orders'
import OrderForm from './pages/OrderForm/OrderForm'
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
                <Route path="/inventory/create" element={<ProductForm />} />
                <Route path="/inventory/product/:id" element={<ProductForm />} />
                <Route path="/providers" element={<Providers />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/sales/create" element={<SaleForm />} />
                <Route path="/sales/:id" element={<SaleForm />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/create" element={<OrderForm />} />
                <Route path="/orders/:id" element={<OrderForm />} />
              </Route>
              <Route element={<SuperuserRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/users" element={<Users />} />
                </Route>
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
