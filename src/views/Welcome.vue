<template>
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="bg-white shadow-lg rounded-2xl p-10 text-center">
            <h1 class="text-3xl font-bold mb-4">Selamat Datang 👋</h1>
            <p class="text-gray-600 mb-6">
                Ini adalah aplikasi manajemen produk sederhana dengan Firebase Firestore.
            </p>
            <router-link to="/produk"
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition cursor-pointer">
                ➡️ Kelola Produk
            </router-link>
        </div>
    </div>
</template>
