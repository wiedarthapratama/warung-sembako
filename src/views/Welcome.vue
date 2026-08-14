<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">OVERVIEW</p>
        <h1>Selamat datang kembali</h1>
        <p class="page-description">Pantau katalog dan kelola produk warung dari satu tempat.</p>
      </div>
      <RouterLink to="/produk" class="button button-primary">Kelola Produk <span>→</span></RouterLink>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon stat-icon-blue">▦</div>
        <div><span>Total Produk</span><strong>{{ totalProduk }}</strong></div>
        <small>Item di katalog</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon-green">Rp</div>
        <div><span>Nilai Katalog</span><strong>{{ formatRupiah(totalNilai) }}</strong></div>
        <small>Estimasi harga jual</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon-orange">!</div>
        <div><span>Stok Terbatas</span><strong>{{ stokTerbatas }}</strong></div>
        <small>Produk dengan unit ≤ 5</small>
      </article>
    </div>

    <div class="dashboard-grid home-dashboard-grid">

    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'

const totalProduk = ref(0)
const totalNilai = ref(0)
const stokTerbatas = ref(0)
const loadSummary = async () => {
  if (!authState.warungId) return
  const snapshot = await getDocs(collection(db, 'warungs', authState.warungId, 'produk'))
  const products = snapshot.docs.map((item) => item.data())
  totalProduk.value = products.length
  totalNilai.value = products.reduce((sum, item) => sum + Number(item.hargaJualReal || item.hargaJualPerUnit || 0), 0)
  stokTerbatas.value = products.filter((item) => Number(item.unit || 0) <= 5).length
}

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

onMounted(loadSummary)
</script>
