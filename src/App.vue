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
          <span>Scan Produk</span>
        </RouterLink>
        <RouterLink to="/produk" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">▦</span>
          <span>Produk</span>
        </RouterLink>
        <RouterLink to="/pembelian" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">↙</span>
          <span>Pembelian</span>
        </RouterLink>
        <RouterLink to="/stok" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">▤</span>
          <span>Stok</span>
        </RouterLink>
        <RouterLink to="/pos" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">▣</span>
          <span>POS</span>
        </RouterLink>
      </nav>

      <div class="sidebar-bottom">
        <p class="nav-label">PENGELOLAAN</p>
        <RouterLink to="/utang" class="nav-link" active-class="nav-link-active" @click="sidebarOpen = false">
          <span class="nav-icon">Rp</span>
          <span>Utang</span>
        </RouterLink>
        <button class="nav-link nav-link-button" type="button" @click="openWarungProfile">
          <span class="nav-icon">⚙</span>
          <span>Profil Warung</span>
        </button>
        <div class="sidebar-footer">
          <span class="status-dot"></span>
          Sistem aktif
        </div>
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
        <div class="profile-menu-wrap">
          <button class="profile-chip" type="button" :aria-expanded="profileMenuOpen" @click="profileMenuOpen = !profileMenuOpen">
            <span class="profile-avatar">{{ (authState.user?.email || 'A').charAt(0).toUpperCase() }}</span>
            <span class="profile-copy">
              <strong>{{ authState.user?.email || 'Administrator' }}</strong>
              <small>Administrator</small>
            </span>
            <span class="profile-chevron" aria-hidden="true">⌄</span>
          </button>
          <div v-if="profileMenuOpen" class="profile-dropdown">
            <div class="profile-dropdown-head">
              <span class="profile-avatar profile-avatar-large">{{ (authState.user?.email || 'A').charAt(0).toUpperCase() }}</span>
              <div><strong>{{ authState.user?.email || 'Administrator' }}</strong><small>Akun aktif</small></div>
            </div>
            <button class="dropdown-action" type="button" @click="openWarungProfile(); profileMenuOpen = false">Profil Warung</button>
            <button class="dropdown-action dropdown-logout" type="button" @click="logout">Keluar dari akun</button>
          </div>
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
const profileMenuOpen = ref(false)

const openWarungProfile = async () => {
  sidebarOpen.value = false
  profileMenuOpen.value = false
  if (route.path !== '/profil-warung') await router.push('/profil-warung')
}

const logout = async () => { await signOut(auth); await router.push('/login') }
</script>
