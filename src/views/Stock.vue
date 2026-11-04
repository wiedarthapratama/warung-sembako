<template>
  <section class="page-stack"><div class="page-heading"><div><p class="eyebrow">INVENTAR</p><h1>Stok Barang</h1><p class="page-description">Pantau stok dalam unit terkecil setelah purchase order dikunci.</p></div></div><section class="panel product-panel"><div class="toolbar"><div><h2>Saldo Stok</h2><p>{{ products.length }} produk terdaftar</p></div></div><div v-if="loading" class="table-state">Memuat stok...</div><div v-else-if="!products.length" class="table-state"><strong>Belum ada data stok</strong><span>Stok akan muncul setelah PO dikunci.</span></div><div v-else class="table-wrap"><table class="data-table"><thead><tr><th>Produk</th><th>Satuan Pembelian</th><th>Isi / Satuan</th><th>Stok (PCS)</th><th>Estimasi Satuan</th></tr></thead><tbody><tr v-for="product in products" :key="product.id"><td><div class="product-name"><span class="product-avatar">{{ (product.nama || '?').charAt(0).toUpperCase() }}</span><div><strong>{{ product.nama }}</strong><small>{{ product.kategori || 'Umum' }}</small><span v-if="product.perluDilengkapi" class="product-incomplete-badge">Belum lengkap</span><span v-if="product.koreksiStokManual" class="stock-correction-badge">Stok mungkin perlu koreksi manual</span></div></div></td><td>{{ product.satuan || '-' }}</td><td>{{ product.unit || 'Belum diatur' }}<span v-if="product.unit"> pcs</span></td><td><span :class="['stock-badge', Number(product.stokPcs) <= 5 ? 'stock-low' : 'stock-ok']">{{ product.stokPcs || 0 }} pcs</span></td><td v-if="product.unit">{{ Math.floor((Number(product.stokPcs) || 0) / Number(product.unit)) }} {{ product.satuan || 'satuan' }} <small class="table-subtext">{{ (Number(product.stokPcs) || 0) % Number(product.unit) }} pcs sisa</small></td><td v-else>Isi kemasan belum diketahui</td></tr></tbody></table></div></section></section></template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { authState } from '@/auth'
const products = ref<any[]>([])
const loading = ref(true)
const loadStock = async () => { if (!authState.warungId) return; try { const snapshot = await getDocs(collection(db, 'warungs', authState.warungId, 'produk')); products.value = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) } finally { loading.value = false } }
onMounted(loadStock)
</script>
