<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">TRANSAKSI PEMBELIAN</p>
        <h1>Purchase Order</h1>
        <p class="page-description">
          Catat pembelian dari pemasok dan kunci transaksi untuk menambah stok.
        </p>
      </div>
      <button class="button button-primary" type="button" @click="openForm">＋ Buat PO</button>
    </div>
    <section class="panel product-panel">
      <div class="toolbar">
        <div>
          <h2>Daftar Purchase Order</h2>
          <p>{{ filteredOrders.length }} dari {{ orders.length }} transaksi</p>
        </div>
      </div>
      <div v-if="loading" class="table-state">Memuat transaksi...</div>
      <div v-else-if="!orders.length" class="table-state">
        <strong>Belum ada purchase order</strong
        ><span>Buat PO pertama untuk mencatat pembelian barang.</span
        ><button class="button button-primary" type="button" @click="openForm">Buat PO</button>
      </div>
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
            <input v-model="searchQuery" type="search" placeholder="Cari purchase order..." />
          </label>
        </div>
        <div class="table-wrap">
        <table class="data-table purchase-table">
          <thead>
            <tr>
              <th :aria-sort="sortAria('nomor')"><button class="data-table-sort" type="button" @click="toggleSort('nomor')">Nomor PO <span>{{ sortIndicator('nomor') }}</span></button></th>
              <th :aria-sort="sortAria('tanggal')"><button class="data-table-sort" type="button" @click="toggleSort('tanggal')">Tanggal <span>{{ sortIndicator('tanggal') }}</span></button></th>
              <th :aria-sort="sortAria('pemasok')"><button class="data-table-sort" type="button" @click="toggleSort('pemasok')">Pemasok <span>{{ sortIndicator('pemasok') }}</span></button></th>
              <th :aria-sort="sortAria('items')"><button class="data-table-sort" type="button" @click="toggleSort('items')">Item <span>{{ sortIndicator('items') }}</span></button></th>
              <th :aria-sort="sortAria('total')"><button class="data-table-sort" type="button" @click="toggleSort('total')">Total <span>{{ sortIndicator('total') }}</span></button></th>
              <th :aria-sort="sortAria('status')"><button class="data-table-sort" type="button" @click="toggleSort('status')">Status <span>{{ sortIndicator('status') }}</span></button></th>
              <th>Aksi</th>
            </tr>
            <tr class="data-table-column-filters">
              <th><input v-model="columnFilters.nomor" aria-label="Cari nomor PO" placeholder="Cari nomor" /></th>
              <th><input v-model="columnFilters.tanggal" aria-label="Cari tanggal PO" placeholder="Cari tanggal" /></th>
              <th><input v-model="columnFilters.pemasok" aria-label="Cari pemasok" placeholder="Cari pemasok" /></th>
              <th><input v-model="columnFilters.items" aria-label="Cari jumlah item" placeholder="Cari item" /></th>
              <th><input v-model="columnFilters.total" aria-label="Cari total PO" placeholder="Cari total" /></th>
              <th>
                <select v-model="columnFilters.status" aria-label="Filter status PO">
                  <option value="all">Semua status</option>
                  <option value="draft">Draft</option>
                  <option value="locked">Terkunci</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in paginatedOrders" :key="order.id">
              <td>
                <strong>{{ order.nomor }}</strong
                ><small class="table-subtext">{{ order.catatan || 'Tanpa catatan' }}</small>
              </td>
              <td>{{ formatDate(order.tanggal) }}</td>
              <td>{{ order.pemasok || '-' }}</td>
              <td>{{ order.items?.length || 0 }} barang</td>
              <td class="price-cell">{{ formatRupiah(order.total) }}</td>
              <td>
                <span
                  :class="[
                    'status-badge',
                    order.status === 'locked' ? 'status-locked' : 'status-draft',
                  ]"
                  >{{ order.status === 'locked' ? 'Terkunci' : 'Draft' }}</span
                >
              </td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="order.status !== 'locked'"
                    class="action-button edit-action"
                    type="button"
                    @click="editOrder(order)"
                  >
                    Edit</button
                  ><button
                    v-if="order.status !== 'locked'"
                    class="action-button lock-action"
                    type="button"
                    @click="lockOrder(order)"
                  >
                    Kunci</button
                  ><button
                    class="action-button view-action"
                    type="button"
                    @click="viewOrder(order)"
                  >
                    Detail
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!paginatedOrders.length">
              <td colspan="7" class="empty-cell">Tidak ada purchase order yang cocok dengan pencarian.</td>
            </tr>
          </tbody>
        </table>
        </div>
        <div class="data-table-footer">
          <p>Menampilkan {{ firstRow }} sampai {{ lastRow }} dari {{ filteredOrders.length }} transaksi</p>
          <div class="data-table-pagination" aria-label="Navigasi halaman purchase order">
            <button type="button" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button>
            <span>Halaman {{ currentPage }} dari {{ pageCount }}</span>
            <button type="button" :disabled="currentPage >= pageCount" @click="currentPage++">Berikutnya</button>
          </div>
        </div>
      </div>
    </section>
    <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
      <section class="modal-card purchase-modal">
        <header class="modal-header">
          <div>
            <p class="eyebrow">FORM PEMBELIAN</p>
            <h2>{{ editingOrder ? 'Edit Purchase Order' : 'Buat Purchase Order' }}</h2>
            <p>Tambahkan beberapa barang dalam satu transaksi.</p>
          </div>
          <button class="modal-close" type="button" @click="closeForm">×</button>
        </header>
        <form class="modal-form purchase-form" @submit.prevent="saveOrder">
          <div class="form-grid">
            <label class="field"
              ><span>Tanggal Pembelian</span
              ><input v-model="form.tanggal" type="date" required /></label
            ><label class="field"
              ><span>Pemasok</span
              ><input v-model="form.pemasok" placeholder="Nama pemasok (opsional)" /></label
            ><label class="field field-wide"
              ><span>Catatan</span
              ><input v-model="form.catatan" placeholder="Catatan pembelian (opsional)"
            /></label>
          </div>
          <div class="purchase-items-heading">
            <div>
              <h3>Daftar Barang</h3>
              <p>Pilih master produk, lalu sesuaikan jumlah dan harga jika diperlukan.</p>
            </div>
            <button class="button button-secondary" type="button" @click="addItem">
              ＋ Tambah Barang
            </button>
          </div>
          <div class="purchase-items">
            <div v-for="(item, index) in form.items" :key="item.key" class="purchase-item">
              <div class="item-number">{{ index + 1 }}</div>
              <label class="field item-product"
                ><span>Produk</span
                ><select v-model="item.produkId" required @change="applyProduct(item)">
                  <option value="" disabled>Pilih produk</option>
                  <option v-for="product in products" :key="product.id" :value="product.id">
                    {{ product.nama }} — {{ product.satuan }}
                  </option>
                </select></label
              ><label class="field item-quantity"
                ><span>Jumlah ({{ getProduct(item)?.satuan || 'satuan' }})</span
                ><input v-model.number="item.jumlah" type="number" min="1" required /></label
              ><label class="field item-price"
                ><span>Harga / Satuan</span
                ><input
                  v-model.number="item.hargaSatuan"
                  type="number"
                  min="0"
                  required
                  @input="item.manualPrice = true"
                /><small v-if="isPriceDifferent(item)" class="price-alert"
                  >Harga berbeda dari master ({{
                    formatRupiah(getProduct(item)?.hargaBeli)
                  }})</small
                ></label
              >
              <div class="item-total">{{ formatRupiah(item.jumlah * item.hargaSatuan) }}</div>
              <button
                v-if="form.items.length > 1"
                class="remove-item"
                type="button"
                aria-label="Hapus barang"
                @click="removeItem(index)"
              >
                ×
              </button>
            </div>
          </div>
          <div class="purchase-total">
            <span>Total Harga PO</span><strong>{{ formatRupiah(formTotal) }}</strong>
          </div>
          <footer class="modal-footer">
            <button class="button button-secondary" type="button" @click="closeForm">Batal</button
            ><button class="button button-primary" type="submit" :disabled="saving">
              {{ saving ? 'Menyimpan...' : 'Simpan Draft' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
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
        <div class="receipt-paper" id="purchase-receipt">
          <div class="receipt-brand">
            <strong>WARUNG SEMBAKO</strong><span>Bukti Pembelian</span>
          </div>
          <div class="receipt-meta">
            <div>
              <span>Nomor PO</span><strong>{{ detailOrder.nomor }}</strong>
            </div>
            <div>
              <span>Tanggal</span><strong>{{ formatDate(detailOrder.tanggal) }}</strong>
            </div>
            <div>
              <span>Pemasok</span><strong>{{ detailOrder.pemasok || '-' }}</strong>
            </div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-items">
            <div v-for="item in detailOrder.items" :key="item.produkId" class="receipt-item">
              <div>
                <strong>{{ item.nama }}</strong
                ><small
                  >{{ item.jumlah }} {{ item.satuan }} × {{ formatRupiah(item.hargaSatuan) }}</small
                >
              </div>
              <strong>{{ formatRupiah(item.jumlah * item.hargaSatuan) }}</strong>
            </div>
          </div>
          <div class="receipt-divider"></div>
          <div class="receipt-total">
            <span>Total Pembelian</span><strong>{{ formatRupiah(detailOrder.total) }}</strong>
          </div>
          <div class="receipt-status">
            {{ detailOrder.status === 'locked' ? 'TRANSAKSI TERKUNCI' : 'DRAFT TRANSAKSI' }}
          </div>
          <p v-if="detailOrder.catatan" class="receipt-note">Catatan: {{ detailOrder.catatan }}</p>
          <p class="receipt-thanks">Terima kasih telah menggunakan Warung Sembako</p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { addDoc, collection, doc, getDocs, orderBy, query, runTransaction, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import { authState } from '@/auth'

const router = useRouter()
type PurchaseOrderRow = {
  id: string
  nomor?: string
  tanggal?: string
  pemasok?: string
  catatan?: string
  items?: unknown[]
  total?: number | string
  status?: string
}
const orders = ref<PurchaseOrderRow[]>([])
const products = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showForm = ref(false)
const editingOrder = ref<any | null>(null)
const detailOrder = ref<any | null>(null)
const searchQuery = ref('')
const pageSize = ref(10)
const currentPage = ref(1)
type PurchaseOrderSortColumn = 'nomor' | 'tanggal' | 'pemasok' | 'items' | 'total' | 'status'
const sortColumn = ref<PurchaseOrderSortColumn>('tanggal')
const sortDirection = ref<'asc' | 'desc'>('desc')
const columnFilters = reactive({
  nomor: '',
  tanggal: '',
  pemasok: '',
  items: '',
  total: '',
  status: 'all',
})
const form = ref<any>({
  tanggal: new Date().toISOString().slice(0, 10),
  pemasok: '',
  catatan: '',
  items: [],
})

const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase('id')
const formTotal = computed(() =>
  form.value.items.reduce(
    (total: number, item: any) =>
      total + (Number(item.jumlah) || 0) * (Number(item.hargaSatuan) || 0),
    0,
  ),
)
const getProduct = (item: any) => products.value.find((product) => product.id === item.produkId)
const formatRupiah = (value: number | string | null | undefined) =>
  value
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(value))
    : 'Rp 0'
const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
        new Date(`${value}T00:00:00`),
      )
    : '-'
const orderItemCount = (order: PurchaseOrderRow) => order.items?.length || 0
const filteredOrders = computed(() => {
  const globalQuery = normalize(searchQuery.value)
  return orders.value.filter((order) => {
    const itemCount = orderItemCount(order)
    const total = Number(order.total) || 0
    const fields = {
      nomor: `${order.nomor || ''} ${order.catatan || ''}`,
      tanggal: `${order.tanggal || ''} ${formatDate(order.tanggal)}`,
      pemasok: order.pemasok || '-',
      items: `${itemCount} barang ${itemCount}`,
      total: `${formatRupiah(total)} ${total}`,
      status: order.status === 'locked' ? 'Terkunci locked' : 'Draft draft',
    }
    const matchesGlobal = !globalQuery || normalize(Object.values(fields).join(' ')).includes(globalQuery)
    const matchesColumns = Object.entries(columnFilters).every(([column, filter]) => {
      if (column === 'status' && filter === 'all') return true
      const fieldValue = fields[column as keyof typeof fields]
      return !normalize(filter) || normalize(fieldValue).includes(normalize(filter))
    })
    return matchesGlobal && matchesColumns
  })
})
const sortValue = (order: PurchaseOrderRow, column: PurchaseOrderSortColumn) => {
  if (column === 'tanggal') return String(order.tanggal || '')
  if (column === 'items') return orderItemCount(order)
  if (column === 'total') return Number(order.total) || 0
  if (column === 'pemasok') return String(order.pemasok || '')
  if (column === 'status') return order.status === 'locked' ? 'Terkunci' : 'Draft'
  return String(order.nomor || '')
}
const sortedOrders = computed(() => [...filteredOrders.value].sort((first, second) => {
  const firstValue = sortValue(first, sortColumn.value)
  const secondValue = sortValue(second, sortColumn.value)
  const comparison = typeof firstValue === 'number' && typeof secondValue === 'number'
    ? firstValue - secondValue
    : String(firstValue).localeCompare(String(secondValue), 'id', { numeric: true, sensitivity: 'base' })
  return sortDirection.value === 'asc' ? comparison : -comparison
}))
const pageCount = computed(() => Math.max(1, Math.ceil(filteredOrders.value.length / pageSize.value)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedOrders.value.slice(start, start + pageSize.value)
})
const firstRow = computed(() => filteredOrders.value.length ? (currentPage.value - 1) * pageSize.value + 1 : 0)
const lastRow = computed(() => Math.min(currentPage.value * pageSize.value, filteredOrders.value.length))
const sortIndicator = (column: PurchaseOrderSortColumn) => sortColumn.value === column ? (sortDirection.value === 'asc' ? '↑' : '↓') : '↕'
const sortAria = (column: PurchaseOrderSortColumn) => sortColumn.value !== column ? 'none' : sortDirection.value === 'asc' ? 'ascending' : 'descending'
const toggleSort = (column: PurchaseOrderSortColumn) => {
  if (sortColumn.value === column) sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  else { sortColumn.value = column; sortDirection.value = 'asc' }
}
watch([searchQuery, pageSize, columnFilters], () => { currentPage.value = 1 }, { deep: true })
const isPriceDifferent = (item: any) => {
  const product = getProduct(item)
  return Boolean(
    product && item.manualPrice && Number(item.hargaSatuan) !== Number(product.hargaBeli),
  )
}
const newItem = () => ({
  key: `${Date.now()}-${Math.random()}`,
  produkId: '',
  jumlah: 1,
  hargaSatuan: 0,
  manualPrice: false,
})
const addItem = () => form.value.items.push(newItem())
const removeItem = (index: number) => form.value.items.splice(index, 1)
const applyProduct = (item: any) => {
  const product = getProduct(item)
  if (product) {
    item.hargaSatuan = Number(product.hargaBeli) || 0
    item.manualPrice = false
  }
}
const basePath = () => `warungs/${authState.warungId}`

const loadData = async () => {
  if (!authState.warungId) return
  loading.value = true
  try {
    const [productSnapshot, orderSnapshot] = await Promise.all([
      getDocs(collection(db, basePath(), 'produk')),
      getDocs(query(collection(db, basePath(), 'purchaseOrders'), orderBy('tanggal', 'desc'))),
    ])
    products.value = productSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    orders.value = orderSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PurchaseOrderRow)
    currentPage.value = 1
  } finally {
    loading.value = false
  }
}
const openForm = () => router.push('/pembelian/baru')
const editOrder = (order: any) => router.push(`/pembelian/${order.id}/edit`)
const closeForm = () => {
  showForm.value = false
  editingOrder.value = null
}
const saveOrder = async () => {
  if (
    !authState.warungId ||
    form.value.items.some((item: any) => !item.produkId || item.jumlah < 1)
  )
    return
  saving.value = true
  try {
    const items = form.value.items.map((item: any) => {
      const product = getProduct(item)
      return {
        produkId: product.id,
        nama: product.nama,
        satuan: product.satuan,
        unitPerSatuan: Number(product.unit) || 1,
        jumlah: Number(item.jumlah),
        hargaSatuan: Number(item.hargaSatuan),
        subtotal: Number(item.jumlah) * Number(item.hargaSatuan),
      }
    })
    const payload = {
      tanggal: form.value.tanggal,
      pemasok: form.value.pemasok.trim(),
      catatan: form.value.catatan.trim(),
      items,
      total: formTotal.value,
      status: 'draft',
      createdAt: editingOrder.value?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    if (editingOrder.value)
      await updateDoc(doc(db, basePath(), 'purchaseOrders', editingOrder.value.id), payload)
    else await addDoc(collection(db, basePath(), 'purchaseOrders'), payload)
    closeForm()
    await loadData()
    await Swal.fire({
      title: 'Draft tersimpan',
      icon: 'success',
      timer: 1300,
      showConfirmButton: false,
    })
  } finally {
    saving.value = false
  }
}
const lockOrder = async (order: any) => {
  const hasUnknownConversion = order.items.some((item: any) => item.konversiBelumDiketahui)
  const confirm = await Swal.fire({
    title: 'Kunci purchase order?',
    text: hasUnknownConversion
      ? 'Jika konversi masih belum diketahui saat dikunci, stok menggunakan asumsi 1 satuan pembelian = 1 pcs. Konversi yang sudah dilengkapi di master akan digunakan. Jika konversi baru diketahui setelah PO dikunci, stok perlu dikoreksi manual.'
      : 'Setelah dikunci, PO tidak dapat diedit dan stok akan bertambah dalam pcs.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, kunci transaksi',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#2563eb',
  })
  if (!confirm.isConfirmed || !authState.warungId) return
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, basePath(), 'purchaseOrders', order.id)
      const fresh = await transaction.get(orderRef)
      if (!fresh.exists() || fresh.data()?.status === 'locked') return
      const freshItems = (fresh.data()?.items || []) as any[]
      if (!freshItems.length) throw new Error('Purchase order tidak memiliki barang.')
      const groupedItems = new Map<
        string,
        { ref: ReturnType<typeof doc>; lines: { item: any; index: number }[] }
      >()
      freshItems.forEach((item, index) => {
        const group = groupedItems.get(item.produkId) || {
          ref: doc(db, basePath(), 'produk', item.produkId),
          lines: [],
        }
        group.lines.push({ item, index })
        groupedItems.set(item.produkId, group)
      })
      const productRefs = [...groupedItems.values()]
      const productSnapshots = await Promise.all(productRefs.map(({ ref }) => transaction.get(ref)))
      const lockedAt = new Date().toISOString()
      const lockedItems = [...freshItems]
      productSnapshots.forEach((snapshot: any, index: number) => {
        const { lines, ref } = productRefs[index]
        if (!snapshot.exists())
          throw new Error(`Produk ${lines[0].item.nama || lines[0].item.produkId} tidak ditemukan.`)
        const currentStock = Number(snapshot.data()?.stokPcs) || 0
        const currentUnit = Number(snapshot.data()?.unit)
        let addedStock = 0
        let correctionNeeded = false
        for (const { item, index: itemIndex } of lines) {
          const conversionUnknown = Boolean(item.konversiBelumDiketahui && !(currentUnit > 0))
          const unitPerSatuan =
            item.konversiBelumDiketahui && currentUnit > 0
              ? currentUnit
              : Number(item.unitPerSatuan) || 1
          addedStock += Number(item.jumlah) * unitPerSatuan
          correctionNeeded ||= conversionUnknown
          lockedItems[itemIndex] = {
            ...item,
            unitPerSatuan,
            konversiBelumDiketahui: conversionUnknown,
          }
        }
        transaction.update(ref, {
          stokPcs: currentStock + addedStock,
          ...(correctionNeeded ? { koreksiStokManual: true } : {}),
          updatedAt: lockedAt,
        })
      })
      transaction.update(orderRef, { items: lockedItems, status: 'locked', lockedAt })
    })
    await loadData()
    await Swal.fire({
      title: 'Transaksi dikunci',
      text: hasUnknownConversion
        ? 'Konversi yang belum diketahui memakai asumsi 1 satuan = 1 pcs. Jika baru dilengkapi setelah ini, lakukan koreksi stok manual.'
        : 'Stok produk berhasil diperbarui.',
      icon: 'success',
      confirmButtonColor: '#2563eb',
    })
  } catch (error: any) {
    await Swal.fire({
      title: 'Gagal mengunci PO',
      text: error?.message || 'Coba lagi.',
      icon: 'error',
      confirmButtonColor: '#2563eb',
    })
  }
}
const viewOrder = (order: any) => {
  detailOrder.value = order
}
const printReceipt = () => window.print()
onMounted(loadData)
</script>
