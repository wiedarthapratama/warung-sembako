<template>
  <RouterView v-if="route.meta.public" />
  <div v-else class="app-shell">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="brand">
        <div class="brand-mark">WS</div>
        <div>
          <strong>Warung Sembako</strong>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navigasi utama">
        <p class="nav-label">MENU UTAMA</p>
        <RouterLink to="/" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">⌂</span>
          <span>Home</span>
        </RouterLink>
        <RouterLink to="/scan" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">⌕</span>
          <span>Scan</span>
        </RouterLink>
        <RouterLink to="/produk" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">▦</span>
          <span>Produk</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <span class="status-dot"></span>
        Sistem aktif
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button class="menu-button" type="button" aria-label="Buka menu" @click="sidebarOpen = !sidebarOpen">☰</button>
        <div class="breadcrumb">
          <span>Warung Sembako</span>
          <b>/</b>
          <strong>{{ route.meta.title || 'Home' }}</strong>
        </div>
        <div class="profile-chip">
          <span class="profile-avatar">{{ (authState.user?.email || 'A').charAt(0).toUpperCase() }}</span>
          <span class="profile-name">{{ authState.user?.email || 'Administrator' }}</span>
          <button class="logout-button" type="button" @click="logout">Keluar</button>
        </div>
      </header>

      <main class="content-area">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase'
import { authState } from '@/auth'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const logout = async () => { await signOut(auth); await router.push('/login') }
</script>
