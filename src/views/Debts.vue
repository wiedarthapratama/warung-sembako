<template>
  <section class="page-content">
    <div class="page-heading">
      <div>
        <p class="eyebrow">PIUTANG PELANGGAN</p>
        <h1>Utang</h1>
        <p class="page-description">Pantau transaksi utang dan catat pelunasan pelanggan.</p>
      </div>
    </div>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Daftar Piutang</h2>
          <p>{{ filteredDebts.length }} dari {{ debts.length }} piutang tercatat</p>
        </div>
      </div>
      <div class="table-wrap">
        <div class="data-table-controls">
          <label class="data-table-page-size">
            Tampilkan
            <select v-model.number="pageSize" aria-label="Jumlah piutang per halaman">
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
              <th><input v-model="filters.pelanggan" aria-label="Filter pelanggan" placeholder="Filter pelanggan" /></th>
              <th><input v-model="filters.nomor" aria-label="Filter nomor transaksi" placeholder="Filter nomor" /></th>
              <th><input v-model="filters.total" aria-label="Filter total piutang" placeholder="Filter total" inputmode="decimal" /></th>
              <th><select v-model="filters.status" aria-label="Filter status"><option value="">Semua status</option><option value="unpaid">Belum Lunas</option><option value="paid">Lunas</option></select></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="debt in paginatedDebts" :key="debt.id">
              <td>{{ debt.pelangganNama }}</td>
              <td>{{ debt.nomor }}</td>
              <td>{{ formatRupiah(debt.total) }}</td>
              <td><span :class="['status-badge', debt.status === 'paid' ? 'status-locked' : 'status-draft']">{{
                debt.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}</span></td>
              <td>
                <div class="row-actions"><button class="action-button view-action" type="button"
                    @click="detailDebt = debt">Detail</button><button v-if="debt.status !== 'paid'"
                    class="action-button lock-action" type="button" @click="settle(debt)">Lunasi</button></div>
              </td>
            </tr>
            <tr v-if="!paginatedDebts.length">
              <td colspan="5" class="empty-cell">{{ debts.length ? 'Tidak ada piutang yang cocok dengan filter.' : 'Belum ada data piutang.' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstVisibleDebt }}–{{ lastVisibleDebt }} dari {{ sortedDebts.length }} piutang</p>
          <div class="data-table-pagination">
            <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
            <span>Halaman {{ totalPages ? currentPage : 0 }} dari {{ totalPages }}</span>
            <button type="button" :disabled="currentPage >= totalPages" @click="currentPage++">Berikutnya</button>
          </div>
        </div>
      </div>
    </section>
    <div v-if="detailDebt" class="modal-backdrop receipt-backdrop" @click.self="detailDebt = null">
      <section class="receipt-modal">
        <header class="receipt-modal-header">
          <div>
            <p class="eyebrow">DETAIL PIUTANG</p>
            <h2>{{ detailDebt.nomor }}</h2>
            <p>{{ formatDate(detailDebt.tanggal) }} · {{ detailDebt.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}</p>
          </div>
          <div class="receipt-header-actions"><button class="button button-secondary" type="button"
              @click="printDebt">Cetak</button><button class="modal-close" type="button"
              @click="detailDebt = null">×</button></div>
        </header>
        <div class="receipt-paper" id="debt-receipt">
          <div class="receipt-brand"><strong>WARUNG SEMBAKO</strong><span>Detail Piutang Pelanggan</span></div>
          <div class="receipt-meta">
            <div><span>Nomor Transaksi</span><strong>{{ detailDebt.nomor }}</strong></div>
            <div><span>Tanggal</span><strong>{{ formatDate(detailDebt.tanggal) }}</strong></div>
            <div><span>Pelanggan</span><strong>{{ detailDebt.pelangganNama || 'Umum' }}</strong></div>
            <div><span>Status</span><strong>{{ detailDebt.status === 'paid' ? 'Lunas' : 'Belum Lunas' }}</strong></div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-items">
            <div v-for="item in detailDebt.items || []" :key="item.produkId" class="receipt-item">
              <div><strong>{{ item.nama }}</strong><small>{{ item.jumlah }} unit × {{ formatRupiah(item.hargaJualUnit)
                  }}</small></div><strong>{{ formatRupiah(item.jumlah * item.hargaJualUnit) }}</strong>
            </div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-total"><span>Total Piutang</span><strong>{{ formatRupiah(detailDebt.total) }}</strong>
          </div>
          <div :class="['receipt-status', detailDebt.status === 'paid' ? 'receipt-status' : 'receipt-status-debt']">{{
            detailDebt.status === 'paid' ? 'PIUTANG SUDAH LUNAS' : 'PIUTANG BELUM LUNAS' }}</div>
          <p v-if="detailDebt.catatan" class="receipt-note">Catatan: {{ detailDebt.catatan }}</p>
          <p class="receipt-thanks">Simpan bukti ini untuk arsip transaksi</p>
        </div>
      </section>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Swal from 'sweetalert2'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { authState } from '@/auth'

const debts = ref<any[]>([])
const detailDebt = ref<any | null>(null)
const filters = reactive({ pelanggan: '', nomor: '', total: '', status: '' })
const globalSearch = ref('')
const sortColumn = ref<'pelanggan' | 'nomor' | 'total' | 'status'>('pelanggan')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageSize = ref(10)
const currentPage = ref(1)
const columns = [
  { key: 'pelanggan', label: 'Pelanggan' },
  { key: 'nomor', label: 'Nomor Transaksi' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
] as const

const printDebt = () => window.print()
const formatDate = (value: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
const base = () => `warungs/${authState.warungId}`
const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)

const getColumnValue = (debt: any, column: typeof sortColumn.value): string | number => {
  switch (column) {
    case 'pelanggan': return debt.pelangganNama || 'Umum'
    case 'nomor': return debt.nomor || ''
    case 'total': return Number(debt.total) || 0
    case 'status': return debt.status === 'paid' ? 'Lunas' : 'Belum Lunas'
  }
}

const filteredDebts = computed(() => debts.value.filter((debt) => {
  const search = globalSearch.value.trim().toLocaleLowerCase('id-ID')
  if (search && !columns.some(({ key }) => {
    const value = getColumnValue(debt, key)
    return `${value} ${key === 'total' ? formatRupiah(Number(value)) : ''}`.toLocaleLowerCase('id-ID').includes(search)
  })) return false

  return columns.every(({ key }) => {
    const filter = filters[key].trim().toLocaleLowerCase('id-ID')
    if (!filter) return true
    if (key === 'status') return debt.status === filter
    const value = getColumnValue(debt, key)
    const searchableValue = key === 'total' ? `${value} ${formatRupiah(Number(value))}` : String(value)
    return searchableValue.toLocaleLowerCase('id-ID').includes(filter)
  })
}))

const sortedDebts = computed(() => [...filteredDebts.value].sort((a, b) => {
  const left = getColumnValue(a, sortColumn.value)
  const right = getColumnValue(b, sortColumn.value)
  const comparison = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'id-ID', { numeric: true, sensitivity: 'base' })
  return sortDirection.value === 'asc' ? comparison : -comparison
}))

const totalPages = computed(() => Math.ceil(sortedDebts.value.length / pageSize.value))
const paginatedDebts = computed(() => sortedDebts.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const firstVisibleDebt = computed(() => sortedDebts.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const lastVisibleDebt = computed(() => Math.min(currentPage.value * pageSize.value, sortedDebts.value.length))

watch([filters, globalSearch, pageSize], () => { currentPage.value = 1 })
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages || 1 })

const toggleSort = (column: typeof sortColumn.value) => {
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else { sortColumn.value = column; sortDirection.value = 'asc' }
  currentPage.value = 1
}

const load = async () => {
  if (!authState.warungId) return
  const snapshot = await getDocs(query(collection(db, base(), 'sales'), where('metodePembayaran', '==', 'utang')))
  debts.value = snapshot.docs.map((item) => {
    const data = item.data()
    return { id: item.id, ...data, status: data.debtStatus === 'paid' ? 'paid' : (data.status === 'paid' ? 'paid' : 'unpaid') }
  })
}

const settle = async (debt: any) => {
  const result = await Swal.fire({ title: 'Pelunasan utang', text: `Pilih metode pelunasan untuk ${formatRupiah(debt.total)}`, input: 'select', inputOptions: { cash: 'Cash', qris: 'QRIS' }, inputPlaceholder: 'Pilih metode', showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal' })
  if (result.isConfirmed && result.value) {
    await updateDoc(doc(db, base(), 'sales', debt.id), { debtStatus: 'paid', settledAt: new Date().toISOString(), settlementMethod: result.value })
    await load()
    await Swal.fire({ title: 'Utang lunas', icon: 'success', confirmButtonColor: '#2563eb' })
  }
}

onMounted(load)
</script>
