<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <header class="modal-header"><div><p class="eyebrow">MASTER DATA</p><h2 id="product-modal-title">{{ editData ? 'Edit Produk' : 'Tambah Produk' }}</h2><p>Lengkapi informasi produk di bawah ini.</p></div><button class="modal-close" type="button" aria-label="Tutup" @click="$emit('close')">×</button></header>
      <form class="modal-form" @submit.prevent="saveProduk">
        <div v-if="editData?.createdFromPurchaseOrder" class="incomplete-product-notice">Produk ini dibuat dari PO dan masih perlu dilengkapi. Isi jumlah pcs yang sebenarnya dalam satu {{ form.satuan || 'satuan pembelian' }}.</div>
        <div class="form-section"><h3>Informasi Produk</h3><div class="form-grid"><label class="field field-wide"><span>Nama Produk</span><input v-model="form.nama" required placeholder="Contoh: Kopi Kapal Api" /></label><label class="field"><span>Kategori</span><input v-model="form.kategori" placeholder="Contoh: Kopi" /></label><label class="field"><span>Satuan Pembelian</span><input v-model="form.satuan" required placeholder="Contoh: Renceng" /><small class="field-help">Satuan saat produk dibeli dari pemasok.</small></label><label class="field"><span>Isi per Satuan</span><div class="input-suffix"><input v-model.number="form.unit" min="1" type="number" required /><em>pcs</em></div><small class="field-help">Contoh: 1 renceng berisi 10 pcs.</small></label><label class="field field-wide"><span>Barcode</span><div class="input-with-action"><input v-model="form.barcode" placeholder="Scan atau input barcode" /><button type="button" class="scan-button" @click="startScanner">Scan</button></div></label></div></div>
        <div class="form-section"><h3>Harga Produk</h3><p class="section-help">Harga beli dicatat per {{ form.satuan || 'satuan pembelian' }}. Harga jual digunakan sebagai harga tetap per pcs saat transaksi.</p><div class="form-grid"><label class="field"><span>Total Harga Beli / Satuan</span><input :value="formatCurrency(form.hargaBeli)" inputmode="numeric" @input="updateNumber('hargaBeli', $event)" /><small class="field-help">Contoh: harga beli 1 renceng.</small></label><label class="field"><span>Harga Jual / Unit</span><input :value="formatCurrency(form.hargaJualReal)" inputmode="numeric" @input="updateNumber('hargaJualReal', $event)" /><small class="field-help">Harga jual tetap per pcs untuk transaksi.</small></label><label class="field"><span>Harga Beli / Unit</span><input :value="formatCurrency(form.hargaBeliPerUnit)" disabled /><small class="field-help">Total harga beli ÷ isi per satuan.</small></label><label class="field"><span>Harga Jual / Unit (Rumus)</span><input :value="formatCurrency(form.hargaJualPerUnit)" disabled /><small class="field-help">Nilai referensi berdasarkan rumus margin.</small></label></div></div>
        <label class="prepare-product-option"><input v-model="prepareForPurchase" type="checkbox" /><span><strong>Siapkan untuk Purchase Order berikutnya</strong><small>Produk ini akan muncul di daftar persiapan saat membuat PO dan tetap tersimpan sampai dipakai.</small></span></label>
        <label v-if="editData?.koreksiStokManual" class="prepare-product-option stock-correction-option"><input v-model="stockCorrectionConfirmed" type="checkbox" /><span><strong>Koreksi stok manual sudah dilakukan</strong><small>Centang setelah stok disesuaikan dengan konversi isi per satuan yang sebenarnya.</small></span></label>
        <div v-if="showScanner" class="scanner-overlay" @click.self="stopScanner">
          <div class="scanner-card">
            <h3>Scan Barcode</h3>
            <p>Arahkan kamera ke barcode produk.</p>
            <video ref="videoRef" autoplay muted playsinline></video>
            <p v-if="scannerMessage" class="scanner-error" role="alert">{{ scannerMessage }}</p>
            <button type="button" class="button button-secondary" @click="stopScanner">Tutup Kamera</button>
          </div>
        </div>
        <footer class="modal-footer"><button class="button button-secondary" type="button" @click="$emit('close')">Batal</button><button class="button button-primary" type="submit" :disabled="loading">{{ loading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Produk' }}</button></footer>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, nextTick, ref, watch } from 'vue'
import { collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import Swal from 'sweetalert2'
import { db } from '@/firebase'
import { authState } from '@/auth'

const props = defineProps<{ editData?: any }>()
const emit = defineEmits(['close', 'saved'])
const form = ref<any>({ kategori: '', nama: '', satuan: '', unit: 1, hargaBeli: 0, hargaBeliPerUnit: 0, hargaJualPerUnit: 0, hargaJualReal: 0, barcode: '' })
const loading = ref(false)
const prepareForPurchase = ref(false)
const stockCorrectionConfirmed = ref(false)
const showScanner = ref(false)
const scannerStarting = ref(false)
const scannerMessage = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
let scannerControls: IScannerControls | null = null
let scannerSession = 0

watch([() => form.value.hargaBeli, () => form.value.unit], () => { form.value.hargaBeliPerUnit = form.value.unit > 0 ? Math.round(form.value.hargaBeli / form.value.unit) : 0; form.value.hargaJualPerUnit = Math.round(form.value.hargaBeliPerUnit * 1.15) })
const saveProduk = async () => {
  loading.value = true
  try {
    if (!authState.warungId) throw new Error('Sesi warung tidak ditemukan')
    const base = `warungs/${authState.warungId}`
    const productRef = props.editData?.id ? doc(db, base, 'produk', props.editData.id) : doc(collection(db, base, 'produk'))
    const queueRef = doc(db, base, 'purchaseOrderQueue', productRef.id)
    const batch = writeBatch(db)
    const updatedAt = new Date().toISOString()
    batch.set(productRef, { ...form.value, unit: Number(form.value.unit) || null, perluDilengkapi: !(Number(form.value.unit) > 0), konversiBelumDiketahui: !(Number(form.value.unit) > 0), createdFromPurchaseOrder: false, koreksiStokManual: Boolean(props.editData?.koreksiStokManual && !stockCorrectionConfirmed.value), updatedAt }, { merge: Boolean(props.editData?.id) })
    if (prepareForPurchase.value) {
      batch.set(queueRef, { produkId: productRef.id, nama: form.value.nama.trim(), satuan: form.value.satuan.trim(), unit: Number(form.value.unit) || 1, hargaBeli: Number(form.value.hargaBeli) || 0, queuedAt: updatedAt })
    } else {
      batch.delete(queueRef)
    }
    await batch.commit()
    emit('saved')
    emit('close')
  } catch (error) {
    await Swal.fire({ title: 'Gagal menyimpan produk', text: error instanceof Error ? error.message : 'Silakan coba lagi.', icon: 'error' })
  } finally {
    loading.value = false
  }
}
const formatCurrency = (value: number) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : ''
type NumericField = 'hargaBeli' | 'hargaJualReal'
const updateNumber = (field: NumericField, event: Event) => { const raw = (event.target as HTMLInputElement).value.replace(/[^\d]/g, ''); form.value[field] = raw ? Number(raw) : 0 }
const startScanner = async () => {
  if (scannerControls || scannerStarting.value) return
  scannerMessage.value = ''
  if (!navigator.mediaDevices?.getUserMedia) {
    showScanner.value = true
    scannerMessage.value = 'Pemindaian kamera memerlukan koneksi HTTPS dan browser yang mendukung kamera.'
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
      if (result && session === scannerSession) {
        form.value.barcode = result.getText()
        stopScanner()
      }
    })
    if (session !== scannerSession) {
      controls.stop()
      return
    }
    scannerControls = controls
  } catch (error) {
    if (session !== scannerSession) return
    const name = error instanceof Error ? error.name : ''
    scannerMessage.value = name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Izinkan akses kamera di browser lalu coba lagi.'
      : name === 'NotFoundError' || name === 'OverconstrainedError'
        ? 'Kamera tidak ditemukan atau tidak tersedia.'
        : name === 'NotReadableError'
          ? 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.'
          : error instanceof Error
            ? `Kamera tidak dapat dibuka: ${error.message}`
            : 'Kamera tidak dapat dibuka. Periksa izin kamera dan coba lagi.'
  } finally {
    scannerStarting.value = false
  }
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
onBeforeUnmount(stopScanner)
onMounted(async () => {
  if (props.editData) {
    form.value = { ...form.value, ...props.editData }
    stockCorrectionConfirmed.value = false
    if (authState.warungId && props.editData.id) {
      try {
        const stagedProduct = await getDoc(doc(db, 'warungs', authState.warungId, 'purchaseOrderQueue', props.editData.id))
        prepareForPurchase.value = stagedProduct.exists()
      } catch (error) {
        await Swal.fire({ title: 'Gagal memuat status persiapan PO', text: error instanceof Error ? error.message : 'Silakan coba lagi.', icon: 'error' })
      }
    }
  }
})
</script>
