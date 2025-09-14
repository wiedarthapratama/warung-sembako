<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Navbar -->
    <nav class="bg-blue-600 text-white p-4 shadow">
      <div class="container mx-auto flex justify-between">
        <h1 class="font-bold">Warung Sembako</h1>
        <ul class="flex gap-4">
          <li>
            <RouterLink to="/" class="hover:underline" active-class="font-bold underline">
              Home
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/produk-view" class="hover:underline" active-class="font-bold underline">
              Produk View
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/produk" class="hover:underline" active-class="font-bold underline">
              Produk
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>


    <!-- Content -->
    <main class="container mx-auto p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView, RouterLink } from "vue-router";
</script>
