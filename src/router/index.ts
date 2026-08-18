import { createRouter, createWebHistory } from 'vue-router'

// Views
import Welcome from '@/views/Welcome.vue'
import ScanView from '@/views/ScanView.vue'
import ProdukView from '@/views/ProdukView.vue'
import ProdukIndex from '@/views/produk/index.vue'
import Login from '@/views/Login.vue'
import WarungProfile from '@/views/WarungProfile.vue'
import PurchaseOrders from '@/views/PurchaseOrders.vue'
import PurchaseOrderForm from '@/views/PurchaseOrderForm.vue'
import Stock from '@/views/Stock.vue'
import { auth } from '@/firebase'
import { authReady } from '@/auth'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { public: true, title: 'Login' } },
  {
    path: '/',
    name: 'Welcome',
    component: Welcome,
    meta: { title: 'Home' },
  },
  {
    path: '/profil-warung',
    name: 'Profil Warung',
    component: WarungProfile,
    meta: { title: 'Profil Warung' },
  },
  {
    path: '/scan',
    name: 'Scan',
    component: ScanView,
    meta: { title: 'Scan' },
  },
  { path: '/pembelian', name: 'Pembelian', component: PurchaseOrders, meta: { title: 'Pembelian' } },
  { path: '/pembelian/baru', name: 'Buat Pembelian', component: PurchaseOrderForm, meta: { title: 'Buat Pembelian' } },
  { path: '/pembelian/:id/edit', name: 'Edit Pembelian', component: PurchaseOrderForm, meta: { title: 'Edit Pembelian' } },
  { path: '/stok', name: 'Stok', component: Stock, meta: { title: 'Stok' } },
  {
    path: '/produk-view',
    name: 'Produk View',
    component: ProdukView,
  },
  {
    path: '/produk',
    name: 'Produk',
    component: ProdukIndex,
    meta: { title: 'Produk' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  await authReady
  const user = auth.currentUser
  if (!to.meta.public && !user) return { name: 'Login' }
  if (to.name === 'Login' && user) return { name: 'Welcome' }
})

export default router
