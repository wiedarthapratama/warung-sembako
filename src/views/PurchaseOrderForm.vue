<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">TRANSAKSI PEMBELIAN</p><h1>{{ editingId ? 'Edit Purchase Order' : 'Buat Purchase Order' }}</h1><p class="page-description">Tambahkan beberapa barang dalam satu transaksi pembelian.</p></div>
      <button class="button button-secondary" type="button" @click="router.push('/pembelian')">Kembali</button>
    </div>
    <form class="panel purchase-page-form" @submit.prevent="saveOrder">
      <div class="panel-header"><div><h2>Informasi Pembelian</h2><p>Isi data pemasok dan tanggal transaksi.</p></div></div>
      <div class="purchase-form-body">
        <div class="form-grid"><label class="field"><span>Tanggal Pembelian</span><input v-model="form.tanggal" type="date" required /></label><label class="field"><span>Pemasok</span><input v-model="form.pemasok" placeholder="Nama pemasok (opsional)" /></label><label class="field field-wide"><span>Catatan</span><input v-model="form.catatan" placeholder="Catatan pembelian (opsional)" /></label></div>
        <div class="purchase-items-heading"><div><h3>Daftar Barang</h3><p>Pilih master produk, lalu sesuaikan jumlah dan harga bila diperlukan.</p></div><button class="button button-secondary" type="button" @click="addItem">＋ Tambah Barang</button></div>
        <div class="purchase-items"><div v-for="(item, index) in form.items" :key="item.key" class="purchase-item"><div class="item-number">{{ index + 1 }}</div><label class="field item-product"><span>Produk</span><select v-model="item.produkId" required @change="applyProduct(item)"><option value="" disabled>Pilih produk</option><option v-for="product in products" :key="product.id" :value="product.id">{{ product.nama }} — {{ product.satuan }}</option></select></label><label class="field item-quantity"><span>Jumlah ({{ getProduct(item)?.satuan || 'satuan' }})</span><input v-model.number="item.jumlah" type="number" min="1" required /></label><label class="field item-price"><span>Harga / Satuan</span><input v-model.number="item.hargaSatuan" type="number" min="0" required @input="item.manualPrice = true" /><small v-if="isPriceDifferent(item)" class="price-alert">Berbeda dari master: {{ formatRupiah(getProduct(item)?.hargaBeli) }}</small></label><div class="item-total">{{ formatRupiah((item.jumlah || 0) * (item.hargaSatuan || 0)) }}</div><button v-if="form.items.length > 1" class="remove-item" type="button" aria-label="Hapus barang" @click="removeItem(index)">×</button></div></div>
        <div class="purchase-total"><span>Total Harga PO</span><strong>{{ formatRupiah(formTotal) }}</strong></div>
        <div class="form-actions"><button class="button button-secondary" type="button" @click="router.push('/pembelian')">Batal</button><button class="button button-primary" type="submit" :disabled="saving">{{ saving ? 'Menyimpan...' : 'Simpan Draft' }}</button></div>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'

const router = useRouter(); const route = useRoute(); const products = ref<any[]>([]); const saving = ref(false); const editingId = computed(() => String(route.params.id || '')); const form = ref<any>({ tanggal: new Date().toISOString().slice(0, 10), pemasok: '', catatan: '', items: [] })
const basePath = () => `warungs/${authState.warungId}`
const newItem = () => ({ key: `${Date.now()}-${Math.random()}`, produkId: '', jumlah: 1, hargaSatuan: 0, manualPrice: false })
const addItem = () => form.value.items.push(newItem()); const removeItem = (index: number) => form.value.items.splice(index, 1); const getProduct = (item: any) => products.value.find((product) => product.id === item.produkId)
const applyProduct = (item: any) => { const product = getProduct(item); if (product) { item.hargaSatuan = Number(product.hargaBeli) || 0; item.manualPrice = false } }
const isPriceDifferent = (item: any) => { const product = getProduct(item); return Boolean(product && item.manualPrice && Number(item.hargaSatuan) !== Number(product.hargaBeli)) }
const formTotal = computed(() => form.value.items.reduce((total: number, item: any) => total + (Number(item.jumlah) || 0) * (Number(item.hargaSatuan) || 0), 0)); const formatRupiah = (value: number | string) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)) : 'Rp 0'
const saveOrder = async () => { if (!authState.warungId || form.value.items.some((item: any) => !item.produkId || item.jumlah < 1)) return; saving.value = true; try { const items = form.value.items.map((item: any) => { const product = getProduct(item); return { produkId: product.id, nama: product.nama, satuan: product.satuan, unitPerSatuan: Number(product.unit) || 1, jumlah: Number(item.jumlah), hargaSatuan: Number(item.hargaSatuan), subtotal: Number(item.jumlah) * Number(item.hargaSatuan) } }); const payload = { tanggal: form.value.tanggal, pemasok: form.value.pemasok.trim(), catatan: form.value.catatan.trim(), items, total: formTotal.value, status: 'draft', updatedAt: new Date().toISOString() }; if (editingId.value) await updateDoc(doc(db, basePath(), 'purchaseOrders', editingId.value), payload); else await addDoc(collection(db, basePath(), 'purchaseOrders'), { ...payload, createdAt: new Date().toISOString() }); await Swal.fire({ title: 'Draft tersimpan', icon: 'success', timer: 1200, showConfirmButton: false }); router.push('/pembelian') } finally { saving.value = false } }
onMounted(async () => { if (!authState.warungId) return; const snapshot = await getDocs(collection(db, basePath(), 'produk')); products.value = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })); if (editingId.value) { const order = await getDoc(doc(db, basePath(), 'purchaseOrders', editingId.value)); if (!order.exists() || order.data().status === 'locked') { router.push('/pembelian'); return }; const data = order.data(); form.value = { tanggal: data.tanggal, pemasok: data.pemasok || '', catatan: data.catatan || '', items: data.items.map((item: any) => ({ ...item, key: `${Date.now()}-${Math.random()}`, manualPrice: false })) } } else addItem() })
</script>
