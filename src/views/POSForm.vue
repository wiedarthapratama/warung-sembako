<template>
  <section class="page-content pos-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">TRANSAKSI PENJUALAN</p>
        <h1>{{ editing ? 'Edit Transaksi' : 'Transaksi Baru' }}</h1>
        <p class="page-description">Lengkapi detail pelanggan, barang, dan pembayaran.</p>
      </div>
      <button class="button button-secondary" type="button" @click="router.push('/pos')">
        Kembali
      </button>
    </div>

    <form class="pos-layout" @submit.prevent="save()">
      <!-- KOLOM KIRI: info + produk -->
      <div class="pos-main">
        <div class="pos-card">
          <h3 class="pos-card-title">Informasi Transaksi</h3>
          <div class="pos-info-grid">
            <label class="field">
              <span>Nomor Transaksi</span>
              <input v-model="form.nomor" disabled />
            </label>
            <label class="field">
              <span>Tanggal</span>
              <input v-model="form.tanggal" type="date" required />
            </label>
            <label class="field">
              <span>Pelanggan <small>(optional)</small></span>
              <input
                v-model="form.pelangganNama"
                list="customer-options"
                placeholder="Umum atau pilih pelanggan"
                @change="selectCustomer"
              />
              <datalist id="customer-options">
                <option v-for="customer in customers" :key="customer.id" :value="customer.nama" />
              </datalist>
            </label>
            <div class="field">
              <span>Metode Pembayaran</span>
              <div class="pay-methods" role="radiogroup" aria-label="Metode pembayaran">
                <button
                  v-for="method in paymentMethods"
                  :key="method.value"
                  type="button"
                  role="radio"
                  class="pay-method"
                  :class="{ 'pay-method-active': form.metodePembayaran === method.value }"
                  :aria-checked="form.metodePembayaran === method.value"
                  @click="form.metodePembayaran = method.value"
                >
                  {{ method.label }}
                </button>
              </div>
            </div>
            <label class="field field-wide">
              <span>Catatan / Keterangan</span>
              <textarea v-model="form.catatan" rows="2" placeholder="Catatan transaksi" />
            </label>
          </div>
        </div>

        <div class="pos-card">
          <div class="pos-card-head">
            <div>
              <h3 class="pos-card-title">Daftar Produk</h3>
              <p class="pos-hint">Cari produk manual atau scan barcode.</p>
            </div>
            <button class="button button-secondary" type="button" @click="addItem()">
              + Produk
            </button>
          </div>

          <div class="pos-scan-row">
            <div class="barcode-input-wrap">
              <input
                v-model="barcode"
                inputmode="numeric"
                placeholder="Scan / masukkan barcode produk"
                @keyup.enter.prevent="scanProduct"
              />
              <button
                class="barcode-scan-button"
                type="button"
                aria-label="Buka kamera scanner"
                @click="startScanner"
              >
                ⌁
              </button>
            </div>
            <button class="button button-secondary" type="button" @click="scanProduct">Cari</button>
          </div>

          <div ref="purchaseItemsContainer" class="purchase-items">
            <div v-for="(item, index) in form.items" :key="item.key" class="purchase-item">
              <span class="item-number">{{ index + 1 }}</span>

              <div class="field item-product">
                <span>Produk</span>
                <div class="product-search">
                  <input
                    :value="item.productDropdownOpen ? item.productSearch : getProductLabel(item)"
                    class="purchase-product-search"
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    :aria-expanded="Boolean(item.productDropdownOpen)"
                    :aria-controls="productListId(item)"
                    :aria-activedescendant="
                      item.productDropdownOpen && item.productActiveIndex >= 0
                        ? productOptionId(item, item.productActiveIndex)
                        : undefined
                    "
                    :required="!item.produkId"
                    autocomplete="off"
                    placeholder="Cari atau pilih produk"
                    @focus="openProductDropdown(item)"
                    @input="filterProducts(item, $event)"
                    @keydown="handleProductKeydown(item, $event)"
                    @blur="closeProductDropdown(item)"
                  />
                  <div
                    v-if="item.productDropdownOpen"
                    :id="productListId(item)"
                    class="product-search-options"
                    role="listbox"
                  >
                    <button
                      v-for="(product, productIndex) in filteredProducts(item)"
                      :id="productOptionId(item, productIndex)"
                      :key="product.id"
                      class="product-search-option"
                      :class="{
                        'product-search-option-active': productIndex === item.productActiveIndex,
                      }"
                      type="button"
                      role="option"
                      :aria-selected="product.id === item.produkId"
                      @mousedown.prevent
                      @click="selectProduct(item, product)"
                    >
                      <span>{{ product.nama }}</span>
                    </button>
                    <p v-if="filteredProducts(item).length === 0" class="product-search-empty">
                      {{
                        item.productSearch.trim()
                          ? 'Produk tidak ditemukan.'
                          : 'Belum ada produk di master.'
                      }}
                    </p>
                  </div>
                </div>
                <small v-if="item.produkId" class="item-price">
                  @ {{ formatRupiah(item.hargaJualUnit) }}
                </small>
              </div>

              <div class="field item-quantity">
                <span>Jumlah</span>
                <div class="qty-stepper">
                  <button
                    type="button"
                    aria-label="Kurangi"
                    @click="item.jumlah = Math.max(1, Number(item.jumlah || 1) - 1)"
                  >
                    −
                  </button>
                  <input v-model.number="item.jumlah" min="1" type="number" inputmode="numeric" />
                  <button
                    type="button"
                    aria-label="Tambah"
                    @click="item.jumlah = Number(item.jumlah || 0) + 1"
                  >
                    +
                  </button>
                </div>
              </div>

              <div class="item-total">
                <span>Subtotal</span>
                <strong>{{ formatRupiah(item.jumlah * item.hargaJualUnit) }}</strong>
              </div>

              <button
                class="remove-item"
                type="button"
                aria-label="Hapus produk"
                @click="removeItem(index)"
              >
                ×
              </button>
            </div>
          </div>

          <button class="button button-secondary purchase-add-more" type="button" @click="addItem()">
            + Tambah Produk Berikutnya
          </button>
        </div>
      </div>

      <!-- KOLOM KANAN: ringkasan & pembayaran (sticky) -->
      <aside class="pos-summary">
        <div class="sales-total-row">
          <span>Total Penjualan</span>
          <strong>{{ formatRupiah(total) }}</strong>
        </div>

        <div v-if="form.metodePembayaran === 'cash'" class="cash-input-row">
          <label class="field">
            <span>Jumlah Bayar</span>
            <input
              v-model.number="form.jumlahBayar"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              placeholder="0"
            />
          </label>
          <label class="field">
            <span>Kembalian</span>
            <input :value="formatRupiah(kembalian)" disabled />
          </label>
        </div>

        <p v-if="errorMessage" class="profile-message error">{{ errorMessage }}</p>

        <div class="form-actions">
          <button class="button button-secondary" type="button" @click="router.push('/pos')">
            Batal
          </button>
          <button class="button button-primary" type="submit" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan sebagai Draft' }}
          </button>
        </div>
      </aside>

      <div v-if="showScanner" class="scanner-overlay" @click.self="stopScanner">
        <div class="scanner-card">
          <div class="scanner-card-heading">
            <div>
              <p class="eyebrow">SCAN BARCODE</p>
              <h3>Pindai Produk</h3>
            </div>
            <button class="modal-close" type="button" @click="stopScanner">×</button>
          </div>
          <p>Arahkan kamera ke barcode produk. Produk akan ditambahkan otomatis.</p>
          <video ref="videoRef" class="scanner-video" playsinline muted></video>
          <button
            class="button button-secondary scanner-close-button"
            type="button"
            @click="stopScanner"
          >
            Tutup Kamera
          </button>
        </div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { addDoc, collection, doc, getDocs, getDoc, updateDoc } from 'firebase/firestore'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'

const router = useRouter()
const route = useRoute()
const products = ref<any[]>([])
const customers = ref<any[]>([])
const saving = ref(false)
const errorMessage = ref('')
const barcode = ref('')
const showScanner = ref(false)
const scannerStarting = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const purchaseItemsContainer = ref<HTMLElement | null>(null)
const editing = computed(() => Boolean(route.params.id))
const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'qris', label: 'QRIS' },
  { value: 'utang', label: 'Utang' },
]
const form = ref<any>({
  nomor: `POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`,
  tanggal: new Date().toISOString().slice(0, 10),
  pelangganId: '',
  pelangganNama: '',
  metodePembayaran: 'cash',
  jumlahBayar: 0,
  kembalian: 0,
  catatan: '',
  items: [],
})
let scannerControls: IScannerControls | null = null
let scannerSession = 0

const base = () => `warungs/${authState.warungId}`
const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
const total = computed(() =>
  form.value.items.reduce(
    (sum: number, item: any) => sum + Number(item.jumlah || 0) * Number(item.hargaJualUnit || 0),
    0,
  ),
)
const kembalian = computed(() => Math.max(0, Number(form.value.jumlahBayar || 0) - total.value))
const addItem = async (scrollToNewItem = true) => {
  form.value.items.push({
    key: `${Date.now()}-${Math.random()}`,
    produkId: '',
    productSearch: '',
    productDropdownOpen: false,
    productActiveIndex: -1,
    nama: '',
    jumlah: 1,
    hargaJualUnit: 0,
  })
  if (!scrollToNewItem) return
  await nextTick()
  const newRow = purchaseItemsContainer.value?.lastElementChild as HTMLElement | null
  newRow?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  newRow?.querySelector<HTMLInputElement>('.purchase-product-search')?.focus()
}
const removeItem = (index: number) => form.value.items.splice(index, 1)
const getProduct = (item: any) => products.value.find((product) => product.id === item.produkId)
const getProductLabel = (item: any) => getProduct(item)?.nama || ''
const productListId = (item: any) => `pos-product-list-${String(item.key).replace(/[^a-zA-Z0-9_-]/g, '')}`
const productOptionId = (item: any, index: number) => `${productListId(item)}-option-${index}`
const filteredProducts = (item: any) => {
  const query = String(item.productSearch || '').trim().toLocaleLowerCase('id')
  return products.value.filter((product) =>
    String(product.nama || '').toLocaleLowerCase('id').includes(query),
  )
}
const openProductDropdown = (item: any) => {
  item.productSearch = ''
  item.productDropdownOpen = true
  item.productActiveIndex = -1
}
const filterProducts = (item: any, event: Event) => {
  item.produkId = ''
  item.productSearch = (event.target as HTMLInputElement).value
  item.productDropdownOpen = true
  item.productActiveIndex = -1
}
const closeProductDropdown = (item: any) => {
  item.productDropdownOpen = false
  item.productActiveIndex = -1
  if (!item.produkId) item.productSearch = ''
}
const selectProduct = (item: any, product: any) => {
  item.produkId = product.id
  item.productSearch = ''
  item.productDropdownOpen = false
  item.productActiveIndex = -1
  syncProduct(item)
}
const handleProductKeydown = (item: any, event: KeyboardEvent) => {
  const count = filteredProducts(item).length
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    item.productDropdownOpen = true
    item.productActiveIndex = Math.min((item.productActiveIndex ?? -1) + 1, count - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    item.productActiveIndex = Math.max((item.productActiveIndex ?? 0) - 1, 0)
  } else if (event.key === 'Enter' && item.productDropdownOpen && count > 0) {
    event.preventDefault()
    selectProduct(item, filteredProducts(item)[Math.max(item.productActiveIndex, 0)])
  } else if (event.key === 'Escape') {
    closeProductDropdown(item)
  }
}
const syncProduct = (item: any) => {
  const product = products.value.find((value) => value.id === item.produkId)
  if (product) {
    item.nama = product.nama
    item.hargaJualUnit = Number(product.hargaJualReal || product.hargaJualPerUnit || 0)
  }
}
const selectCustomer = () => {
  const customer = customers.value.find((value) => value.nama === form.value.pelangganNama)
  form.value.pelangganId = customer?.id || ''
}

const stopScanner = () => {
  scannerSession += 1
  scannerControls?.stop()
  scannerControls = null
  const stream = videoRef.value?.srcObject as MediaStream | null
  stream?.getTracks().forEach((track) => track.stop())
  if (videoRef.value) videoRef.value.srcObject = null
  showScanner.value = false
}

const scanProductWithIncrement = (incrementExisting: boolean) => {
  const product = products.value.find((value) => value.barcode === barcode.value)
  if (!product) {
    errorMessage.value = 'Produk dengan barcode tersebut tidak ditemukan.'
    barcode.value = ''
    return
  }

  const existing = form.value.items.find((item: any) => item.produkId === product.id)
  if (existing) {
    if (incrementExisting) existing.jumlah += 1
  } else {
    addItem(false)
    const item = form.value.items.at(-1)
    item.produkId = product.id
    syncProduct(item)
  }
  barcode.value = ''
  errorMessage.value = ''
}
const scanProduct = () => scanProductWithIncrement(true)

const startScanner = async () => {
  if (scannerControls || scannerStarting.value) return
  if (!navigator.mediaDevices?.getUserMedia) {
    errorMessage.value = 'Pemindaian kamera memerlukan HTTPS dan browser yang mendukung kamera.'
    return
  }

  scannerStarting.value = true
  const session = ++scannerSession
  showScanner.value = true
  await nextTick()
  const video = videoRef.value
  if (!video || session !== scannerSession) {
    scannerStarting.value = false
    return
  }

  try {
    const reader = new BrowserMultiFormatReader()
    const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
      if (!result || session !== scannerSession) return
      const scannedBarcode = result.getText()
      stopScanner()
      barcode.value = scannedBarcode
      scanProductWithIncrement(false)
    })
    if (session !== scannerSession) {
      controls.stop()
      return
    }
    scannerControls = controls
  } catch (error) {
    if (session !== scannerSession) return
    showScanner.value = false
    errorMessage.value =
      error instanceof Error
        ? `Kamera tidak dapat dibuka: ${error.message}`
        : 'Kamera tidak dapat diakses. Pastikan izin kamera diberikan.'
  } finally {
    scannerStarting.value = false
  }
}

const save = async (lock = false) => {
  form.value.jumlahBayar =
    form.value.metodePembayaran === 'cash' ? Number(form.value.jumlahBayar || 0) : 0
  form.value.kembalian = form.value.metodePembayaran === 'cash' ? kembalian.value : 0
  if (form.value.metodePembayaran === 'cash' && form.value.jumlahBayar < total.value) {
    errorMessage.value = 'Jumlah bayar belum mencukupi total penjualan.'
    return
  }
  if (!form.value.items.length || form.value.items.some((item: any) => !item.produkId)) {
    errorMessage.value = 'Tambahkan minimal satu produk.'
    return
  }
  saving.value = true
  try {
    let customerId = form.value.pelangganId
    if (form.value.pelangganNama && !customerId) {
      const customer = await addDoc(collection(db, base(), 'customers'), {
        nama: form.value.pelangganNama.trim(),
        createdAt: new Date().toISOString(),
      })
      customerId = customer.id
    }
    const payload = {
      ...form.value,
      pelangganId: customerId,
      total: total.value,
      status: lock ? 'locked' : 'draft',
      createdAt: new Date().toISOString(),
    }
    if (editing.value) await updateDoc(doc(db, base(), 'sales', route.params.id as string), payload)
    else await addDoc(collection(db, base(), 'sales'), payload)
    await router.push('/pos')
  } catch (error: any) {
    errorMessage.value = error?.message || 'Gagal menyimpan transaksi.'
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(stopScanner)
onMounted(async () => {
  if (!authState.warungId) return
  const [productsSnapshot, customersSnapshot] = await Promise.all([
    getDocs(collection(db, base(), 'produk')),
    getDocs(collection(db, base(), 'customers')),
  ])
  const loadedProducts: { id: string; nama?: string }[] = productsSnapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }))
  products.value = loadedProducts
    .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { sensitivity: 'base' }))
  customers.value = customersSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  if (editing.value) {
    const snapshot = await getDoc(doc(db, base(), 'sales', route.params.id as string))
    if (snapshot.exists())
      form.value = {
        ...snapshot.data(),
        items: (snapshot.data().items || []).map((item: any) => ({
          ...item,
          key: `${Date.now()}-${Math.random()}`,
          productSearch: '',
          productDropdownOpen: false,
          productActiveIndex: -1,
        })),
      }
  } else {
    addItem(false)
  }
})
</script>

<style scoped>
.pos-page {
  --pos-primary: var(--primary, #2563eb);
  --pos-border: var(--border, #e2e8f0);
  --pos-bg: var(--surface, #ffffff);
  --pos-muted: var(--muted, #64748b);
  --pos-radius: 12px;
}

/* ---------- Layout ---------- */
.pos-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.pos-main {
  display: grid;
  gap: 16px;
  min-width: 0;
}
@media (min-width: 1024px) {
  .pos-layout {
    grid-template-columns: minmax(0, 1fr) 360px;
  }
  .pos-summary {
    position: sticky;
    top: 16px;
  }
}

/* ---------- Card ---------- */
.pos-card,
.pos-summary {
  background: var(--pos-bg);
  border: 1px solid var(--pos-border);
  border-radius: var(--pos-radius);
  padding: 16px;
}
.pos-card-title {
  margin: 0 0 12px;
  font-size: 1rem;
}
.pos-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.pos-card-head .pos-card-title {
  margin-bottom: 2px;
}
.pos-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--pos-muted);
}

/* ---------- Fields ---------- */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.field > span {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--pos-muted);
}
.field input,
.field select,
.field textarea,
.pos-scan-row input {
  width: 100%;
  min-height: 44px; /* target sentuh nyaman */
  padding: 10px 12px;
  font-size: 16px; /* cegah auto-zoom iOS */
  border: 1px solid var(--pos-border);
  border-radius: 10px;
  background: #fff;
  box-sizing: border-box;
}
.field textarea {
  resize: vertical;
}
.field input:focus,
.field textarea:focus,
.pos-scan-row input:focus {
  outline: 2px solid var(--pos-primary);
  outline-offset: -1px;
}
.field input:disabled {
  background: #f1f5f9;
  color: var(--pos-muted);
}

.pos-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.pos-info-grid .field-wide {
  grid-column: 1 / -1;
}
@media (min-width: 640px) {
  .pos-info-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* ---------- Metode bayar ---------- */
.pay-methods {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.pay-method {
  min-height: 44px;
  border: 1px solid var(--pos-border);
  border-radius: 10px;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
}
.pay-method-active {
  background: var(--pos-primary);
  border-color: var(--pos-primary);
  color: #fff;
}

/* ---------- Scan ---------- */
.pos-scan-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.barcode-input-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}
.barcode-input-wrap input {
  padding-right: 52px;
}
.barcode-scan-button {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 44px;
  height: 36px;
  border: 0;
  border-radius: 8px;
  background: #f1f5f9;
  font-size: 1.2rem;
  cursor: pointer;
}
.pos-scan-row .button {
  min-height: 44px;
}

/* ---------- Item ---------- */
.purchase-items {
  display: grid;
  gap: 10px;
}
.purchase-item {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  grid-template-areas:
    'num product remove'
    '.   qty     total';
  gap: 10px 12px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--pos-border);
  border-radius: 10px;
  background: #f8fafc;
}
.item-number {
  grid-area: num;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--pos-primary);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  align-self: center;
}
.item-product {
  grid-area: product;
}
.item-price {
  color: var(--pos-muted);
}
.item-quantity {
  grid-area: qty;
}
.item-total {
  grid-area: total;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.item-total span {
  font-size: 0.75rem;
  color: var(--pos-muted);
}
.item-total strong {
  font-size: 1.05rem;
}
.remove-item {
  grid-area: remove;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  align-self: center;
}

/* Stepper jumlah */
.qty-stepper {
  display: grid;
  grid-template-columns: 44px minmax(56px, 80px) 44px;
}
.qty-stepper button {
  min-height: 44px;
  border: 1px solid var(--pos-border);
  background: #fff;
  font-size: 1.3rem;
  cursor: pointer;
}
.qty-stepper button:first-child {
  border-radius: 10px 0 0 10px;
}
.qty-stepper button:last-child {
  border-radius: 0 10px 10px 0;
}
.qty-stepper input {
  border-radius: 0;
  text-align: center;
  padding-left: 4px;
  padding-right: 4px;
  -moz-appearance: textfield;
}
.qty-stepper input::-webkit-outer-spin-button,
.qty-stepper input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Desktop: satu baris per item */
@media (min-width: 768px) {
  .purchase-item {
    grid-template-columns: 28px minmax(0, 1fr) 190px 150px 40px;
    grid-template-areas: 'num product qty total remove';
  }
  .item-total {
    align-self: center;
  }
}

.purchase-add-more {
  width: 100%;
  min-height: 44px;
  margin-top: 12px;
  border-style: dashed;
}

/* ---------- Dropdown produk ---------- */
.product-search {
  position: relative;
}
.product-search-options {
  position: absolute;
  z-index: 30;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 260px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--pos-border);
  border-radius: 10px;
  box-shadow: 0 10px 25px rgb(15 23 42 / 0.15);
}
.product-search-option {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 15px;
  cursor: pointer;
}
.product-search-option:hover,
.product-search-option-active {
  background: #eff6ff;
}
.product-search-empty {
  margin: 0;
  padding: 12px;
  color: var(--pos-muted);
}

/* ---------- Ringkasan ---------- */
.pos-summary {
  display: grid;
  gap: 12px;
}
.sales-total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.sales-total-row span {
  color: var(--pos-muted);
  font-weight: 600;
}
.sales-total-row strong {
  font-size: 1.6rem;
  color: var(--pos-primary);
}
.cash-input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.form-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
}
.form-actions .button {
  min-height: 48px;
  font-weight: 600;
}
.profile-message.error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 0.9rem;
}

/* Mobile: ringkasan menempel di bawah layar */
@media (max-width: 1023px) {
  .pos-summary {
    position: sticky;
    bottom: 0;
    z-index: 20;
    margin: 0 -4px;
    border-radius: var(--pos-radius) var(--pos-radius) 0 0;
    box-shadow: 0 -6px 20px rgb(15 23 42 / 0.12);
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
  .sales-total-row strong {
    font-size: 1.35rem;
  }
}

/* ---------- Scanner ---------- */
.scanner-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(15 23 42 / 0.6);
}
.scanner-card {
  width: 100%;
  max-width: 480px;
  max-height: 100%;
  overflow-y: auto;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
}
.scanner-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.scanner-card-heading h3 {
  margin: 0;
}
.modal-close {
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 1.4rem;
  cursor: pointer;
}
.scanner-video {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  background: #0f172a;
}
.scanner-close-button {
  width: 100%;
  min-height: 44px;
  margin-top: 12px;
}
</style>