import { createRouter, createWebHistory } from 'vue-router'

// Views
import Welcome from '@/views/Welcome.vue'
import ScanView from '@/views/ScanView.vue'
import ProdukView from '@/views/ProdukView.vue'
import ProdukIndex from '@/views/produk/index.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome,
    meta: { title: 'Home' },
  },
  {
    path: '/scan',
    name: 'Scan',
    component: ScanView,
    meta: { title: 'Scan' },
  },
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

export default router
