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
            <label class="field item-product"><span>Produk</span><select v-model="item.produkId" required><option value="" disabled>Pilih produk</option><option v-for="product in products" :key="product.id" :value="product.id" :disabled="isProductSelected(product.id, index)">{{ product.nama }} — {{ product.satuan || 'satuan' }}</option></select></label>
            <label class="field item-quantity"><span>Stok Real (pcs)</span><input v-model.number="item.stokReal" type="number" min="0" step="1" required placeholder="Jumlah fisik" /><small v-if="getProduct(item)" class="field-help">Saldo saat ini: {{ Number(getProduct(item)?.stokPcs) || 0 }} pcs</small></label>
            <button v-if="form.items.length > 1" class="remove-item" type="button" aria-label="Hapus produk" @click="removeItem(index)">×</button>
          </div>
        </div>

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
type OpnameItem = { key: string; produkId: string; stokReal: number | null; nama?: string }
type OpnameForm = { tanggal: string; keterangan: string; items: OpnameItem[] }

const products = ref<Product[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const editingId = computed(() => String(route.params.id || ''))
const form = ref<OpnameForm>({ tanggal: new Date().toISOString().slice(0, 10), keterangan: '', items: [] })
const basePath = () => `warungs/${authState.warungId}`
const newItem = (): OpnameItem => ({ key: `${Date.now()}-${Math.random()}`, produkId: '', stokReal: null })
const addItem = () => form.value.items.push(newItem())
const removeItem = (index: number) => form.value.items.splice(index, 1)
const getProduct = (item: OpnameItem) => products.value.find((product) => product.id === item.produkId)
const isProductSelected = (productId: string, currentIndex: number) => form.value.items.some((item, index) => index !== currentIndex && item.produkId === productId)

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
        items: (data.items || []).map((item: OpnameItem) => ({ ...item, key: `${Date.now()}-${Math.random()}` })),
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
.opname-item { grid-template-columns: 24px minmax(180px, 1fr) minmax(150px, .7fr) 30px; }
.opname-item .item-quantity input { width: 100%; height: 39px; border: 1px solid #dce2ea; border-radius: 5px; padding: 0 10px; font: inherit; font-size: 12px; }
.opname-item .item-quantity input:focus { border-color: #2f80ed; outline: 0; box-shadow: 0 0 0 3px #2f80ed14; }
.opname-item .item-quantity small { margin-top: 2px; }
@media (max-width: 620px) { .opname-item { grid-template-columns: 24px 1fr 30px; }.opname-item .item-product, .opname-item .item-quantity { grid-column: 2 / -1; }.opname-item .remove-item { grid-column: 3; grid-row: 1; } }
</style>
