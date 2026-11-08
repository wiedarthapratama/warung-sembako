<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">MASTER DATA</p><h1>Produk</h1><p class="page-description">Kelola identitas, satuan, dan harga dasar produk warung.</p></div>
      <button class="button button-primary" type="button" @click="openForm()">＋ Tambah Produk</button>
    </div>

    <section class="panel product-panel">
      <div class="toolbar">
        <div><h2>Daftar Produk</h2><p>{{ filteredProducts.length }} dari {{ produkList.length }} produk ditemukan</p></div>
      </div>
      <div v-if="loading" class="table-state">Memuat data produk...</div>
      <div v-else-if="!produkList.length" class="table-state"><strong>Belum ada produk</strong><span>Tambahkan produk pertama untuk memulai katalog.</span><button class="button button-primary" @click="openForm()">Tambah Produk</button></div>
      <div v-else>
        <div class="data-table-controls">
          <label class="data-table-page-size">
            <span>Baris per halaman</span>
            <select v-model.number="pageSize">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
          <label class="data-table-global-search">
            <span>Cari di semua kolom</span>
            <input v-model="searchQuery" type="search" placeholder="Cari produk..." />
          </label>
        </div>
        <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th :aria-sort="sortAria('nama')"><button class="data-table-sort" type="button" @click="toggleSort('nama')">Produk <span>{{ sortIndicator('nama') }}</span></button></th>
              <th :aria-sort="sortAria('barcode')"><button class="data-table-sort" type="button" @click="toggleSort('barcode')">Barcode <span>{{ sortIndicator('barcode') }}</span></button></th>
              <th :aria-sort="sortAria('kategori')"><button class="data-table-sort" type="button" @click="toggleSort('kategori')">Kategori <span>{{ sortIndicator('kategori') }}</span></button></th>
              <th :aria-sort="sortAria('unit')"><button class="data-table-sort" type="button" @click="toggleSort('unit')">Isi / Satuan <span>{{ sortIndicator('unit') }}</span></button></th>
              <th :aria-sort="sortAria('hargaBeli')"><button class="data-table-sort" type="button" @click="toggleSort('hargaBeli')">Harga Beli / Satuan <span>{{ sortIndicator('hargaBeli') }}</span></button></th>
              <th :aria-sort="sortAria('hargaJual')"><button class="data-table-sort" type="button" @click="toggleSort('hargaJual')">Harga Jual / Unit <span>{{ sortIndicator('hargaJual') }}</span></button></th>
              <th class="action-heading">Aksi</th>
            </tr>
            <tr class="data-table-column-filters">
              <th><input v-model="columnFilters.nama" aria-label="Cari produk" placeholder="Cari produk" /></th>
              <th><input v-model="columnFilters.barcode" aria-label="Cari barcode" placeholder="Cari barcode" /></th>
              <th><input v-model="columnFilters.kategori" aria-label="Cari kategori" placeholder="Cari kategori" /></th>
              <th><input v-model="columnFilters.unit" aria-label="Cari isi atau satuan" placeholder="Cari satuan" /></th>
              <th><input v-model="columnFilters.hargaBeli" aria-label="Cari harga beli" placeholder="Cari harga" /></th>
              <th><input v-model="columnFilters.hargaJual" aria-label="Cari harga jual" placeholder="Cari harga" /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="produk in paginatedProducts" :key="produk.id">
              <td><div class="product-name"><span class="product-avatar">{{ (produk.nama || '?').charAt(0).toUpperCase() }}</span><div><strong>{{ produk.nama || '-' }}</strong><small>{{ produk.kategori || 'Umum' }}</small><span v-if="produk.perluDilengkapi" class="product-incomplete-badge">Belum lengkap</span><span v-if="produk.koreksiStokManual" class="stock-correction-badge">Perlu koreksi stok manual</span></div></div></td>
              <td>
                <div class="barcode-cell">
                  <div class="barcode-label">{{ produk.barcode || 'Tanpa barcode' }}</div>
                  <button class="button button-secondary" type="button" @click="generateBarcode(produk)">Unduh Barcode</button>
                </div>
              </td>
              <td><span class="category-badge">{{ produk.kategori || 'Umum' }}</span></td>
              <td><span v-if="produk.unit" class="stock-badge stock-ok">{{ produk.unit }} pcs / {{ produk.satuan || 'satuan' }}</span><span v-else class="product-incomplete-badge">Isi belum diatur</span></td>
              <td>{{ formatRupiah(produk.hargaBeli) }}<small class="table-subtext">per {{ produk.satuan || 'satuan' }}</small></td><td class="price-cell">{{ formatRupiah(produk.hargaJualReal || produk.hargaJualPerUnit) }}<small class="table-subtext">per unit</small></td>
              <td><div class="row-actions"><button class="action-button edit-action" type="button" @click="openForm(produk)">Edit</button><button class="action-button delete-action" type="button" @click="deleteProduk(produk.id)">Hapus</button></div></td>
            </tr>
            <tr v-if="!paginatedProducts.length"><td colspan="7" class="empty-cell">Tidak ada produk yang cocok dengan pencarian.</td></tr>
          </tbody>
        </table>
        <canvas ref="barcodeCanvas" style="display:none"></canvas>
      </div>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstRow }} sampai {{ lastRow }} dari {{ filteredProducts.length }} produk</p>
          <div class="data-table-pagination" aria-label="Navigasi halaman produk">
            <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
            <span>Halaman {{ currentPage }} dari {{ pageCount }}</span>
            <button type="button" :disabled="currentPage >= pageCount" @click="currentPage++">Berikutnya</button>
          </div>
        </div>
      </div>
    </section>

    <FormProduk v-if="showForm" :edit-data="editData" @close="closeForm" @saved="handleSaved" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore'
import Swal from 'sweetalert2'
import JsBarcode from 'jsbarcode'
import { db } from '@/firebase'
import { authState } from '@/auth'
import FormProduk from './form.vue'

type ProductRow = {
  id: string
  nama?: string
  barcode?: string
  kategori?: string
  unit?: number | string
  satuan?: string
  hargaBeli?: number | string
  hargaJualReal?: number | string
  hargaJualPerUnit?: number | string
  perluDilengkapi?: boolean
  koreksiStokManual?: boolean
}

const produkList = ref<ProductRow[]>([])
const barcodeCanvas = ref<HTMLCanvasElement | null>(null)
const showForm = ref(false)
const editData = ref<ProductRow | null>(null)
const searchQuery = ref('')
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)
type ProductSortColumn = 'nama' | 'barcode' | 'kategori' | 'unit' | 'hargaBeli' | 'hargaJual'
const sortColumn = ref<ProductSortColumn>('nama')
const sortDirection = ref<'asc' | 'desc'>('asc')
const columnFilters = reactive({
  nama: '',
  barcode: '',
  kategori: '',
  unit: '',
  hargaBeli: '',
  hargaJual: '',
})
const formatRupiah = (value: number | string | null | undefined) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)) : '-'
const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('id')
const salePrice = (product: ProductRow) => Number(product.hargaJualReal || product.hargaJualPerUnit || 0)

const filteredProducts = computed(() => {
  const globalQuery = normalize(searchQuery.value)
  return produkList.value.filter((product) => {
    const priceToSell = salePrice(product)
    const fields = {
      nama: `${product.nama || ''} ${product.perluDilengkapi ? 'Belum lengkap' : ''} ${product.koreksiStokManual ? 'Perlu koreksi stok manual' : ''}`,
      barcode: product.barcode || 'Tanpa barcode',
      kategori: product.kategori || 'Umum',
      unit: product.unit ? `${product.unit} pcs ${product.satuan || 'satuan'}` : 'Isi belum diatur',
      hargaBeli: `${formatRupiah(product.hargaBeli)} ${product.hargaBeli ?? ''}`,
      hargaJual: `${formatRupiah(priceToSell)} ${priceToSell}`,
    }
    const matchesGlobal = !globalQuery || normalize(Object.values(fields).join(' ')).includes(globalQuery)
    const matchesColumns = Object.entries(columnFilters).every(([column, filter]) => {
      const fieldValue = fields[column as keyof typeof fields]
      return !normalize(filter) || normalize(fieldValue).includes(normalize(filter))
    })
    return matchesGlobal && matchesColumns
  })
})
const sortValue = (product: ProductRow, column: ProductSortColumn) => {
  if (column === 'unit') return Number(product.unit) || 0
  if (column === 'hargaBeli') return Number(product.hargaBeli) || 0
  if (column === 'hargaJual') return salePrice(product)
  if (column === 'barcode') return String(product.barcode || '')
  if (column === 'kategori') return String(product.kategori || 'Umum')
  return String(product.nama || '')
}
const sortedProducts = computed(() => [...filteredProducts.value].sort((first, second) => {
  const firstValue = sortValue(first, sortColumn.value)
  const secondValue = sortValue(second, sortColumn.value)
  const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
    ? firstValue - secondValue
    : String(firstValue).localeCompare(String(secondValue), 'id', { numeric: true, sensitivity: 'base' })
  return sortDirection.value === 'asc' ? comparison : -comparison
}))
const pageCount = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize.value)))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedProducts.value.slice(start, start + pageSize.value)
})
const firstRow = computed(() => filteredProducts.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const lastRow = computed(() => Math.min(currentPage.value * pageSize.value, filteredProducts.value.length))
const sortIndicator = (column: ProductSortColumn) => sortColumn.value === column ? (sortDirection.value === 'asc' ? '↑' : '↓') : '↕'
const sortAria = (column: ProductSortColumn) => sortColumn.value !== column ? 'none' : sortDirection.value === 'asc' ? 'ascending' : 'descending'
const toggleSort = (column: ProductSortColumn) => {
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else { sortColumn.value = column; sortDirection.value = 'asc' }
}
watch([searchQuery, pageSize, columnFilters], () => { currentPage.value = 1 }, { deep: true })

const loadProduk = async () => {
  loading.value = true
  try {
    if (!authState.warungId) return
    const snapshot = await getDocs(collection(db, 'warungs', authState.warungId, 'produk'))
    produkList.value = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    currentPage.value = 1
  } finally { loading.value = false }
}

const deleteProduk = async (id: string) => {
  const result = await Swal.fire({ title: 'Hapus produk ini?', text: 'Data yang dihapus tidak dapat dikembalikan.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', reverseButtons: true })
  if (!result.isConfirmed) return
  if (!authState.warungId) return
  const batch = writeBatch(db)
  batch.delete(doc(db, 'warungs', authState.warungId, 'produk', id))
  batch.delete(doc(db, 'warungs', authState.warungId, 'purchaseOrderQueue', id))
  await batch.commit()
  await loadProduk()
  await Swal.fire({ title: 'Produk dihapus', text: 'Produk berhasil dihapus dari katalog.', icon: 'success', confirmButtonColor: '#2563eb' })
}

const openForm = (product: ProductRow | null = null) => { editData.value = product; showForm.value = true }
const closeForm = () => { showForm.value = false; editData.value = null }
const handleSaved = async () => { await loadProduk(); await Swal.fire({ title: 'Tersimpan', text: 'Data produk berhasil disimpan.', icon: 'success', timer: 1600, showConfirmButton: false }) }

const generateBarcode = (produk: ProductRow) => {
  if (!produk.barcode) {
    Swal.fire({ title: 'Barcode belum tersedia', text: 'Produk ini belum memiliki barcode.', icon: 'warning', confirmButtonColor: '#2563eb' })
    return
  }
  if (!barcodeCanvas.value) return

  try {
    JsBarcode(barcodeCanvas.value, produk.barcode, {
      format: 'CODE128',
      displayValue: true,
      fontSize: 14,
      height: 70,
      margin: 10,
    })
    const dataUrl = barcodeCanvas.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${produk.nama || 'barcode'}-${produk.barcode}.png`
    link.click()
  } catch (error) {
    Swal.fire({ title: 'Gagal membuat barcode', text: 'Coba lagi nanti.', icon: 'error', confirmButtonColor: '#2563eb' })
  }
}

onMounted(loadProduk)
</script>
