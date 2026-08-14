<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">OVERVIEW</p>
        <h1>Selamat datang kembali</h1>
        <p class="page-description">Pantau katalog dan kelola produk warung dari satu tempat.</p>
      </div>
      <RouterLink to="/produk" class="button button-primary">Kelola Produk <span>→</span></RouterLink>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon stat-icon-blue">▦</div>
        <div><span>Total Produk</span><strong>{{ totalProduk }}</strong></div>
        <small>Item di katalog</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon-green">Rp</div>
        <div><span>Nilai Katalog</span><strong>{{ formatRupiah(totalNilai) }}</strong></div>
        <small>Estimasi harga jual</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon-orange">!</div>
        <div><span>Stok Terbatas</span><strong>{{ stokTerbatas }}</strong></div>
        <small>Produk dengan unit ≤ 5</small>
      </article>
    </div>

    <div class="dashboard-grid">
      <section class="panel quick-panel">
        <div class="panel-header"><div><h2>Akses Cepat</h2><p>Kelola data utama warung.</p></div></div>
        <div class="quick-actions">
          <RouterLink to="/produk" class="quick-action"><span class="quick-icon">＋</span><span><strong>Tambah Produk</strong><small>Masukkan item baru</small></span><b>→</b></RouterLink>
          <RouterLink to="/produk" class="quick-action"><span class="quick-icon">⌕</span><span><strong>Lihat Semua Produk</strong><small>Periksa katalog aktif</small></span><b>→</b></RouterLink>
          <button class="quick-action" type="button" @click="scrollToProfile">
            <span class="quick-icon">⚙</span>
            <span><strong>Lengkapi Data Warung</strong><small>Isi alamat dan foto warung</small></span>
            <b>→</b>
          </button>
        </div>
      </section>

      <section id="profil-warung" class="panel info-panel">
        <div class="panel-header"><div><h2>Profil Warung</h2><p>Atur nama, alamat, dan foto warung.</p></div></div>

        <form class="profile-form" @submit.prevent="saveProfile">
          <label class="field">
            <span>Nama Warung</span>
            <input v-model="warungForm.nama" type="text" required placeholder="Nama warung" />
          </label>

          <label class="field">
            <span>Alamat</span>
            <textarea v-model="warungForm.alamat" rows="3" placeholder="Alamat warung" />
          </label>

          <label class="field">
            <span>URL Foto</span>
            <input v-model="warungForm.foto" type="url" placeholder="https://example.com/foto-warung.jpg" />
          </label>

          <div v-if="warungForm.foto" class="profile-image-wrap">
            <img :src="warungForm.foto" alt="Preview foto warung" class="profile-image" />
          </div>

          <p v-if="profileMessage" :class="['profile-message', profileStatus]">{{ profileMessage }}</p>

          <button class="button button-primary" type="submit" :disabled="savingProfile">
            {{ savingProfile ? 'Menyimpan...' : 'Simpan Profil' }}
          </button>
        </form>
      </section>

      <section class="panel info-panel">
        <div class="panel-header"><div><h2>Ringkasan Sistem</h2><p>Status aplikasi saat ini.</p></div><span class="badge badge-success">Aktif</span></div>
        <div class="system-row"><span>Database</span><strong>Firestore</strong></div>
        <div class="system-row"><span>Peran pengguna</span><strong>Administrator</strong></div>
        <div class="system-row"><span>Sinkronisasi</span><strong>Realtime</strong></div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { authState, getWarungProfile, updateWarungProfile } from '@/auth'

const totalProduk = ref(0)
const totalNilai = ref(0)
const stokTerbatas = ref(0)
const savingProfile = ref(false)
const profileMessage = ref('')
const profileStatus = ref('')
const warungForm = ref({
  nama: '',
  alamat: '',
  foto: '',
})

const loadSummary = async () => {
  if (!authState.warungId) return
  const snapshot = await getDocs(collection(db, 'warungs', authState.warungId, 'produk'))
  const products = snapshot.docs.map((item) => item.data())
  totalProduk.value = products.length
  totalNilai.value = products.reduce((sum, item) => sum + Number(item.hargaJualReal || item.hargaJualPerUnit || 0), 0)
  stokTerbatas.value = products.filter((item) => Number(item.unit || 0) <= 5).length
}

const loadWarungProfile = async () => {
  if (!authState.warungId) return
  const profile = await getWarungProfile()
  if (!profile) return

  warungForm.value.nama = profile.nama || ''
  warungForm.value.alamat = profile.alamat || ''
  warungForm.value.foto = profile.foto || ''
}

const scrollToProfile = () => {
  const profileSection = document.getElementById('profil-warung')
  profileSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const saveProfile = async () => {
  if (!warungForm.value.nama.trim()) {
    profileStatus.value = 'error'
    profileMessage.value = 'Nama warung wajib diisi.'
    return
  }

  savingProfile.value = true
  profileMessage.value = ''

  try {
    await updateWarungProfile({
      nama: warungForm.value.nama.trim(),
      alamat: warungForm.value.alamat.trim(),
      foto: warungForm.value.foto.trim(),
    })

    profileStatus.value = 'success'
    profileMessage.value = 'Profil warung berhasil diperbarui.'
  } catch (error: any) {
    profileStatus.value = 'error'
    profileMessage.value = error?.message || 'Gagal menyimpan profil warung.'
  } finally {
    savingProfile.value = false
  }
}

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

onMounted(async () => {
  await loadSummary()
  await loadWarungProfile()
})
</script>
