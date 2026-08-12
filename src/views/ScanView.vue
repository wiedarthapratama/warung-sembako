<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">SCAN PRODUK</p>
        <h1>Scan Produk</h1>
        <p class="page-description">Arahkan kamera ke barcode atau masukkan kode untuk melihat detail produk.</p>
      </div>
    </div>

    <section class="panel scan-panel">
      <div class="toolbar">
        <div><h2>Scanner Produk</h2><p>Gunakan kamera untuk menemukan produk dari barcode.</p></div>
        <div class="scan-controls">
          <label class="field field-inline"><span>Barcode</span><input v-model="searchBarcode" type="text" placeholder="Input barcode manual" /></label>
          <button class="button button-primary" type="button" @click="searchProduct">Cari Produk</button>
        </div>
      </div>

      <div class="scan-body">
        <div class="scan-panel-left">
          <div class="scan-hero">
            <p class="scan-instruction">Tekan tombol untuk memulai pemindaian barcode dengan kamera.</p>
            <button class="button button-secondary" type="button" @click="startScanner">Mulai Scan Kamera</button>
          </div>
          <div v-if="showScanner" class="scanner-overlay">
            <div class="scanner-card">
              <h3>Scan Barcode</h3>
              <p>Arahkan kamera ke barcode produk.</p>
              <video ref="videoRef"></video>
              <button type="button" class="button button-secondary" @click="stopScanner">Tutup Kamera</button>
            </div>
          </div>
        </div>

        <div class="scan-panel-right">
          <div v-if="loading" class="detail-state">Memuat produk...</div>
          <div v-else-if="product">
            <div class="detail-card">
              <h3>Detail Produk</h3>
              <div class="detail-row"><span>Nama</span><strong>{{ product.nama || '-' }}</strong></div>
              <div class="detail-row"><span>Kategori</span><strong>{{ product.kategori || 'Umum' }}</strong></div>
              <div class="detail-row"><span>Barcode</span><strong>{{ product.barcode || 'Tanpa barcode' }}</strong></div>
              <div class="detail-row"><span>Stok</span><strong>{{ product.unit || 0 }} {{ product.satuan || 'unit' }}</strong></div>
              <div class="detail-row"><span>Harga Beli</span><strong>{{ formatRupiah(product.hargaBeli) }}</strong></div>
              <div class="detail-row"><span>Harga Jual</span><strong>{{ formatRupiah(product.hargaJualReal || product.hargaJualPerUnit) }}</strong></div>
            </div>
          </div>
          <div v-else class="detail-state">
            <strong>Produk belum dipilih</strong>
            <span>Scan barcode atau masukkan kode untuk menampilkan detail.</span>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'
import Swal from 'sweetalert2'

const searchBarcode = ref('')
const product = ref<any | null>(null)
const loading = ref(false)
const showScanner = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null

const formatRupiah = (value: number | string) => value ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)) : '-'

const searchProduct = async () => {
  const barcode = searchBarcode.value.trim()
  if (!barcode) {
    Swal.fire({ title: 'Masukkan barcode', text: 'Silakan isi kode barcode terlebih dahulu.', icon: 'warning', confirmButtonColor: '#2563eb' })
    return
  }
  loading.value = true
  product.value = null

  try {
    const produkQuery = query(collection(db, 'produk'), where('barcode', '==', barcode))
    const snapshot = await getDocs(produkQuery)
    if (snapshot.empty) {
      Swal.fire({ title: 'Produk tidak ditemukan', text: 'Tidak ada produk dengan barcode tersebut.', icon: 'info', confirmButtonColor: '#2563eb' })
    } else {
      product.value = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
    }
  } catch (error) {
    Swal.fire({ title: 'Gagal mencari produk', text: 'Terjadi kesalahan saat mengambil data.', icon: 'error', confirmButtonColor: '#2563eb' })
  } finally {
    loading.value = false
  }
}

const startScanner = async () => {
  showScanner.value = true
  codeReader = new BrowserMultiFormatReader()
  try {
    const devices = await BrowserMultiFormatReader.listVideoInputDevices()
    if (devices[0] && videoRef.value) {
      codeReader.decodeFromVideoDevice(devices[0].deviceId, videoRef.value, (result) => {
        if (result) {
          searchBarcode.value = result.getText()
          stopScanner()
          searchProduct()
        }
      })
    }
  } catch {
    showScanner.value = false
    Swal.fire({ title: 'Kamera tidak dapat diakses', text: 'Pastikan izin kamera diberikan.', icon: 'error', confirmButtonColor: '#2563eb' })
  }
}

const stopScanner = () => {
  const stream = videoRef.value?.srcObject as MediaStream | null
  stream?.getTracks().forEach((track) => track.stop())
  if (videoRef.value) videoRef.value.srcObject = null
  showScanner.value = false
}
</script>
