import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/ExampleTable.vue'
import About from '@/views/About.vue'
import CounterPage from '@/views/CounterPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: About,
    },
    {
      path: '/counter',
      name: 'counter',
      component: CounterPage,
    },
  ],
})

export default router
