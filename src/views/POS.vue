<template>
  <section class="page-content pos-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">TRANSAKSI PENJUALAN</p>
        <h1>POS</h1>
        <p class="page-description">
          Catat penjualan, kelola pembayaran, dan kurangi stok saat transaksi dikunci.
        </p>
      </div>
      <button class="button button-primary" type="button" @click="router.push('/pos/baru')">
        + Transaksi Baru
      </button>
    </div>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Daftar Penjualan</h2>
          <p>{{ filteredTransactions.length }} dari {{ transactions.length }} transaksi tercatat</p>
        </div>
      </div>
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
          <input v-model="search" type="search" placeholder="Cari transaksi..." />
        </label>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nomor</th>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Pembayaran</th>
              <th>Total</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
            <tr class="data-table-column-filters">
              <th><input v-model="columnFilters.nomor" aria-label="Cari nomor transaksi" placeholder="Cari nomor" /></th>
              <th><input v-model="columnFilters.tanggal" aria-label="Cari tanggal transaksi" placeholder="Cari tanggal" /></th>
              <th><input v-model="columnFilters.pelanggan" aria-label="Cari pelanggan" placeholder="Cari pelanggan" /></th>
              <th>
                <select v-model="columnFilters.pembayaran" aria-label="Filter metode pembayaran">
                  <option value="">Semua</option>
                  <option value="cash">Cash</option>
                  <option value="qris">QRIS</option>
                  <option value="utang">Utang</option>
                </select>
              </th>
              <th><input v-model="columnFilters.total" aria-label="Cari total transaksi" placeholder="Cari total" /></th>
              <th>
                <select v-model="columnFilters.status" aria-label="Filter status">
                  <option value="">Semua</option>
                  <option value="draft">Draft</option>
                  <option value="locked">Terkunci</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in paginatedTransactions" :key="tx.id">
              <td>{{ tx.nomor }}</td>
              <td>{{ formatDate(tx.tanggal) }}</td>
              <td>{{ tx.pelangganNama || 'Umum' }}</td>
              <td>{{ tx.metodePembayaran.toUpperCase() }}</td>
              <td>{{ formatRupiah(tx.total) }}</td>
              <td>
                <span
                  :class="[
                    'status-badge',
                    tx.status === 'locked' ? 'status-locked' : 'status-draft',
                  ]"
                  >{{ tx.status === 'locked' ? 'Terkunci' : 'Draft' }}</span
                >
              </td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="tx.status !== 'locked'"
                    class="action-button edit-action"
                    type="button"
                    @click="router.push(`/pos/${tx.id}/edit`)"
                  >
                    Edit</button
                  ><button
                    v-if="tx.status !== 'locked'"
                    class="action-button lock-action"
                    type="button"
                    @click="lockTransaction(tx)"
                  >
                    Kunci</button
                  ><button
                    class="action-button view-action"
                    type="button"
                    @click="detailOrder = tx"
                  >
                    Detail
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedTransactions.length">
              <td colspan="7" class="empty-cell">
                {{ transactions.length ? 'Tidak ada transaksi yang cocok dengan pencarian.' : 'Belum ada transaksi penjualan.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="data-table-footer">
        <p>Menampilkan {{ firstRow }} sampai {{ lastRow }} dari {{ filteredTransactions.length }} transaksi</p>
        <div class="data-table-pagination" aria-label="Navigasi halaman">
          <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
          <span>Halaman {{ currentPage }} dari {{ pageCount }}</span>
          <button type="button" :disabled="currentPage >= pageCount" @click="currentPage++">Berikutnya</button>
        </div>
      </div>
    </section>
    <div
      v-if="detailOrder"
      class="modal-backdrop receipt-backdrop"
      @click.self="detailOrder = null"
    >
      <section class="receipt-modal">
        <header class="receipt-modal-header">
          <div>
            <p class="eyebrow">DETAIL TRANSAKSI</p>
            <h2>{{ detailOrder.nomor }}</h2>
            <p>
              {{ formatDate(detailOrder.tanggal) }} ·
              {{ detailOrder.status === 'locked' ? 'Terkunci' : 'Draft' }}
            </p>
          </div>
          <div class="receipt-header-actions">
            <button class="button button-secondary" type="button" @click="printReceipt">
              Cetak</button
            ><button class="modal-close" type="button" @click="detailOrder = null">×</button>
          </div>
        </header>
        <div class="receipt-paper" id="sale-receipt">
          <div class="receipt-brand">
            <strong>WARUNG SEMBAKO</strong><span>Struk Penjualan</span>
          </div>
          <div class="receipt-meta">
            <div>
              <span>Nomor Transaksi</span><strong>{{ detailOrder.nomor }}</strong>
            </div>
            <div>
              <span>Tanggal</span><strong>{{ formatDate(detailOrder.tanggal) }}</strong>
            </div>
            <div>
              <span>Pelanggan</span><strong>{{ detailOrder.pelangganNama || 'Umum' }}</strong>
            </div>
            <div>
              <span>Pembayaran</span
              ><strong>{{ String(detailOrder.metodePembayaran || '').toUpperCase() }}</strong>
            </div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-items">
            <div v-for="item in detailOrder.items || []" :key="item.produkId" class="receipt-item">
              <div>
                <strong>{{ item.nama }}</strong
                ><small>{{ item.jumlah }} unit × {{ formatRupiah(item.hargaJualUnit) }}</small>
              </div>
              <strong>{{ formatRupiah(item.jumlah * item.hargaJualUnit) }}</strong>
            </div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-total">
            <span>Total Penjualan</span><strong>{{ formatRupiah(detailOrder.total) }}</strong>
          </div>
          <div v-if="detailOrder.metodePembayaran === 'cash'" class="receipt-payment-summary">
            <div>
              <span>Total Bayar / Jumlah Bayar</span
              ><strong>{{ formatRupiah(detailOrder.jumlahBayar) }}</strong>
            </div>
            <div>
              <span>Kembalian</span><strong>{{ formatRupiah(detailOrder.kembalian) }}</strong>
            </div>
          </div>
          <div v-if="detailOrder.metodePembayaran === 'utang'" class="receipt-debt-status">
            <span>Status Utang</span
            ><strong>{{
              detailOrder.debtStatus === 'paid' || detailOrder.statusUtang === 'paid'
                ? 'Sudah Lunas'
                : 'Belum Lunas'
            }}</strong>
          </div>
          <div
            :class="[
              'receipt-status',
              detailOrder.metodePembayaran === 'utang' ? 'receipt-status-debt' : '',
            ]"
          >
            {{ detailOrder.status === 'locked' ? 'TRANSAKSI TERKUNCI' : 'DRAFT TRANSAKSI' }}
          </div>
          <p v-if="detailOrder.catatan" class="receipt-note">Catatan: {{ detailOrder.catatan }}</p>
          <p class="receipt-thanks">Terima kasih telah berbelanja</p>
        </div>
      </section>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { collection, doc, getDocs, orderBy, query, runTransaction } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'
const router = useRouter()
const transactions = ref<any[]>([])
const detailOrder = ref<any | null>(null)
const search = ref('')
const pageSize = ref(10)
const currentPage = ref(1)
const columnFilters = reactive({
  nomor: '',
  tanggal: '',
  pelanggan: '',
  pembayaran: '',
  total: '',
  status: '',
})
const printReceipt = () => window.print()
const basePath = () => `warungs/${authState.warungId}`
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
const formatDate = (value: string) =>
  value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : '-'
const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('id')
const filteredTransactions = computed(() => {
  const globalSearch = normalize(search.value)
  return transactions.value.filter((tx) => {
    const fields = {
      nomor: String(tx.nomor || ''),
      tanggal: `${tx.tanggal || ''} ${formatDate(tx.tanggal)}`,
      pelanggan: tx.pelangganNama || 'Umum',
      pembayaran: String(tx.metodePembayaran || '').toUpperCase(),
      total: `${formatRupiah(Number(tx.total) || 0)} ${tx.total ?? ''}`,
      status: tx.status === 'locked' ? 'Terkunci locked' : 'Draft draft',
    }
    const matchesGlobal =
      !globalSearch || Object.values(fields).some((value) => normalize(value).includes(globalSearch))
    const matchesColumns = Object.entries(columnFilters).every(([column, filter]) => {
      const fieldValue = fields[column as keyof typeof fields]
      return !normalize(filter) || normalize(fieldValue).includes(normalize(filter))
    })
    return matchesGlobal && matchesColumns
  })
})
const pageCount = computed(() => Math.max(1, Math.ceil(filteredTransactions.value.length / pageSize.value)))
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTransactions.value.slice(start, start + pageSize.value)
})
const firstRow = computed(() => (filteredTransactions.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0))
const lastRow = computed(() => Math.min(currentPage.value * pageSize.value, filteredTransactions.value.length))
watch([search, pageSize, columnFilters], () => (currentPage.value = 1), { deep: true })
const load = async () => {
  if (!authState.warungId) return
  const salesQuery = query(collection(db, basePath(), 'sales'), orderBy('tanggal', 'desc'))
  const snapshot = await getDocs(salesQuery)
  transactions.value = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}
const lockTransaction = async (sale: any) => {
  const confirm = await Swal.fire({
    title: 'Kunci transaksi?',
    text: 'Setelah dikunci, transaksi tidak dapat diedit dan stok akan berkurang.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, kunci transaksi',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
  })
  if (!confirm.isConfirmed || !authState.warungId) return
  try {
    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, basePath(), 'sales', sale.id)
      const productRefs = (sale.items || []).map((item: any) => ({
        item,
        ref: doc(db, basePath(), 'produk', item.produkId),
      }))
      const [saleSnapshot, ...productSnapshots] = await Promise.all([
        transaction.get(saleRef),
        ...productRefs.map(({ ref }: any) => transaction.get(ref)),
      ])
      if (!saleSnapshot.exists() || saleSnapshot.data()?.status === 'locked') return
      const lockedAt = new Date().toISOString()
      productSnapshots.forEach((snapshot: any, index: number) => {
        const item = productRefs[index].item
        const stock = Number(snapshot.data()?.stokPcs) || 0
        const deduction = Number(item.jumlah) || 0
        if (stock < deduction)
          throw new Error(`${item.nama || 'Produk'} tidak memiliki stok yang cukup.`)
        transaction.update(productRefs[index].ref, {
          stokPcs: stock - deduction,
          updatedAt: lockedAt,
        })
      })
      transaction.update(saleRef, { status: 'locked', lockedAt })
    })
    await load()
    await Swal.fire({
      title: 'Transaksi dikunci',
      text: 'Stok produk berhasil diperbarui.',
      icon: 'success',
      confirmButtonColor: '#2563eb',
    })
  } catch (error: any) {
    await Swal.fire({
      title: 'Gagal mengunci transaksi',
      text: error?.message || 'Coba lagi.',
      icon: 'error',
      confirmButtonColor: '#2563eb',
    })
  }
}
onMounted(load)
</script>
