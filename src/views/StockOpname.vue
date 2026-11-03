<template>
  <section class="page-stack">
    <div class="page-heading">
      <div><p class="eyebrow">INVENTAR</p><h1>Stock Opname</h1><p class="page-description">Daftar pencatatan stok fisik dan status pembaruannya.</p></div>
      <button class="button button-primary" type="button" @click="router.push('/stok-opname/baru')">＋ Tambah Stock Opname</button>
    </div>

    <section class="panel product-panel">
      <div class="toolbar">
        <div><h2>Daftar Stock Opname</h2><p>{{ filteredOpnames.length }} pencatatan</p></div>
        <label class="opname-filter"><span class="sr-only">Filter status</span><select v-model="statusFilter"><option value="all">Semua status</option><option value="draft">Draft</option><option value="locked">Terkunci</option></select></label>
      </div>
      <div v-if="loading" class="table-state">Memuat stock opname...</div>
      <div v-else-if="!filteredOpnames.length" class="table-state"><strong>Belum ada stock opname</strong><span>Buat pencatatan untuk mulai menyesuaikan stok fisik.</span><button class="button button-primary" type="button" @click="router.push('/stok-opname/baru')">Tambah Stock Opname</button></div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Tanggal</th><th>Keterangan</th><th>Produk dan Stok Real</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="opname in filteredOpnames" :key="opname.id">
              <td>{{ formatDate(opname.tanggal) }}</td>
              <td>{{ opname.keterangan || '-' }}</td>
              <td><div class="opname-products"><div v-for="item in opname.items" :key="item.produkId"><strong>{{ item.nama || 'Produk' }}</strong><small>{{ item.stokReal }} pcs</small></div></div></td>
              <td><span :class="['status-badge', opname.status === 'locked' ? 'status-locked' : 'status-draft']">{{ opname.status === 'locked' ? 'Terkunci' : 'Draft' }}</span></td>
              <td>
                <div class="row-actions">
                  <button v-if="opname.status !== 'locked'" class="action-button lock-action" type="button" @click="lockOpname(opname)">Kunci</button>
                  <button v-if="opname.status !== 'locked'" class="action-button edit-action" type="button" @click="router.push(`/stok-opname/${opname.id}/edit`)">Edit</button>
                  <button v-if="opname.status !== 'locked'" class="action-button delete-action" type="button" @click="deleteOpname(opname)">Hapus</button>
                  <span v-else class="locked-note">Tidak dapat diubah</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { collection, doc, getDocs, runTransaction } from 'firebase/firestore'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import { authState } from '@/auth'

const router = useRouter()
type OpnameItem = { produkId: string; nama: string; stokReal: number; stokSistem?: number; selisih?: number }
type StockOpname = { id: string; tanggal: string; keterangan?: string; items: OpnameItem[]; status: 'draft' | 'locked'; createdAt?: string }

const opnames = ref<StockOpname[]>([])
const loading = ref(true)
const statusFilter = ref('all')
const filteredOpnames = computed(() => statusFilter.value === 'all' ? opnames.value : opnames.value.filter((opname) => opname.status === statusFilter.value))
const basePath = () => `warungs/${authState.warungId}`

const loadOpnames = async () => {
  if (!authState.warungId) { loading.value = false; return }
  loading.value = true
  try {
    const snapshot = await getDocs(collection(db, basePath(), 'stockOpnames'))
    opnames.value = snapshot.docs.map((item): StockOpname => {
      const data = item.data()
      const items: OpnameItem[] = Array.isArray(data.items) ? data.items : data.produkId ? [{ produkId: data.produkId, nama: data.namaProduk, stokReal: data.stokReal }] : []
      return { id: item.id, tanggal: data.tanggal || '', keterangan: data.keterangan || '', items, status: data.status === 'draft' ? 'draft' : 'locked', createdAt: data.createdAt || '' }
    }).sort((first, second) => String(second.createdAt || '').localeCompare(String(first.createdAt || '')))
  } finally {
    loading.value = false
  }
}

const formatDate = (value: string) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : '-'

const lockOpname = async (opname: StockOpname) => {
  const confirmation = await Swal.fire({ title: 'Kunci stock opname?', text: 'Setelah dikunci, data tidak dapat diedit dan stok produk akan diperbarui sesuai stok real.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, kunci opname', cancelButtonText: 'Batal', confirmButtonColor: '#2563eb' })
  if (!confirmation.isConfirmed || !authState.warungId) return
  try {
    await runTransaction(db, async (transaction) => {
      const opnameRef = doc(db, basePath(), 'stockOpnames', opname.id)
      const fresh = await transaction.get(opnameRef)
      if (!fresh.exists()) throw new Error('Stock opname tidak ditemukan.')
      if (fresh.data().status !== 'draft') throw new Error('Stock opname sudah terkunci dan tidak dapat diubah.')
      const items = (fresh.data().items || []) as OpnameItem[]
      if (!items.length || new Set(items.map((item) => item.produkId)).size !== items.length) throw new Error('Daftar produk pada stock opname tidak valid.')
      const productRefs = items.map((item) => ({ item, ref: doc(db, basePath(), 'produk', item.produkId) }))
      const productSnapshots = await Promise.all(productRefs.map(({ ref }) => transaction.get(ref)))
      const lockedAt = new Date().toISOString()
      const lockedItems = productSnapshots.map((snapshot, index) => {
        if (!snapshot.exists()) throw new Error(`${productRefs[index].item.nama || 'Produk'} tidak ditemukan.`)
        const item = productRefs[index].item
        const stokReal = Number(item.stokReal)
        if (!Number.isInteger(stokReal) || stokReal < 0) throw new Error('Stok real harus berupa bilangan bulat dan tidak boleh negatif.')
        const stokSistem = Number(snapshot.data()?.stokPcs) || 0
        transaction.update(productRefs[index].ref, { stokPcs: stokReal, updatedAt: lockedAt })
        return { ...item, nama: snapshot.data()?.nama || item.nama, stokSistem, selisih: stokReal - stokSistem }
      })
      transaction.update(opnameRef, { items: lockedItems, status: 'locked', lockedAt, updatedAt: lockedAt })
    })
    await loadOpnames()
    await Swal.fire({ title: 'Stock opname terkunci', text: 'Stok produk berhasil diperbarui.', icon: 'success', confirmButtonColor: '#2563eb' })
  } catch (error: unknown) {
    await Swal.fire({ title: 'Gagal mengunci stock opname', text: error instanceof Error ? error.message : 'Coba lagi.', icon: 'error', confirmButtonColor: '#2563eb' })
  }
}

const deleteOpname = async (opname: StockOpname) => {
  const confirmation = await Swal.fire({ title: 'Hapus stock opname?', text: 'Draft ini akan dihapus dan tidak mengubah stok.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, hapus', cancelButtonText: 'Batal', confirmButtonColor: '#dc2626', reverseButtons: true })
  if (!confirmation.isConfirmed || !authState.warungId) return
  try {
    const opnameRef = doc(db, basePath(), 'stockOpnames', opname.id)
    await runTransaction(db, async (transaction) => {
      const fresh = await transaction.get(opnameRef)
      if (!fresh.exists()) throw new Error('Stock opname tidak ditemukan.')
      if (fresh.data().status !== 'draft') throw new Error('Stock opname terkunci dan tidak dapat dihapus.')
      transaction.delete(opnameRef)
    })
    await loadOpnames()
  } catch (error: unknown) {
    await Swal.fire({ title: 'Gagal menghapus stock opname', text: error instanceof Error ? error.message : 'Coba lagi.', icon: 'error', confirmButtonColor: '#2563eb' })
  }
}

onMounted(loadOpnames)
</script>

<style scoped>
.opname-filter select { min-width: 150px; height: 38px; border: 1px solid #dce2ea; border-radius: 5px; background: #fff; padding: 0 10px; color: #526078; font: inherit; font-size: 12px; }
.opname-products { display: grid; gap: 6px; min-width: 150px; }
.opname-products > div { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
.opname-products strong { color: #354158; font-size: 12px; }
.opname-products small, .locked-note { color: #8792a5; font-size: 11px; }
.locked-note { white-space: nowrap; }
</style>
