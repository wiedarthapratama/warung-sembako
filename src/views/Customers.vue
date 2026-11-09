<template>
  <section class="page-section customers-page">
    <div class="page-heading"><div><p class="eyebrow">MASTER DATA</p><h1>Pelanggan</h1><p class="page-description">Kelola pelanggan dan lihat riwayat transaksi POS mereka.</p></div><button class="button button-primary" type="button" @click="openCreate">+ Tambah Pelanggan</button></div>
    <section class="panel customers-panel">
      <div class="panel-heading customers-panel-heading">
        <div><h2>Daftar Pelanggan</h2><p>{{ filteredCustomers.length }} dari {{ customers.length }} pelanggan terdaftar</p></div>
      </div>
      <div class="table-wrap">
        <div class="data-table-controls">
          <label class="data-table-page-size">
            Tampilkan
            <select v-model.number="pageSize" aria-label="Jumlah pelanggan per halaman">
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
              <th><input v-model="filters.nama" aria-label="Filter nama pelanggan" placeholder="Filter nama" /></th>
              <th><input v-model="filters.transactionCount" aria-label="Filter total transaksi" placeholder="Filter transaksi" inputmode="numeric" /></th>
              <th><input v-model="filters.totalSpent" aria-label="Filter total belanja" placeholder="Filter belanja" inputmode="decimal" /></th>
              <th><input v-model="filters.totalDebt" aria-label="Filter utang" placeholder="Filter utang" inputmode="decimal" /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in paginatedCustomers" :key="customer.id">
              <td>{{ customer.nama }}</td>
              <td>{{ customer.transactionCount || 0 }}</td>
              <td>{{ formatRupiah(customer.totalSpent || 0) }}</td>
              <td>{{ formatRupiah(customer.totalDebt || 0) }}</td>
              <td><button class="action-button view-action" type="button" @click="selectedCustomer = customer">Detail POS</button></td>
            </tr>
            <tr v-if="!paginatedCustomers.length">
              <td colspan="5" class="empty-cell">{{ customers.length ? 'Tidak ada pelanggan yang cocok dengan filter.' : 'Belum ada data pelanggan.' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstVisibleCustomer }}–{{ lastVisibleCustomer }} dari {{ sortedCustomers.length }} pelanggan</p>
          <div class="data-table-pagination">
            <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
            <span>Halaman {{ totalPages ? currentPage : 0 }} dari {{ totalPages }}</span>
            <button type="button" :disabled="currentPage >= totalPages" @click="currentPage++">Berikutnya</button>
          </div>
        </div>
      </div>
    </section>
    <div v-if="selectedCustomer" class="modal-backdrop receipt-backdrop" @click.self="selectedCustomer = null"><section class="receipt-modal customer-detail-modal"><header class="receipt-modal-header"><div><p class="eyebrow">RIWAYAT PELANGGAN</p><h2>{{ selectedCustomer.nama }}</h2><p>{{ selectedCustomerTransactions.length }} transaksi POS</p></div><button class="modal-close" type="button" @click="selectedCustomer = null">×</button></header><div class="customer-transaction-list"><button v-for="transaction in selectedCustomerTransactions" :key="transaction.id" class="customer-transaction" type="button" @click="openTransactionDetail(transaction)"><div><strong>{{ transaction.nomor }}</strong><small>{{ formatDate(transaction.tanggal) }} · {{ String(transaction.metodePembayaran || '').toUpperCase() }}</small></div><strong>{{ formatRupiah(transaction.total) }}</strong></button><p v-if="!selectedCustomerTransactions.length" class="empty-cell">Belum ada transaksi POS.</p></div></section></div><div v-if="detailTransaction" class="modal-backdrop receipt-backdrop" @click.self="detailTransaction = null"><section class="receipt-modal"><header class="receipt-modal-header"><div><p class="eyebrow">DETAIL TRANSAKSI</p><h2>{{ detailTransaction.nomor }}</h2><p>{{ formatDate(detailTransaction.tanggal) }} · {{ detailTransaction.status === 'locked' ? 'Terkunci' : 'Draft' }}</p></div><div class="receipt-header-actions"><button class="button button-secondary" type="button" @click="printTransaction">Cetak</button><button class="modal-close" type="button" @click="detailTransaction = null">×</button></div></header><div class="receipt-paper" id="customer-sale-receipt"><div class="receipt-brand"><strong>WARUNG SEMBAKO</strong><span>Struk Penjualan</span></div><div class="receipt-meta"><div><span>Nomor Transaksi</span><strong>{{ detailTransaction.nomor }}</strong></div><div><span>Tanggal</span><strong>{{ formatDate(detailTransaction.tanggal) }}</strong></div><div><span>Pelanggan</span><strong>{{ detailTransaction.pelangganNama || selectedCustomer?.nama || 'Umum' }}</strong></div><div><span>Pembayaran</span><strong>{{ String(detailTransaction.metodePembayaran || '').toUpperCase() }}</strong></div></div><div class="receipt-divider"></div><div class="receipt-items"><div v-for="item in detailTransaction.items || []" :key="item.produkId" class="receipt-item"><div><strong>{{ item.nama }}</strong><small>{{ item.jumlah }} unit × {{ formatRupiah(item.hargaJualUnit) }}</small></div><strong>{{ formatRupiah(Number(item.jumlah) * Number(item.hargaJualUnit)) }}</strong></div></div><div class="receipt-divider"></div><div class="receipt-total"><span>Total Penjualan</span><strong>{{ formatRupiah(detailTransaction.total) }}</strong></div><div class="receipt-status">{{ detailTransaction.status === 'locked' ? 'TRANSAKSI TERKUNCI' : 'DRAFT TRANSAKSI' }}</div><p v-if="detailTransaction.catatan" class="receipt-note">Catatan: {{ detailTransaction.catatan }}</p><p class="receipt-thanks">Terima kasih telah berbelanja</p></div></section></div>
    <div v-if="showForm" class="modal-backdrop" @click.self="showForm = false"><section class="modal-card customer-form-modal"><header class="modal-header"><div><p class="eyebrow">MASTER DATA</p><h2>{{ editing ? 'Edit Pelanggan' : 'Tambah Pelanggan' }}</h2></div><button class="modal-close" type="button" @click="showForm = false">×</button></header><form class="modal-form" @submit.prevent="saveCustomer"><label class="field"><span>Nama Pelanggan</span><input v-model.trim="form.nama" required placeholder="Contoh: Budi" /></label><div class="form-actions"><button class="button button-secondary" type="button" @click="showForm = false">Batal</button><button class="button button-primary" type="submit">Simpan</button></div></form></section></div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import { authState } from '@/auth'
const customers = ref<any[]>([]); const transactions = ref<any[]>([]); const selectedCustomer = ref<any|null>(null); const detailTransaction = ref<any|null>(null); const showForm = ref(false); const editing = ref<any|null>(null); const form = ref({ nama: '' }); const base = () => `warungs/${authState.warungId}`
const formatRupiah=(value:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value)||0)
const formatDate=(value:string)=>new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value))
const filters = reactive({ nama: '', transactionCount: '', totalSpent: '', totalDebt: '' })
const globalSearch = ref('')
const sortColumn = ref<'nama' | 'transactionCount' | 'totalSpent' | 'totalDebt'>('nama')
const sortDirection = ref<'asc' | 'desc'>('asc')
const pageSize = ref(10)
const currentPage = ref(1)
const columns = [
  { key: 'nama', label: 'Nama Pelanggan' },
  { key: 'transactionCount', label: 'Total Transaksi' },
  { key: 'totalSpent', label: 'Total Belanja' },
  { key: 'totalDebt', label: 'Utang' },
] as const
const getColumnValue = (customer: any, column: typeof sortColumn.value): string | number => {
  switch (column) {
    case 'nama': return customer.nama || ''
    case 'transactionCount': return Number(customer.transactionCount) || 0
    case 'totalSpent': return Number(customer.totalSpent) || 0
    case 'totalDebt': return Number(customer.totalDebt) || 0
  }
}
const getColumnSearchText = (customer: any, column: typeof sortColumn.value) => {
  const value = getColumnValue(customer, column)
  return column === 'totalSpent' || column === 'totalDebt'
    ? `${value} ${formatRupiah(Number(value))}`
    : String(value)
}
const filteredCustomers = computed(() => customers.value.filter((customer) => {
  const search = globalSearch.value.trim().toLocaleLowerCase('id-ID')
  if (search && !columns.some(({ key }) => getColumnSearchText(customer, key).toLocaleLowerCase('id-ID').includes(search))) return false
  return columns.every(({ key }) => getColumnSearchText(customer, key).toLocaleLowerCase('id-ID')
    .includes(filters[key].trim().toLocaleLowerCase('id-ID')))
}))
const sortedCustomers = computed(() => [...filteredCustomers.value].sort((a, b) => {
  const left = getColumnValue(a, sortColumn.value)
  const right = getColumnValue(b, sortColumn.value)
  const comparison = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'id-ID', { numeric: true, sensitivity: 'base' })
  return sortDirection.value === 'asc' ? comparison : -comparison
}))
const totalPages = computed(() => Math.ceil(sortedCustomers.value.length / pageSize.value))
const paginatedCustomers = computed(() => sortedCustomers.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const firstVisibleCustomer = computed(() => sortedCustomers.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const lastVisibleCustomer = computed(() => Math.min(currentPage.value * pageSize.value, sortedCustomers.value.length))
watch([filters, globalSearch, pageSize], () => { currentPage.value = 1 })
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages || 1 })
const toggleSort = (column: typeof sortColumn.value) => {
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else { sortColumn.value = column; sortDirection.value = 'asc' }
  currentPage.value = 1
}
const selectedCustomerTransactions=computed(()=>selectedCustomer.value?transactions.value.filter((item)=>item.pelangganId===selectedCustomer.value.id||item.customerId===selectedCustomer.value.id||item.pelangganNama?.trim().toLowerCase()===selectedCustomer.value.nama?.trim().toLowerCase()):[])
const load=async()=>{if(!authState.warungId)return; const [customerSnapshot,saleSnapshot]=await Promise.all([getDocs(collection(db,base(),'customers')),getDocs(collection(db,base(),'sales'))]); const sales=saleSnapshot.docs.map((item)=>({id:item.id,...item.data()})); transactions.value=sales; customers.value=customerSnapshot.docs.map((item)=>{const data:any=item.data(); const own=sales.filter((sale:any)=>sale.pelangganId===item.id||sale.customerId===item.id||sale.pelangganNama?.trim().toLowerCase()===data.nama?.trim().toLowerCase()); return {id:item.id,...data,transactionCount:own.length,totalSpent:own.reduce((sum:number,sale:any)=>sum+Number(sale.total||0),0),totalDebt:own.filter((sale:any)=>sale.metodePembayaran==='utang'&&sale.debtStatus!=='paid'&&sale.status!=='paid').reduce((sum:number,sale:any)=>sum+Number(sale.total||0),0)}})}
const openTransactionDetail=(transaction:any)=>{selectedCustomer.value=null; detailTransaction.value=transaction}; const printTransaction=()=>window.print(); const openCreate=()=>{editing.value=null; form.value={nama:''}; showForm.value=true}; const saveCustomer=async()=>{if(!form.value.nama.trim()||!authState.warungId)return; if(editing.value) await updateDoc(doc(db,base(),'customers',editing.value.id),{nama:form.value.nama.trim(),updatedAt:new Date().toISOString()}); else await addDoc(collection(db,base(),'customers'),{nama:form.value.nama.trim(),createdAt:new Date().toISOString()}); showForm.value=false; await load(); await Swal.fire({title:'Tersimpan',text:'Data pelanggan berhasil disimpan.',icon:'success',confirmButtonColor:'#2563eb'})}
onMounted(load)
</script>
