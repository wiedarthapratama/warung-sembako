<template>
  <div class="app-shell">
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
          <span class="profile-avatar">A</span>
          <span class="profile-name">Administrator</span>
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
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(false)
</script>
