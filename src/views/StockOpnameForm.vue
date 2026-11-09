<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">INVENTAR</p><h1>{{ editingId ? 'Edit Stock Opname' : 'Tambah Stock Opname' }}</h1><p class="page-description">Catat stok nyata untuk satu atau beberapa produk dalam satu transaksi.</p></div>
      <button class="button button-secondary" type="button" @click="router.push('/stok-opname')">Kembali</button>
    </div>

    <form class="panel purchase-page-form" @submit.prevent="saveOpname">
      <div class="panel-header"><div><h2>Informasi Stock Opname</h2><p>Stok produk baru diperbarui setelah pencatatan dikunci.</p></div></div>
      <div class="purchase-form-body">
        <div class="form-grid">
          <label class="field"><span>Tanggal Stock Opname</span><input v-model="form.tanggal" type="date" required /></label>
          <label class="field field-wide"><span>Keterangan</span><textarea v-model="form.keterangan" rows="2" placeholder="Catatan pelaksanaan stock opname (opsional)" /></label>
        </div>

        <div class="purchase-items-heading">
          <div><h3>Daftar Produk</h3><p>Pilih produk dan masukkan jumlah fisik dalam pcs.</p></div>
          <button class="button button-secondary" type="button" :disabled="form.items.length >= products.length" @click="addItem">＋ Tambah Produk</button>
        </div>
        <div v-if="!products.length && !loading" class="table-state"><strong>Belum ada produk</strong><span>Tambahkan produk terlebih dahulu sebelum melakukan stock opname.</span></div>
        <div class="purchase-items">
          <div v-for="(item, index) in form.items" :key="item.key" class="purchase-item opname-item">
            <div class="item-number">{{ index + 1 }}</div>
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
                  :aria-activedescendant="item.productDropdownOpen && item.productActiveIndex >= 0 ? productOptionId(item, item.productActiveIndex) : undefined"
                  :required="!item.produkId"
                  autocomplete="off"
                  placeholder="Cari atau pilih produk"
                  @focus="openProductDropdown(item)"
                  @input="filterProducts(item, $event)"
                  @keydown="handleProductKeydown(item, $event)"
                  @blur="closeProductDropdown(item)"
                />
                <div v-if="item.productDropdownOpen" :id="productListId(item)" class="product-search-options" role="listbox">
                  <button
                    v-for="(product, productIndex) in matchingProducts(item)"
                    :id="productOptionId(item, productIndex)"
                    :key="product.id"
                    class="product-search-option"
                    :class="{ 'product-search-option-active': productIndex === item.productActiveIndex }"
                    type="button"
                    role="option"
                    :aria-selected="product.id === item.produkId"
                    :disabled="isProductSelected(product.id, index)"
                    @mousedown.prevent
                    @click="selectProduct(item, product)"
                  >
                    <span>{{ product.nama }}</span>
                    <small>{{ product.satuan || 'satuan' }}</small>
                  </button>
                  <p v-if="!matchingProducts(item).length" class="product-search-empty">
                    {{ item.productSearch.trim() ? 'Produk tidak ditemukan.' : 'Belum ada produk di master.' }}
                  </p>
                </div>
              </div>
            </div>
            <label class="field item-quantity"><span>Stok Real (pcs)</span><input :value="item.stokReal ?? ''" type="number" min="0" step="1" required placeholder="Jumlah fisik" @input="updateStockReal(item, $event)" /></label>
            <div class="field item-current-stock"><span>Saldo saat ini (pcs)</span><strong>{{ Number(getProduct(item)?.stokPcs) || 0 }} pcs</strong></div>
            <button v-if="form.items.length > 1" class="remove-item opname-remove-item" type="button" :aria-label="`Hapus ${getProduct(item)?.nama || 'produk'} dari daftar`" @click="removeItem(index)">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3.5h6M4.5 5.5h11m-9.5 0 .6 10h6.8l.6-10M8 8v5m4-5v5" /></svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>
        <button class="button button-secondary opname-add-next" type="button" :disabled="form.items.length >= products.length" @click="addItem">＋ Tambah Produk Berikutnya</button>

        <div v-if="errorMessage" class="profile-message error">{{ errorMessage }}</div>
        <div class="form-actions">
          <button class="button button-secondary" type="button" @click="router.push('/stok-opname')">Batal</button>
          <button class="button button-primary" type="submit" :disabled="saving || loading || !products.length">{{ saving ? 'Menyimpan...' : 'Simpan sebagai Draft' }}</button>
        </div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { addDoc, collection, doc, getDocs, getDoc, runTransaction } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'

const route = useRoute()
const router = useRouter()
type Product = { id: string; nama: string; satuan?: string; stokPcs?: number }
type OpnameItem = { key: string; produkId: string; stokReal: number | null; nama?: string; productSearch: string; productDropdownOpen: boolean; productActiveIndex: number }
type OpnameForm = { tanggal: string; keterangan: string; items: OpnameItem[] }

const products = ref<Product[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const editingId = computed(() => String(route.params.id || ''))
const form = ref<OpnameForm>({ tanggal: new Date().toISOString().slice(0, 10), keterangan: '', items: [] })
const sortedProducts = computed(() => [...products.value].sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id-ID', { sensitivity: 'base' })))
const basePath = () => `warungs/${authState.warungId}`
const newItem = (): OpnameItem => ({ key: `${Date.now()}-${Math.random()}`, produkId: '', stokReal: null, productSearch: '', productDropdownOpen: false, productActiveIndex: -1 })
const addItem = () => form.value.items.push(newItem())
const removeItem = (index: number) => form.value.items.splice(index, 1)
const getProduct = (item: OpnameItem) => products.value.find((product) => product.id === item.produkId)
const getProductLabel = (item: OpnameItem) => getProduct(item)?.nama || ''
const updateStockReal = (item: OpnameItem, event: Event) => {
  const value = (event.target as HTMLInputElement).value
  item.stokReal = value === '' ? null : Number(value)
}
const isProductSelected = (productId: string, currentIndex: number) => form.value.items.some((item, index) => index !== currentIndex && item.produkId === productId)
const productListId = (item: OpnameItem) => `opname-product-list-${item.key.replace(/[^a-zA-Z0-9_-]/g, '')}`
const productOptionId = (item: OpnameItem, index: number) => `${productListId(item)}-option-${index}`
const matchingProducts = (item: OpnameItem) => {
  const query = String(item.productSearch || '').trim().toLocaleLowerCase('id-ID')
  const currentIndex = form.value.items.indexOf(item)
  return sortedProducts.value.filter((product) =>
    !isProductSelected(product.id, currentIndex)
    && String(product.nama || '').toLocaleLowerCase('id-ID').includes(query),
  )
}
const openProductDropdown = (item: OpnameItem) => {
  item.productSearch = ''
  item.productDropdownOpen = true
  item.productActiveIndex = -1
}
const filterProducts = (item: OpnameItem, event: Event) => {
  item.produkId = ''
  item.productSearch = (event.target as HTMLInputElement).value
  item.productDropdownOpen = true
  item.productActiveIndex = -1
}
const closeProductDropdown = (item: OpnameItem) => {
  item.productDropdownOpen = false
  item.productActiveIndex = -1
  if (!item.produkId) item.productSearch = ''
}
const selectProduct = (item: OpnameItem, product: Product) => {
  item.produkId = product.id
  item.productSearch = ''
  item.productDropdownOpen = false
  item.productActiveIndex = -1
}
const handleProductKeydown = (item: OpnameItem, event: KeyboardEvent) => {
  const count = matchingProducts(item).length
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    item.productDropdownOpen = true
    item.productActiveIndex = Math.min(item.productActiveIndex + 1, count - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    item.productActiveIndex = count ? Math.max(item.productActiveIndex - 1, 0) : -1
  } else if (event.key === 'Enter' && item.productDropdownOpen && count > 0) {
    event.preventDefault()
    selectProduct(item, matchingProducts(item)[Math.max(item.productActiveIndex, 0)])
  } else if (event.key === 'Escape') {
    closeProductDropdown(item)
  }
}

const saveOpname = async () => {
  errorMessage.value = ''
  if (!authState.warungId || !form.value.tanggal || !form.value.items.length) return
  if (form.value.items.some((item) => !item.produkId || !Number.isInteger(item.stokReal) || Number(item.stokReal) < 0)) {
    errorMessage.value = 'Pilih produk dan isi stok real dengan bilangan bulat yang tidak negatif.'
    return
  }
  if (new Set(form.value.items.map((item) => item.produkId)).size !== form.value.items.length) {
    errorMessage.value = 'Produk yang sama tidak boleh ditambahkan lebih dari satu kali.'
    return
  }

  saving.value = true
  try {
    const items = form.value.items.map((item) => {
      const product = getProduct(item)
      if (!product) throw new Error('Salah satu produk tidak ditemukan. Muat ulang halaman lalu coba lagi.')
      return { produkId: product.id, nama: product.nama, stokReal: Number(item.stokReal) }
    })
    const updatedAt = new Date().toISOString()
    const payload = { tanggal: form.value.tanggal, keterangan: form.value.keterangan.trim(), items, status: 'draft', updatedAt }

    if (editingId.value) {
      const opnameRef = doc(db, basePath(), 'stockOpnames', editingId.value)
      await runTransaction(db, async (transaction) => {
        const fresh = await transaction.get(opnameRef)
        if (!fresh.exists()) throw new Error('Stock opname tidak ditemukan.')
        if (fresh.data().status !== 'draft') throw new Error('Stock opname sudah terkunci dan tidak dapat diedit.')
        transaction.update(opnameRef, { ...payload, createdAt: fresh.data().createdAt || updatedAt })
      })
    } else {
      await addDoc(collection(db, basePath(), 'stockOpnames'), { ...payload, createdAt: updatedAt })
    }

    await router.push('/stok-opname')
    await Swal.fire({ title: 'Draft tersimpan', icon: 'success', timer: 1300, showConfirmButton: false })
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal menyimpan stock opname.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!authState.warungId) { await router.replace('/stok-opname'); return }
  loading.value = true
  try {
    const productSnapshot = await getDocs(collection(db, basePath(), 'produk'))
    products.value = productSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product))
    if (editingId.value) {
      const opnameSnapshot = await getDoc(doc(db, basePath(), 'stockOpnames', editingId.value))
      if (!opnameSnapshot.exists() || opnameSnapshot.data().status !== 'draft') {
        await router.replace('/stok-opname')
        if (opnameSnapshot.exists()) await Swal.fire({ title: 'Stock opname terkunci', text: 'Data yang sudah terkunci tidak dapat diedit.', icon: 'info', confirmButtonColor: '#2563eb' })
        return
      }
      const data = opnameSnapshot.data()
      form.value = {
        tanggal: data.tanggal || new Date().toISOString().slice(0, 10),
        keterangan: data.keterangan || '',
        items: (data.items || []).map((item: Partial<OpnameItem>) => ({ ...newItem(), ...item, key: `${Date.now()}-${Math.random()}`, productSearch: '', productDropdownOpen: false, productActiveIndex: -1 })),
      }
    } else {
      addItem()
    }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat data stock opname.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.purchase-page-form .form-grid .field input, .purchase-page-form .form-grid .field textarea { width: 100%; border: 1px solid #dce2ea; border-radius: 5px; background: #fff; padding: 10px 11px; color: #354158; font: inherit; font-size: 12px; }
.purchase-page-form .form-grid .field input { height: 39px; }
.purchase-page-form .form-grid .field textarea { min-height: 70px; resize: vertical; }
.purchase-page-form .form-grid .field input:focus, .purchase-page-form .form-grid .field textarea:focus { border-color: #2f80ed; outline: 0; box-shadow: 0 0 0 3px #2f80ed14; }
.opname-item { grid-template-columns: 24px minmax(180px, 1fr) minmax(150px, .7fr) minmax(120px, .55fr) 92px; }
.opname-item .item-product input, .opname-item .item-quantity input { width: 100%; height: 39px; border: 1px solid #dce2ea; border-radius: 5px; background: #fff; padding: 0 10px; color: #354158; font: inherit; font-size: 12px; }
.opname-item .item-quantity input { padding: 0 10px; }
.opname-item .item-quantity input:focus { border-color: #2f80ed; outline: 0; box-shadow: 0 0 0 3px #2f80ed14; }
.opname-item .item-product input:focus { border-color: #2f80ed; outline: 0; box-shadow: 0 0 0 3px #2f80ed14; }
.opname-item .item-current-stock strong { display: block; min-height: 39px; padding: 11px 0; color: #354158; font-size: 12px; font-weight: 600; }
.opname-item .opname-remove-item { display: inline-flex; min-height: 36px; align-items: center; justify-content: center; gap: 5px; align-self: end; border: 1px solid #f1caca; border-radius: 5px; background: #fff7f7; padding: 0 8px; color: #b42318; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
.opname-item .opname-remove-item:hover { border-color: #e8a7a7; background: #feecec; }
.opname-item .opname-remove-item svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.opname-add-next { display: flex; margin: 14px 0 0 auto; }
@media (max-width: 760px) {
  .opname-item { grid-template-columns: 24px minmax(0, 1fr) 92px; }
  .opname-item .item-product { grid-column: 1 / -1; grid-row: 2; }
  .opname-item .item-quantity { grid-column: 1 / -1; grid-row: 3; }
  .opname-item .item-current-stock { grid-column: 1 / -1; grid-row: 4; }
  .opname-item .opname-remove-item { grid-column: 3; grid-row: 1; }
  .opname-add-next { width: 100%; justify-content: center; }
}
</style>
