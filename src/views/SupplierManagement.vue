<template>
  <section class="page-stack suppliers-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">MASTER DATA</p>
        <h1>Supplier</h1>
        <p class="page-description">Kelola nama pemasok yang digunakan pada Purchase Order.</p>
      </div>
      <button class="button button-primary" type="button" @click="openCreate">＋ Tambah Supplier</button>
    </div>

    <section class="panel">
      <div class="panel-heading customers-panel-heading">
        <div>
          <h2>Daftar Supplier</h2>
          <p>{{ filteredSuppliers.length }} dari {{ suppliers.length }} supplier terdaftar</p>
        </div>
      </div>
      <div v-if="loading" class="table-state">Memuat supplier...</div>
      <div v-else class="table-wrap">
        <div class="data-table-controls">
          <label class="data-table-page-size">
            Tampilkan
            <select v-model.number="pageSize" aria-label="Jumlah supplier per halaman">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
          <label class="data-table-global-search">
            Cari di semua kolom
            <input v-model="globalSearch" type="search" placeholder="Cari..." aria-label="Cari supplier" />
          </label>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th :aria-sort="sortColumn === 'nama' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('nama')">
                  Nama Supplier <span>{{ sortColumn === 'nama' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th :aria-sort="sortColumn === 'purchaseOrderCount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'">
                <button class="data-table-sort" type="button" @click="toggleSort('purchaseOrderCount')">
                  Total PO <span>{{ sortColumn === 'purchaseOrderCount' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕' }}</span>
                </button>
              </th>
              <th>Aksi</th>
            </tr>
            <tr class="data-table-column-filters">
              <th><input v-model="filters.nama" aria-label="Filter nama supplier" placeholder="Filter nama" /></th>
              <th><input v-model="filters.purchaseOrderCount" aria-label="Filter total PO" placeholder="Filter total PO" inputmode="numeric" /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supplier in paginatedSuppliers" :key="supplier.id">
              <td>{{ supplier.nama }}</td>
              <td>{{ supplier.purchaseOrderCount }}</td>
              <td>
                <div class="row-actions">
                  <button class="action-button edit-action" type="button" @click="openEdit(supplier)">Edit</button>
                  <button class="action-button delete-action" type="button" @click="removeSupplier(supplier)">Hapus</button>
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedSuppliers.length">
              <td colspan="3" class="empty-cell">
                {{ suppliers.length ? 'Tidak ada supplier yang cocok dengan filter.' : 'Belum ada data supplier.' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstVisibleSupplier }}–{{ lastVisibleSupplier }} dari {{ sortedSuppliers.length }} supplier</p>
          <div class="data-table-pagination" aria-label="Navigasi halaman supplier">
            <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
            <span>Halaman {{ totalPages ? currentPage : 0 }} dari {{ totalPages }}</span>
            <button type="button" :disabled="currentPage >= totalPages" @click="currentPage++">Berikutnya</button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false">
      <section class="modal-card">
        <header class="modal-header">
          <div>
            <p class="eyebrow">MASTER DATA</p>
            <h2>{{ editing ? 'Edit Supplier' : 'Tambah Supplier' }}</h2>
          </div>
          <button class="modal-close" type="button" aria-label="Tutup" @click="showForm = false">×</button>
        </header>
        <form class="modal-form" @submit.prevent="saveSupplier">
          <label class="field">
            <span>Nama Supplier</span>
            <input v-model.trim="form.nama" required maxlength="120" placeholder="Contoh: Toko Sumber Makmur" />
          </label>
          <div class="form-actions">
            <button class="button button-secondary" type="button" @click="showForm = false">Batal</button>
            <button class="button button-primary" type="submit" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import { authState } from '@/auth'
import { loadSupplierMaster, normalizeSupplierName, supplierDocumentId } from '@/supplierData'

type Supplier = {
  id: string
  nama: string
  purchaseOrderCount: number
}

type SortColumn = 'nama' | 'purchaseOrderCount'

const suppliers = ref<Supplier[]>([])
const loading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const editing = ref<Supplier | null>(null)
const form = ref({ nama: '' })
const globalSearch = ref('')
const filters = reactive({ nama: '', purchaseOrderCount: '' })
const sortColumn = ref<SortColumn>('nama')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageSize = ref(10)
const currentPage = ref(1)
const basePath = () => `warungs/${authState.warungId}`
const normalize = (value: unknown) => normalizeSupplierName(String(value ?? ''))

const filteredSuppliers = computed(() => {
  const search = normalize(globalSearch.value)
  return suppliers.value.filter((supplier) => {
    const matchesSearch = !search || `${supplier.nama} ${supplier.purchaseOrderCount}`.toLocaleLowerCase('id-ID').includes(search)
    return matchesSearch
      && normalize(supplier.nama).includes(normalize(filters.nama))
      && String(supplier.purchaseOrderCount).includes(filters.purchaseOrderCount.trim())
  })
})
const sortedSuppliers = computed(() => [...filteredSuppliers.value].sort((a, b) => {
  const comparison = sortColumn.value === 'nama'
    ? a.nama.localeCompare(b.nama, 'id-ID', { numeric: true, sensitivity: 'base' })
    : a.purchaseOrderCount - b.purchaseOrderCount
  return sortDirection.value === 'asc' ? comparison : -comparison
}))
const totalPages = computed(() => Math.ceil(sortedSuppliers.value.length / pageSize.value))
const paginatedSuppliers = computed(() => sortedSuppliers.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const firstVisibleSupplier = computed(() => sortedSuppliers.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const lastVisibleSupplier = computed(() => Math.min(currentPage.value * pageSize.value, sortedSuppliers.value.length))

watch([filters, globalSearch, pageSize], () => { currentPage.value = 1 })
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages || 1 })

const toggleSort = (column: SortColumn) => {
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

const loadSuppliers = async () => {
  if (!authState.warungId) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const { suppliers: supplierRecords, purchaseOrders } = await loadSupplierMaster(basePath())
    const orderCounts = new Map<string, number>()
    for (const order of purchaseOrders) {
      const name = normalize(order.pemasok)
      if (name) orderCounts.set(name, (orderCounts.get(name) || 0) + 1)
    }
    suppliers.value = supplierRecords
      .map(({ id, nama }) => ({ id, nama, purchaseOrderCount: orderCounts.get(normalize(nama)) || 0 }))
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id-ID', { sensitivity: 'base' }))
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = null
  form.value = { nama: '' }
  showForm.value = true
}
const openEdit = (supplier: Supplier) => {
  editing.value = supplier
  form.value = { nama: supplier.nama }
  showForm.value = true
}
const saveSupplier = async () => {
  const nama = form.value.nama.trim()
  if (!nama || !authState.warungId) return
  if (suppliers.value.some((supplier) => normalize(supplier.nama) === normalize(nama) && supplier.id !== editing.value?.id)) {
    await Swal.fire({ title: 'Supplier sudah terdaftar', text: 'Gunakan nama supplier yang berbeda.', icon: 'warning' })
    return
  }
  saving.value = true
  let saved = false
  try {
    const timestamp = new Date().toISOString()
    if (editing.value) {
      await updateDoc(doc(db, basePath(), 'suppliers', editing.value.id), { nama, updatedAt: timestamp })
    } else {
      const supplierRef = doc(db, basePath(), 'suppliers', supplierDocumentId(nama))
      await setDoc(supplierRef, { nama, createdAt: timestamp, updatedAt: timestamp }, { merge: true })
    }
    saved = true
    showForm.value = false
    await loadSuppliers()
    await Swal.fire({ title: 'Tersimpan', text: 'Data supplier berhasil disimpan.', icon: 'success', confirmButtonColor: '#2563eb' })
  } catch (error) {
    await Swal.fire({
      title: saved ? 'Supplier tersimpan, daftar gagal diperbarui' : 'Gagal menyimpan supplier',
      text: error instanceof Error ? error.message : 'Silakan coba lagi.',
      icon: 'error',
    })
  } finally {
    saving.value = false
  }
}
const removeSupplier = async (supplier: Supplier) => {
  const confirmation = await Swal.fire({
    title: 'Hapus supplier?',
    text: supplier.purchaseOrderCount
      ? `Supplier ini digunakan pada ${supplier.purchaseOrderCount} PO. Riwayat PO tidak akan dihapus.`
      : `Data supplier ${supplier.nama} akan dihapus.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626',
  })
  if (!confirmation.isConfirmed || !authState.warungId) return
  let deleted = false
  try {
    await deleteDoc(doc(db, basePath(), 'suppliers', supplier.id))
    deleted = true
    await loadSuppliers()
  } catch (error) {
    await Swal.fire({
      title: deleted ? 'Supplier dihapus, daftar gagal diperbarui' : 'Gagal menghapus supplier',
      text: error instanceof Error ? error.message : 'Silakan coba lagi.',
      icon: 'error',
    })
  }
}

onMounted(async () => {
  try {
    await loadSuppliers()
  } catch (error) {
    await Swal.fire({
      title: 'Gagal memuat supplier',
      text: error instanceof Error ? error.message : 'Silakan coba lagi.',
      icon: 'error',
    })
  }
})
</script>
