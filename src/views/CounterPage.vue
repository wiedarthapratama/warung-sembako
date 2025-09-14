<template>
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto my-8 text-center">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Halaman Counter</h2>

        <p class="text-gray-600 mb-6">
            Contoh penggunaan <b>Pinia Store</b> untuk menyimpan state global.
        </p>

        <!-- Counter -->
        <div class="mb-4 text-lg">
            <p>Count: <span class="font-bold">{{ counter.count }}</span></p>
            <p>Double Count: <span class="font-bold text-blue-600">{{ counter.doubleCount }}</span></p>
        </div>

        <!-- Button -->
        <button @click="counter.increment"
            class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg">
            Tambah Count
        </button>

        <button @click="counter.decrement"
            class="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg ml-4">
            Kurangi Count
        </button>

        <button @click="counter.reset"
            class="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg ml-4">
            Reset Count
        </button>
    </div>
</template>

<script setup lang="ts">
import { useCounterStore } from '../stores/counter'

// ambil store
const counter = useCounterStore()
</script>
