import { createRouter, createWebHistory } from 'vue-router'

// Views
import Welcome from '@/views/Welcome.vue'
import ProdukView from '@/views/ProdukView.vue'
import ProdukIndex from '@/views/produk/index.vue'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: Welcome,
  },
  {
    path: '/warung-sembako',
    name: 'Welcome',
    component: Welcome,
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
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
