<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">INVENTAR</p><h1>Stock Opname</h1><p class="page-description">Daftar pencatatan stok fisik dan status pembaruannya.</p></div>
      <button class="button button-primary" type="button" @click="router.push('/stok-opname/baru')">＋ Tambah Stock Opname</button>
    </div>

    <section class="panel product-panel">
      <div class="toolbar">
        <div><h2>Daftar Stock Opname</h2><p>{{ filteredOpnames.length }} pencatatan</p></div>
        <label class="opname-filter"><span class="sr-only">Filter status</span><select v-model="statusFilter"><option value="all">Semua status</option><option value="draft">Draft</option><option value="locked">Terkunci</option></select></label>
      </div>
      <div v-if="loading" class="table-state">Memuat stock opname...</div>
      <div v-else-if="!opnames.length" class="table-state"><strong>Belum ada stock opname</strong><span>Buat pencatatan untuk mulai menyesuaikan stok fisik.</span><button class="button button-primary" type="button" @click="router.push('/stok-opname/baru')">Tambah Stock Opname</button></div>
      <div v-else class="table-wrap">
        <div class="data-table-controls">
          <label class="data-table-page-size">
            Tampilkan
            <select v-model.number="pageSize" aria-label="Jumlah stock opname per halaman">
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
              <th v-for="column in columns" :key="column.key" :aria-sort="sortColumn === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort(column.key)">
                  {{ column.label }} <span>{{ sortColumn === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th>Aksi</th>
            </tr>
            <tr class="data-table-column-filters">
              <th><input v-model="filters.tanggal" aria-label="Filter tanggal" placeholder="Filter tanggal" /></th>
              <th><input v-model="filters.keterangan" aria-label="Filter keterangan" placeholder="Filter keterangan" /></th>
              <th><input v-model="filters.produk" aria-label="Filter produk dan stok real" placeholder="Filter produk/stok" /></th>
              <th><select v-model="filters.status" aria-label="Filter status"><option value="">Semua status</option><option value="draft">Draft</option><option value="locked">Terkunci</option></select></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="opname in paginatedOpnames" :key="opname.id">
              <td>{{ formatDate(opname.tanggal) }}</td>
              <td>{{ opname.keterangan || '-' }}</td>
              <td><div class="opname-products"><div v-for="item in opname.items" :key="item.produkId"><strong>{{ item.nama || 'Produk' }}</strong><small>{{ item.stokReal }} pcs</small></div></div></td>
              <td><span :class="['status-badge', opname.status === 'locked' ? 'status-locked' : 'status-draft']">{{ opname.status === 'locked' ? 'Terkunci' : 'Draft' }}</span></td>
              <td>
                <div class="row-actions">
                  <button v-if="opname.status !== 'locked'" class="action-button lock-action" type="button" @click="lockOpname(opname)">Kunci</button>
                  <button v-if="opname.status !== 'locked'" class="action-button edit-action" type="button" @click="router.push(`/stok-opname/${opname.id}/edit`)">Edit</button>
                  <button v-if="opname.status !== 'locked'" class="action-button delete-action" type="button" @click="deleteOpname(opname)">Hapus</button>
                  <span v-else class="locked-note">Tidak dapat diubah</span>
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedOpnames.length">
              <td colspan="5" class="empty-cell">Tidak ada stock opname yang cocok dengan filter.</td>
            </tr>
          </tbody>
        </table>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstVisibleOpname }}–{{ lastVisibleOpname }} dari {{ filteredOpnames.length }} pencatatan</p>
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
import { useRouter } from 'vue-router'
import { collection, doc, getDocs, runTransaction } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import { authState } from '@/auth'

const router = useRouter()
type OpnameItem = { produkId: string; nama: string; stokReal: number; stokSistem?: number; selisih?: number }
type StockOpname = { id: string; tanggal: string; keterangan?: string; items: OpnameItem[]; status: 'draft' | 'locked'; createdAt?: string }

const opnames = ref<StockOpname[]>([])
const loading = ref(true)
const statusFilter = ref('all')
const filters = reactive({ tanggal: '', keterangan: '', produk: '', status: '' })
const globalSearch = ref('')
const sortColumn = ref<'tanggal' | 'keterangan' | 'produk' | 'status'>('produk')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageSize = ref(10)
const currentPage = ref(1)
const columns = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'keterangan', label: 'Keterangan' },
  { key: 'produk', label: 'Produk dan Stok Real' },
  { key: 'status', label: 'Status' },
] as const

const getOpnameColumnValue = (opname: StockOpname, column: typeof sortColumn.value): string => {
  switch (column) {
    case 'tanggal': return opname.tanggal || ''
    case 'keterangan': return opname.keterangan || '-'
    case 'produk': return opname.items.map((item) => `${item.nama || 'Produk'} ${item.stokReal} pcs`).join(' ')
    case 'status': return opname.status === 'locked' ? 'Terkunci' : 'Draft'
  }
}

const filteredOpnames = computed(() => opnames.value.filter((opname) => {
  if (statusFilter.value !== 'all' && opname.status !== statusFilter.value) return false
  const search = globalSearch.value.trim().toLocaleLowerCase('id-ID')
  if (search && !columns.some(({ key }) => getOpnameColumnValue(opname, key).toLocaleLowerCase('id-ID').includes(search))) return false
  return columns.every(({ key }) => {
    const filter = filters[key].trim().toLocaleLowerCase('id-ID')
    if (!filter) return true
    if (key === 'status') return opname.status === filter
    return getOpnameColumnValue(opname, key).toLocaleLowerCase('id-ID').includes(filter)
  })
}))
const sortedOpnames = computed(() => [...filteredOpnames.value].sort((a, b) => {
  const comparison = sortColumn.value === 'tanggal'
    ? String(a.tanggal || '').localeCompare(String(b.tanggal || ''), 'id-ID', { numeric: true })
    : getOpnameColumnValue(a, sortColumn.value).localeCompare(getOpnameColumnValue(b, sortColumn.value), 'id-ID', { numeric: true, sensitivity: 'base' })
  return sortDirection.value === 'asc' ? comparison : -comparison
}))
const totalPages = computed(() => Math.ceil(sortedOpnames.value.length / pageSize.value))
const paginatedOpnames = computed(() => sortedOpnames.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const firstVisibleOpname = computed(() => sortedOpnames.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const lastVisibleOpname = computed(() => Math.min(currentPage.value * pageSize.value, sortedOpnames.value.length))

watch([filters, globalSearch, statusFilter, pageSize], () => { currentPage.value = 1 })
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages || 1 })

const toggleSort = (column: typeof sortColumn.value) => {
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else { sortColumn.value = column; sortDirection.value = 'asc' }
  currentPage.value = 1
}
const basePath = () => `warungs/${authState.warungId}`

const loadOpnames = async () => {
  if (!authState.warungId) { loading.value = false; return }
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, basePath(), 'stockOpnames'))
    opnames.value = snapshot.docs.map((item): StockOpname => {
      const data = item.data()
      const items: OpnameItem[] = Array.isArray(data.items) ? data.items : data.produkId ? [{ produkId: data.produkId, nama: data.namaProduk, stokReal: data.stokReal }] : []
      return { id: item.id, tanggal: data.tanggal || '', keterangan: data.keterangan || '', items, status: data.status === 'draft' ? 'draft' : 'locked', createdAt: data.createdAt || '' }
    })
  } finally {
    loading.value = false
  }
}

const formatDate = (value: string) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : '-'

const lockOpname = async (opname: StockOpname) => {
  const confirmation = await Swal.fire({ title: 'Kunci stock opname?', text: 'Setelah dikunci, data tidak dapat diedit dan stok produk akan diperbarui sesuai stok real.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, kunci opname', cancelButtonText: 'Batal', confirmButtonColor: '#2563eb' })
  if (!confirmation.isConfirmed || !authState.warungId) return
  try {
    await runTransaction(db, async (transaction) => {
      const opnameRef = doc(db, basePath(), 'stockOpnames', opname.id)
      const fresh = await transaction.get(opnameRef)
      if (!fresh.exists()) throw new Error('Stock opname tidak ditemukan.')
      if (fresh.data().status !== 'draft') throw new Error('Stock opname sudah terkunci dan tidak dapat diubah.')
      const items = (fresh.data().items || []) as OpnameItem[]
      if (!items.length || new Set(items.map((item) => item.produkId)).size !== items.length) throw new Error('Daftar produk pada stock opname tidak valid.')
      const productRefs = items.map((item) => ({ item, ref: doc(db, basePath(), 'produk', item.produkId) }))
      const productSnapshots = await Promise.all(productRefs.map(({ ref }) => transaction.get(ref)))
      const lockedAt = new Date().toISOString()
      const lockedItems = productSnapshots.map((snapshot, index) => {
        if (!snapshot.exists()) throw new Error(`${productRefs[index].item.nama || 'Produk'} tidak ditemukan.`)
        const item = productRefs[index].item
        const stokReal = Number(item.stokReal)
        if (!Number.isInteger(stokReal) || stokReal < 0) throw new Error('Stok real harus berupa bilangan bulat dan tidak boleh negatif.')
        const stokSistem = Number(snapshot.data()?.stokPcs) || 0
        transaction.update(productRefs[index].ref, { stokPcs: stokReal, updatedAt: lockedAt })
        return { ...item, nama: snapshot.data()?.nama || item.nama, stokSistem, selisih: stokReal - stokSistem }
      })
      transaction.update(opnameRef, { items: lockedItems, status: 'locked', lockedAt, updatedAt: lockedAt })
    })
    await loadOpnames()
    await Swal.fire({ title: 'Stock opname terkunci', text: 'Stok produk berhasil diperbarui.', icon: 'success', confirmButtonColor: '#2563eb' })
  } catch (error: unknown) {
    await Swal.fire({ title: 'Gagal mengunci stock opname', text: error instanceof Error ? error.message : 'Coba lagi.', icon: 'error', confirmButtonColor: '#2563eb' })
  }
}

const deleteOpname = async (opname: StockOpname) => {
  const confirmation = await Swal.fire({ title: 'Hapus stock opname?', text: 'Draft ini akan dihapus dan tidak mengubah stok.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', reverseButtons: true })
  if (!confirmation.isConfirmed || !authState.warungId) return
  try {
    const opnameRef = doc(db, basePath(), 'stockOpnames', opname.id)
    await runTransaction(db, async (transaction) => {
      const fresh = await transaction.get(opnameRef)
      if (!fresh.exists()) throw new Error('Stock opname tidak ditemukan.')
      if (fresh.data().status !== 'draft') throw new Error('Stock opname terkunci dan tidak dapat dihapus.')
      transaction.delete(opnameRef)
    })
    await loadOpnames()
  } catch (error: unknown) {
    await Swal.fire({ title: 'Gagal menghapus stock opname', text: error instanceof Error ? error.message : 'Coba lagi.', icon: 'error', confirmButtonColor: '#2563eb' })
  }
}

onMounted(loadOpnames)
</script>

<style scoped>
.opname-filter select { min-width: 150px; height: 38px; border: 1px solid #dce2ea; border-radius: 5px; background: #fff; padding: 0 10px; color: #526078; font: inherit; font-size: 12px; }
.opname-products { display: grid; gap: 6px; min-width: 150px; }
.opname-products > div { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
.opname-products strong { color: #354158; font-size: 12px; }
.opname-products small, .locked-note { color: #8792a5; font-size: 11px; }
.locked-note { white-space: nowrap; }
</style>
