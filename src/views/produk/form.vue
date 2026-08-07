<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <header class="modal-header"><div><p class="eyebrow">MASTER DATA</p><h2 id="product-modal-title">{{ editData ? 'Edit Produk' : 'Tambah Produk' }}</h2><p>Lengkapi informasi produk di bawah ini.</p></div><button class="modal-close" type="button" aria-label="Tutup" @click="$emit('close')">×</button></header>
      <form class="modal-form" @submit.prevent="saveProduk">
        <div class="form-section"><h3>Informasi Produk</h3><div class="form-grid"><label class="field field-wide"><span>Nama Produk</span><input v-model="form.nama" required placeholder="Contoh: Beras Premium 5kg" /></label><label class="field"><span>Kategori</span><input v-model="form.kategori" placeholder="Contoh: Sembako" /></label><label class="field"><span>Satuan</span><input v-model="form.satuan" placeholder="pcs, kg, liter" /></label><label class="field"><span>Jumlah Unit</span><input v-model.number="form.unit" min="1" type="number" /></label><label class="field field-wide"><span>Barcode</span><div class="input-with-action"><input v-model="form.barcode" placeholder="Scan atau input barcode" /><button type="button" class="scan-button" @click="startScanner">Scan</button></div></label></div></div>
        <div class="form-section"><h3>Harga Produk</h3><div class="form-grid"><label class="field"><span>Total Harga Beli</span><input :value="formatCurrency(form.hargaBeli)" inputmode="numeric" @input="updateNumber('hargaBeli', $event)" /></label><label class="field"><span>Harga Jual</span><input :value="formatCurrency(form.hargaJualReal)" inputmode="numeric" @input="updateNumber('hargaJualReal', $event)" /></label><label class="field"><span>Harga Beli / Unit</span><input :value="formatCurrency(form.hargaBeliPerUnit)" disabled /></label><label class="field"><span>Harga Jual / Unit</span><input :value="formatCurrency(form.hargaJualPerUnit)" disabled /></label></div></div>
        <div v-if="showScanner" class="scanner-overlay"><div class="scanner-card"><h3>Scan Barcode</h3><p>Arahkan kamera ke barcode produk.</p><video ref="videoRef"></video><button type="button" class="button button-secondary" @click="stopScanner">Tutup Kamera</button></div></div>
        <footer class="modal-footer"><button class="button button-secondary" type="button" @click="$emit('close')">Batal</button><button class="button button-primary" type="submit" :disabled="loading">{{ loading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Produk' }}</button></footer>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { db } from '@/firebase'

const props = defineProps<{ editData?: any }>()
const emit = defineEmits(['close', 'saved'])
const form = ref({ kategori: '', nama: '', satuan: '', unit: 1, hargaBeli: 0, hargaBeliPerUnit: 0, hargaJualPerUnit: 0, hargaJualReal: 0, barcode: '' })
const loading = ref(false)
const showScanner = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null

watch([() => form.value.hargaBeli, () => form.value.unit], () => { form.value.hargaBeliPerUnit = form.value.unit > 0 ? Math.round(form.value.hargaBeli / form.value.unit) : 0; form.value.hargaJualPerUnit = Math.round(form.value.hargaBeliPerUnit * 1.15) })
const saveProduk = async () => { loading.value = true; try { const data = { ...form.value }; if (props.editData?.id) await updateDoc(doc(db, 'produk', props.editData.id), data); else await addDoc(collection(db, 'produk'), data); emit('saved'); emit('close') } finally { loading.value = false } }
const formatCurrency = (value: number) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value) : ''
type NumericField = 'hargaBeli' | 'hargaJualReal'
const updateNumber = (field: NumericField, event: Event) => { const raw = (event.target as HTMLInputElement).value.replace(/[^\d]/g, ''); form.value[field] = raw ? Number(raw) : 0 }
const startScanner = async () => { showScanner.value = true; codeReader = new BrowserMultiFormatReader(); try { const devices = await BrowserMultiFormatReader.listVideoInputDevices(); if (devices[0] && videoRef.value) codeReader.decodeFromVideoDevice(devices[0].deviceId, videoRef.value, (result) => { if (result) { form.value.barcode = result.getText(); stopScanner() } }) } catch { showScanner.value = false; window.alert('Kamera tidak dapat diakses.') } }
const stopScanner = () => {
  const stream = videoRef.value?.srcObject as MediaStream | null
  stream?.getTracks().forEach((track) => track.stop())
  if (videoRef.value) videoRef.value.srcObject = null
  showScanner.value = false
}
onMounted(() => { if (props.editData) form.value = { ...form.value, ...props.editData } })
</script>
