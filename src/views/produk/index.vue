<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">MASTER DATA</p><h1>Produk</h1><p class="page-description">Kelola katalog produk, harga, dan stok warung.</p></div>
      <button class="button button-primary" type="button" @click="openForm()">＋ Tambah Produk</button>
    </div>

    <section class="panel product-panel">
      <div class="toolbar">
        <div><h2>Daftar Produk</h2><p>{{ filteredProducts.length }} produk ditemukan</p></div>
        <label class="search-box"><span>⌕</span><input v-model="searchQuery" type="search" placeholder="Cari nama atau kategori..." /></label>
      </div>
      <div v-if="loading" class="table-state">Memuat data produk...</div>
      <div v-else-if="!filteredProducts.length" class="table-state"><strong>Belum ada produk</strong><span>Tambahkan produk pertama untuk memulai katalog.</span><button class="button button-primary" @click="openForm()">Tambah Produk</button></div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Produk</th><th>Kategori</th><th>Stok</th><th>Harga Beli</th><th>Harga Jual</th><th class="action-heading">Aksi</th></tr></thead>
          <tbody>
            <tr v-for="produk in filteredProducts" :key="produk.id">
              <td><div class="product-name"><span class="product-avatar">{{ (produk.nama || '?').charAt(0).toUpperCase() }}</span><div><strong>{{ produk.nama || '-' }}</strong><small>{{ produk.barcode || 'Tanpa barcode' }}</small></div></div></td>
              <td><span class="category-badge">{{ produk.kategori || 'Umum' }}</span></td>
              <td><span :class="['stock-badge', Number(produk.unit) <= 5 ? 'stock-low' : 'stock-ok']">{{ produk.unit || 0 }} {{ produk.satuan || 'unit' }}</span></td>
              <td>{{ formatRupiah(produk.hargaBeli) }}</td><td class="price-cell">{{ formatRupiah(produk.hargaJualReal || produk.hargaJualPerUnit) }}</td>
              <td><div class="row-actions"><button class="action-button edit-action" type="button" @click="openForm(produk)">Edit</button><button class="action-button delete-action" type="button" @click="deleteProduk(produk.id)">Hapus</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <FormProduk v-if="showForm" :edit-data="editData" @close="closeForm" @saved="handleSaved" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import FormProduk from './form.vue'

const produkList = ref<any[]>([])
const showForm = ref(false)
const editData = ref<any | null>(null)
const searchQuery = ref('')
const loading = ref(true)

const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return produkList.value
  return produkList.value.filter((product) => `${product.nama || ''} ${product.kategori || ''} ${product.barcode || ''}`.toLowerCase().includes(query))
})

const loadProduk = async () => {
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, 'produk'))
    produkList.value = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  } finally { loading.value = false }
}

const deleteProduk = async (id: string) => {
  const result = await Swal.fire({ title: 'Hapus produk ini?', text: 'Data yang dihapus tidak dapat dikembalikan.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', reverseButtons: true })
  if (!result.isConfirmed) return
  await deleteDoc(doc(db, 'produk', id))
  await loadProduk()
  await Swal.fire({ title: 'Produk dihapus', text: 'Produk berhasil dihapus dari katalog.', icon: 'success', confirmButtonColor: '#2563eb' })
}

const openForm = (product: any | null = null) => { editData.value = product; showForm.value = true }
const closeForm = () => { showForm.value = false; editData.value = null }
const handleSaved = async () => { await loadProduk(); await Swal.fire({ title: 'Tersimpan', text: 'Data produk berhasil disimpan.', icon: 'success', timer: 1600, showConfirmButton: false }) }
const formatRupiah = (value: number | string) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)) : '-'
onMounted(loadProduk)
</script>
