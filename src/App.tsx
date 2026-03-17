import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ModalProvider } from '@/context/ModalContext'
import PrivateRoute from '@/components/PrivateRoute'
import SuperuserRoute from '@/components/SuperuserRoute'
import AppLayout from '@/components/layout/AppLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import Login from '@/pages/Login/Login'

const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Inventory = lazy(() => import('@/pages/Inventory/Inventory'))
const ProductForm = lazy(() => import('@/pages/ProductForm/ProductForm'))
const Providers = lazy(() => import('@/pages/Providers/Providers'))
const Clients = lazy(() => import('@/pages/Clients/Clients'))
const Sales = lazy(() => import('@/pages/Sales/Sales'))
const SaleForm = lazy(() => import('@/pages/SaleForm/SaleForm'))
const Orders = lazy(() => import('@/pages/Orders/Orders'))
const OrderForm = lazy(() => import('@/pages/OrderForm/OrderForm'))
const Users = lazy(() => import('@/pages/Users/Users'))

// Login is kept eager — it's the auth entry point and has no heavy deps

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={null}>
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
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  )
}
