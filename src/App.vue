<template>
  <div>
    <!-- Navbar -->
    <nav class="bg-gray-800 text-white px-6 py-3 flex gap-4">
      <router-link to="/" class="hover:underline" active-class="text-yellow-400 font-bold">
        Home
      </router-link>

      <router-link to="/about" class="hover:underline" active-class="text-yellow-400 font-bold">
        About
      </router-link>

      <router-link to="/counter" class="hover:underline" active-class="text-yellow-400 font-bold">
        Counter
      </router-link>
    </nav>

    <!-- Halaman aktif -->
    <router-view></router-view>
  </div>
</template>
