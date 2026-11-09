<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">INVENTAR</p>
        <h1>Stok Barang</h1>
        <p class="page-description">Pantau stok dalam unit terkecil setelah purchase order dikunci.</p>
      </div>
    </div>
    <section class="panel product-panel">
      <div class="toolbar">
        <div>
          <h2>Saldo Stok</h2>
          <p>{{ filteredProducts.length }} dari {{ products.length }} produk terdaftar</p>
        </div>
      </div>
      <div v-if="loading" class="table-state">Memuat stok...</div>
      <div v-else-if="!products.length" class="table-state"><strong>Belum ada data stok</strong><span>Stok akan muncul
          setelah PO dikunci.</span></div>
      <div v-else class="table-wrap">
        <div class="data-table-controls">
          <label class="data-table-page-size">
            Tampilkan
            <select v-model.number="pageSize" aria-label="Jumlah produk per halaman">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
          <label class="data-table-global-search">
            Cari di semua kolom
            <input v-model="globalSearch" type="search" placeholder="Cari..." aria-label="Cari di semua kolom" />
          </label>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th :aria-sort="sortColumn === 'nama' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('nama')">
                  Produk <span>{{ sortColumn === 'nama' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th :aria-sort="sortColumn === 'satuan' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('satuan')">
                  Satuan Pembelian <span>{{ sortColumn === 'satuan' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th :aria-sort="sortColumn === 'unit' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('unit')">
                  Isi / Satuan <span>{{ sortColumn === 'unit' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th :aria-sort="sortColumn === 'stokPcs' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('stokPcs')">
                  Stok (PCS) <span>{{ sortColumn === 'stokPcs' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th :aria-sort="sortColumn === 'estimasi' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('estimasi')">
                  Estimasi Satuan <span>{{ sortColumn === 'estimasi' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
            </tr>
            <tr class="data-table-column-filters">
              <th><input v-model="filters.nama" aria-label="Filter produk" placeholder="Filter produk" /></th>
              <th><input v-model="filters.satuan" aria-label="Filter satuan pembelian" placeholder="Filter satuan" /></th>
              <th><input v-model="filters.unit" aria-label="Filter isi per satuan" placeholder="Filter isi" /></th>
              <th><input v-model="filters.stokPcs" aria-label="Filter stok PCS" placeholder="Filter stok" inputmode="decimal" /></th>
              <th><input v-model="filters.estimasi" aria-label="Filter estimasi satuan" placeholder="Filter estimasi" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in paginatedProducts" :key="product.id">
              <td>
                <div class="product-name"><span class="product-avatar">{{ (product.nama || '?').charAt(0).toUpperCase()
                }}</span>
                  <div><strong>{{ product.nama }}</strong><small>{{ product.kategori || 'Umum' }}</small><span
                      v-if="product.perluDilengkapi" class="product-incomplete-badge">Belum lengkap</span><span
                      v-if="product.koreksiStokManual" class="stock-correction-badge">Stok mungkin perlu koreksi
                      manual</span></div>
                </div>
              </td>
              <td>{{ product.satuan || '-' }}</td>
              <td>{{ product.unit || 'Belum diatur' }}<span v-if="product.unit"> pcs</span></td>
              <td><span :class="['stock-badge', Number(product.stokPcs) <= 5 ? 'stock-low' : 'stock-ok']">{{
                product.stokPcs || 0 }} pcs</span></td>
              <td v-if="product.unit">{{ Math.floor((Number(product.stokPcs) || 0) / Number(product.unit)) }} {{
                product.satuan || 'satuan' }} <small class="table-subtext">{{ (Number(product.stokPcs) || 0) %
                  Number(product.unit) }} pcs sisa</small></td>
              <td v-else>Isi kemasan belum diketahui</td>
            </tr>
            <tr v-if="!paginatedProducts.length">
              <td colspan="5" class="empty-cell">Tidak ada produk yang cocok dengan filter.</td>
            </tr>
          </tbody>
        </table>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstVisibleProduct }}–{{ lastVisibleProduct }} dari {{ sortedProducts.length }} produk</p>
          <div class="data-table-pagination">
            <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
            <span>Halaman {{ totalPages ? currentPage : 0 }} dari {{ totalPages }}</span>
            <button type="button" :disabled="currentPage >= totalPages" @click="currentPage++">Berikutnya</button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { authState } from '@/auth'
const products = ref<any[]>([])
const loading = ref(true)
const filters = reactive({
  nama: '',
  satuan: '',
  unit: '',
  stokPcs: '',
  estimasi: '',
})
const sortColumn = ref<keyof typeof filters>('nama')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageSize = ref(10)
const currentPage = ref(1)
const globalSearch = ref('')

const getColumnValue = (product: any, column: keyof typeof filters): string | number => {
  const stock = Number(product.stokPcs) || 0
  const unit = Number(product.unit)
  switch (column) {
    case 'nama':
      return product.nama || ''
    case 'satuan':
      return product.satuan || '-'
    case 'unit':
      return Number.isFinite(unit) && product.unit !== '' && product.unit != null ? unit : 'Belum diatur'
    case 'stokPcs':
      return stock
    case 'estimasi':
      return unit > 0 ? Math.floor(stock / unit) : 'Isi kemasan belum diketahui'
  }
  return ''
}

const getColumnFilterText = (product: any, column: keyof typeof filters): string => {
  const stock = Number(product.stokPcs) || 0
  const unit = Number(product.unit)
  switch (column) {
    case 'nama':
      return `${product.nama || ''} ${product.kategori || 'Umum'} ${product.perluDilengkapi ? 'Belum lengkap' : ''} ${product.koreksiStokManual ? 'Stok mungkin perlu koreksi manual' : ''}`
    case 'satuan':
      return String(product.satuan || '-')
    case 'unit':
      return product.unit ? `${product.unit} pcs` : 'Belum diatur'
    case 'stokPcs':
      return `${stock} pcs`
    case 'estimasi':
      return unit > 0
        ? `${Math.floor(stock / unit)} ${product.satuan || 'satuan'} ${stock % unit} pcs sisa`
        : 'Isi kemasan belum diketahui'
  }
  return ''
}

const filteredProducts = computed(() => products.value.filter((product) =>
  (!globalSearch.value.trim() || (Object.keys(filters) as (keyof typeof filters)[]).some((column) =>
    getColumnFilterText(product, column).toLocaleLowerCase('id-ID')
      .includes(globalSearch.value.trim().toLocaleLowerCase('id-ID')),
  ))
  && (Object.keys(filters) as (keyof typeof filters)[]).every((column) => {
    const filter = filters[column].trim().toLocaleLowerCase('id-ID')
    return getColumnFilterText(product, column).toLocaleLowerCase('id-ID').includes(filter)
  }),
))

const sortedProducts = computed(() => [...filteredProducts.value].sort((a, b) => {
  const left = getColumnValue(a, sortColumn.value)
  const right = getColumnValue(b, sortColumn.value)
  const comparison = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'id-ID', { numeric: true, sensitivity: 'base' })
  return sortDirection.value === 'asc' ? comparison : -comparison
}))

const totalPages = computed(() => Math.ceil(sortedProducts.value.length / pageSize.value))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedProducts.value.slice(start, start + pageSize.value)
})
const firstVisibleProduct = computed(() => sortedProducts.value.length
  ? (currentPage.value - 1) * pageSize.value + 1
  : 0)
const lastVisibleProduct = computed(() => Math.min(currentPage.value * pageSize.value, sortedProducts.value.length))

watch(filters, () => { currentPage.value = 1 })
watch(pageSize, () => { currentPage.value = 1 })
watch(globalSearch, () => { currentPage.value = 1 })

const toggleSort = (column: keyof typeof filters) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

const loadStock = async () => { if (!authState.warungId) return; try { const snapshot = await getDocs(collection(db, 'warungs', authState.warungId, 'produk')); products.value = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) } finally { loading.value = false } }
onMounted(loadStock)
</script>
