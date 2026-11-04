<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">TRANSAKSI PEMBELIAN</p><h1>{{ editingId ? 'Edit Purchase Order' : 'Buat Purchase Order' }}</h1><p class="page-description">Tambahkan beberapa barang dalam satu transaksi pembelian.</p></div>
      <button class="button button-secondary" type="button" @click="router.push('/pembelian')">Kembali</button>
    </div>
    <form class="panel purchase-page-form" @submit.prevent="saveOrder">
      <div class="panel-header"><div><h2>Informasi Pembelian</h2><p>Isi data pemasok dan tanggal transaksi.</p></div></div>
      <div class="purchase-form-body">
        <div class="form-grid"><label class="field"><span>Nomor PO</span><input v-model="form.nomor" disabled /></label><label class="field"><span>Tanggal Pembelian</span><input v-model="form.tanggal" type="date" required /></label><label class="field"><span>Pemasok</span><input v-model="form.pemasok" placeholder="Nama pemasok (opsional)" /></label><label class="field field-wide"><span>Catatan</span><input v-model="form.catatan" placeholder="Catatan pembelian (opsional)" /></label></div>
        <div v-if="!editingId && preparedProducts.length" class="prepared-products-banner">
          <div><strong>{{ availablePreparedProducts.length }} produk belum dimasukkan ke PO</strong><small>Produk yang ditandai dari master Produk tersimpan di sini sampai draft PO disimpan.</small></div>
          <button class="button button-secondary" type="button" :disabled="!availablePreparedProducts.length" @click="addPreparedProducts">＋ Gunakan daftar persiapan</button>
        </div>
        <div class="purchase-items-heading">
          <div><h3>Daftar Barang</h3><p>Pilih master produk, atau ketik nama barang baru lalu tambahkan ke master setelah menyimpan draft.</p></div>
          <button class="button button-secondary" type="button" @click="addItem()">＋ Tambah Barang</button>
        </div>
        <div ref="purchaseItemsContainer" class="purchase-items">
          <div v-for="(item, index) in form.items" :key="item.key" class="purchase-item">
            <div class="item-number">{{ index + 1 }}</div>
            <div class="field item-product">
              <span>Produk</span>
              <template v-if="item.isNewProduct">
                <input v-model.trim="item.nama" type="text" required placeholder="Nama produk baru" />
                <div class="quick-product-fields">
                  <label class="field"><span>Satuan pembelian</span><input v-model.trim="item.satuan" required placeholder="Contoh: dus" /></label>
                  <label class="field"><span>Isi / satuan (pcs)</span><input v-model.number="item.unit" type="number" min="1" placeholder="Belum diketahui" /><small class="field-help">Kosong = sementara dihitung 1 pcs.</small></label>
                </div>
                <button class="product-mode-link" type="button" @click="returnToProductSearch(item)">Pilih dari master produk</button>
              </template>
              <div v-else class="product-search">
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
                    v-for="(product, productIndex) in filteredProducts(item)"
                    :id="productOptionId(item, productIndex)"
                    :key="product.id"
                    class="product-search-option"
                    :class="{ 'product-search-option-active': productIndex === item.productActiveIndex }"
                    type="button"
                    role="option"
                    :aria-selected="product.id === item.produkId"
                    @mousedown.prevent
                    @click="selectProduct(item, product)"
                  >
                    <span>{{ product.nama }}</span>
                    <small>{{ product.satuan }}{{ product.perluDilengkapi ? ' · Belum lengkap' : '' }}</small>
                  </button>
                  <button v-if="item.productSearch.trim() && filteredProducts(item).length === 0" class="product-search-option product-search-create" type="button" @mousedown.prevent @click="startNewProduct(item)">
                    ＋ Tambahkan “{{ item.productSearch.trim() }}” sebagai produk baru
                  </button>
                  <p v-if="!item.productSearch.trim() && filteredProducts(item).length === 0" class="product-search-empty">Belum ada produk di master.</p>
                </div>
              </div>
            </div>
            <label class="field item-quantity">
              <span>Jumlah ({{ item.isNewProduct ? item.satuan || 'satuan' : getProduct(item)?.satuan || 'satuan' }})</span>
              <input v-model.number="item.jumlah" type="number" min="1" required />
            </label>
            <label class="field item-price">
              <span>Harga / Satuan</span>
              <input v-model.number="item.hargaSatuan" type="number" min="0" required @input="item.manualPrice = true" />
              <small v-if="isPriceDifferent(item)" class="price-alert">Berbeda dari master: {{ formatRupiah(getProduct(item)?.hargaBeli) }}</small>
            </label>
            <div class="item-total">{{ formatRupiah((item.jumlah || 0) * (item.hargaSatuan || 0)) }}</div>
            <button v-if="form.items.length > 1" class="remove-item" type="button" aria-label="Hapus barang" @click="removeItem(index)">×</button>
          </div>
        </div>
        <button class="button button-secondary purchase-add-more" type="button" @click="addItem()">＋ Tambah Barang Berikutnya</button>
        <div class="purchase-total"><span>Total Harga PO</span><strong>{{ formatRupiah(formTotal) }}</strong></div>
        <div class="form-actions"><button class="button button-secondary" type="button" @click="router.push('/pembelian')">Batal</button><button class="button button-primary" type="submit" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Draft' }}</button></div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'

const router = useRouter(); const route = useRoute(); const products = ref<any[]>([]); const preparedProducts = ref<any[]>([]); const purchaseItemsContainer = ref<HTMLElement | null>(null); const saving = ref(false); const editingId = computed(() => String(route.params.id || '')); const generatePONumber = () => `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`; const form = ref<any>({ nomor: generatePONumber(), tanggal: new Date().toISOString().slice(0, 10), pemasok: '', catatan: '', items: [] })
const basePath = () => `warungs/${authState.warungId}`
const newItem = () => ({ key: `${Date.now()}-${Math.random()}`, produkId: '', productSearch: '', productDropdownOpen: false, productActiveIndex: -1, isNewProduct: false, nama: '', satuan: '', unit: '', queuedProductId: '', jumlah: 1, hargaSatuan: 0, manualPrice: false })
const addItem = async (scrollToNewItem = true) => { form.value.items.push(newItem()); if (scrollToNewItem) { await nextTick(); const newRow = purchaseItemsContainer.value?.lastElementChild as HTMLElement | null; newRow?.scrollIntoView({ behavior: 'smooth', block: 'center' }); newRow?.querySelector<HTMLInputElement>('.purchase-product-search')?.focus() } }; const removeItem = (index: number) => form.value.items.splice(index, 1); const getProduct = (item: any) => products.value.find((product) => product.id === item.produkId)
const availablePreparedProducts = computed(() => preparedProducts.value.filter((prepared) => !form.value.items.some((item: any) => item.queuedProductId === prepared.id)))
const addPreparedProducts = () => {
  const toAdd = availablePreparedProducts.value
  if (!toAdd.length) return
  if (form.value.items.length === 1 && !form.value.items[0].produkId && !form.value.items[0].isNewProduct) form.value.items = []
  for (const prepared of toAdd) {
    const product = getProduct({ produkId: prepared.produkId })
    if (!product) {
      void Swal.fire({ title: 'Produk persiapan tidak ditemukan', text: `${prepared.nama || 'Salah satu produk'} sudah tidak ada di master Produk.`, icon: 'warning' })
      continue
    }
    form.value.items.push({ ...newItem(), produkId: product.id, queuedProductId: prepared.id, jumlah: 1, hargaSatuan: Number(product.hargaBeli) || 0 })
  }
}
const getProductLabel = (item: any) => { const product = getProduct(item); return product ? `${product.nama} — ${product.satuan}` : '' }
const productListId = (item: any) => `product-list-${String(item.key).replace(/[^a-zA-Z0-9_-]/g, '')}`
const productOptionId = (item: any, index: number) => `${productListId(item)}-option-${index}`
const filteredProducts = (item: any) => { const query = String(item.productSearch || '').trim().toLocaleLowerCase('id'); return products.value.filter((product) => `${product.nama || ''} ${product.satuan || ''}`.toLocaleLowerCase('id').includes(query)) }
const openProductDropdown = (item: any) => { item.productSearch = ''; item.productDropdownOpen = true; item.productActiveIndex = -1 }
const filterProducts = (item: any, event: Event) => { item.produkId = ''; item.productSearch = (event.target as HTMLInputElement).value; item.productDropdownOpen = true; item.productActiveIndex = -1 }
const closeProductDropdown = (item: any) => { item.productDropdownOpen = false; item.productActiveIndex = -1; if (!item.produkId) item.productSearch = '' }
const selectProduct = (item: any, product: any) => { item.produkId = product.id; item.productSearch = ''; item.productDropdownOpen = false; item.productActiveIndex = -1; applyProduct(item) }
const startNewProduct = (item: any) => { item.nama = item.productSearch.trim(); item.produkId = ''; item.productSearch = ''; item.productDropdownOpen = false; item.productActiveIndex = -1; item.isNewProduct = true; item.satuan = ''; item.unit = '' }
const returnToProductSearch = (item: any) => { item.isNewProduct = false; item.nama = ''; item.satuan = ''; item.unit = ''; item.hargaSatuan = 0; item.productSearch = '' }
const handleProductKeydown = (item: any, event: KeyboardEvent) => { const count = filteredProducts(item).length; if (event.key === 'ArrowDown') { event.preventDefault(); item.productDropdownOpen = true; item.productActiveIndex = Math.min((item.productActiveIndex ?? -1) + 1, count - 1) } else if (event.key === 'ArrowUp') { event.preventDefault(); item.productActiveIndex = Math.max((item.productActiveIndex ?? 0) - 1, 0) } else if (event.key === 'Enter' && item.productDropdownOpen && count > 0) { event.preventDefault(); selectProduct(item, filteredProducts(item)[Math.max(item.productActiveIndex, 0)]) } else if (event.key === 'Escape') { closeProductDropdown(item) } }
const applyProduct = (item: any) => { const product = getProduct(item); if (product) { item.hargaSatuan = Number(product.hargaBeli) || 0; item.manualPrice = false } }
const isPriceDifferent = (item: any) => { const product = getProduct(item); return Boolean(product && item.manualPrice && Number(item.hargaSatuan) !== Number(product.hargaBeli)) }
const formTotal = computed(() => form.value.items.reduce((total: number, item: any) => total + (Number(item.jumlah) || 0) * (Number(item.hargaSatuan) || 0), 0)); const formatRupiah = (value: number | string) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)) : 'Rp 0'
const saveOrder = async () => {
  if (!authState.warungId) return
  if (form.value.items.some((item: any) => (!item.produkId && !item.isNewProduct) || (item.isNewProduct && (!item.nama.trim() || !item.satuan.trim())))) {
    await Swal.fire({ title: 'Produk belum lengkap', text: 'Pilih produk dari master atau isi nama dan satuan pembelian untuk produk baru.', icon: 'warning' })
    return
  }
  if (form.value.items.some((item: any) => Number(item.jumlah) < 1)) return
  saving.value = true
  try {
    const batch = writeBatch(db)
    const timestamp = new Date().toISOString()
    const items = form.value.items.map((item: any) => {
      let product = getProduct(item)
      let productId = item.produkId
      let unitPerSatuan = 1
      let perluDilengkapi = false
      const satuan = item.isNewProduct ? item.satuan.trim() : product?.satuan || ''
      const nama = item.isNewProduct ? item.nama.trim() : product?.nama || ''
      if (item.isNewProduct) {
        const productRef = doc(collection(db, basePath(), 'produk'))
        productId = productRef.id
        const enteredUnit = Number(item.unit)
        const unitForStock = enteredUnit || 1
        unitPerSatuan = unitForStock
        perluDilengkapi = true
        product = { id: productId, nama, satuan, unit: enteredUnit || null, hargaBeli: Number(item.hargaSatuan) || 0, perluDilengkapi: true }
        batch.set(productRef, {
          kategori: '',
          nama,
          satuan,
          unit: enteredUnit || null,
          hargaBeli: Number(item.hargaSatuan) || 0,
          hargaBeliPerUnit: Math.round((Number(item.hargaSatuan) || 0) / unitForStock),
          hargaJualPerUnit: 0,
          hargaJualReal: 0,
          barcode: '',
          stokPcs: 0,
          perluDilengkapi: true,
          konversiBelumDiketahui: !enteredUnit,
          koreksiStokManual: false,
          createdFromPurchaseOrder: true,
          updatedAt: timestamp,
          createdAt: timestamp,
        })
      } else {
        if (!product) throw new Error(`Produk ${nama || item.produkId} tidak ditemukan di master.`)
        unitPerSatuan = Number(product.unit) || 1
        perluDilengkapi = Boolean(product.perluDilengkapi || !Number(product.unit))
      }
      return {
        produkId: productId,
        nama,
        satuan,
        unitPerSatuan,
        jumlah: Number(item.jumlah),
        hargaSatuan: Number(item.hargaSatuan),
        subtotal: Number(item.jumlah) * Number(item.hargaSatuan),
        perluDilengkapi,
        konversiBelumDiketahui: Boolean(item.isNewProduct ? !Number(item.unit) : !Number(product?.unit)),
        ...(item.queuedProductId ? { queuedProductId: item.queuedProductId } : {}),
      }
    })
    const orderRef = editingId.value ? doc(db, basePath(), 'purchaseOrders', editingId.value) : doc(collection(db, basePath(), 'purchaseOrders'))
    const payload = { nomor: form.value.nomor || generatePONumber(), tanggal: form.value.tanggal, pemasok: form.value.pemasok.trim(), catatan: form.value.catatan.trim(), items, total: formTotal.value, status: 'draft', updatedAt: timestamp }
    batch.set(orderRef, editingId.value ? payload : { ...payload, createdAt: timestamp }, { merge: Boolean(editingId.value) })
    form.value.items.forEach((item: any) => { if (item.queuedProductId) batch.delete(doc(db, basePath(), 'purchaseOrderQueue', item.queuedProductId)) })
    await batch.commit()
    await Swal.fire({ title: 'Draft tersimpan', icon: 'success', timer: 1200, showConfirmButton: false })
    router.push('/pembelian')
  } catch (error) {
    await Swal.fire({ title: 'Gagal menyimpan PO', text: error instanceof Error ? error.message : 'Silakan coba lagi.', icon: 'error' })
  } finally {
    saving.value = false
  }
}
onMounted(async () => {
  if (!authState.warungId) return
  try {
    const [productSnapshot, preparedSnapshot] = await Promise.all([
      getDocs(collection(db, basePath(), 'produk')),
      getDocs(collection(db, basePath(), 'purchaseOrderQueue')),
    ])
    const loadedProducts: { id: string; nama?: string }[] = productSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    products.value = loadedProducts.sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { sensitivity: 'base' }))
    preparedProducts.value = preparedSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    if (editingId.value) {
      const order = await getDoc(doc(db, basePath(), 'purchaseOrders', editingId.value))
      if (!order.exists() || order.data().status === 'locked') { router.push('/pembelian'); return }
      const data = order.data()
      form.value = { nomor: data.nomor || generatePONumber(), tanggal: data.tanggal, pemasok: data.pemasok || '', catatan: data.catatan || '', items: data.items.map((item: any) => ({ ...item, key: `${Date.now()}-${Math.random()}`, productSearch: '', productDropdownOpen: false, productActiveIndex: -1, isNewProduct: false, queuedProductId: '', manualPrice: false })) }
    } else addItem(false)
  } catch (error) {
    await Swal.fire({ title: 'Gagal memuat data PO', text: error instanceof Error ? error.message : 'Silakan coba lagi.', icon: 'error' })
  }
})
</script>
