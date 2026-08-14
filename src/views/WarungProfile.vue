<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">PENGELOLAAN WARUNG</p>
        <h1>Profil Warung</h1>
        <p class="page-description">Kelola identitas dan informasi yang digunakan untuk warung Anda.</p>
      </div>
      <RouterLink to="/" class="button button-secondary">← Kembali ke Home</RouterLink>
    </div>

    <section class="warung-profile-layout">
      <div class="panel profile-preview-card">
        <div class="profile-cover"></div>
        <div class="profile-preview-content">
          <div class="warung-avatar">
            <img v-if="warungForm.foto" :src="warungForm.foto" alt="Foto warung" />
            <span v-else>{{ (warungForm.nama || 'W').charAt(0).toUpperCase() }}</span>
          </div>
          <h2>{{ warungForm.nama || 'Nama Warung Anda' }}</h2>
          <p>{{ warungForm.alamat || 'Tambahkan alamat warung Anda' }}</p>
          <span class="profile-status"><i></i> Profil aktif</span>
        </div>
      </div>

      <section class="panel info-panel profile-editor-card">
        <div class="panel-header"><div><h2>Informasi Warung</h2><p>Pastikan data warung selalu terbaru.</p></div></div>
        <form class="profile-form" @submit.prevent="saveProfile">
          <label class="field"><span>Nama Warung</span><input v-model="warungForm.nama" type="text" required placeholder="Contoh: Warung Berkah" /></label>
          <label class="field"><span>Alamat</span><textarea v-model="warungForm.alamat" rows="4" placeholder="Alamat lengkap warung" /></label>
          <label class="field"><span>Foto Warung</span><input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp" @change="handlePhotoUpload" /><small class="field-help">JPG, PNG, atau WebP. Maksimal 1 MB.</small></label>
          <div v-if="uploadMessage" class="upload-message">{{ uploadMessage }}</div>
          <p v-if="profileMessage" :class="['profile-message', profileStatus]">{{ profileMessage }}</p>
          <button class="button button-primary" type="submit" :disabled="savingProfile">{{ savingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}</button>
        </form>
      </section>
    </section>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { authState, getWarungProfile, updateWarungProfile } from '@/auth'

const savingProfile = ref(false)
const profileMessage = ref('')
const profileStatus = ref('')
const uploadMessage = ref('')
const warungForm = ref({ nama: '', alamat: '', foto: '' })

const loadProfile = async () => {
  if (!authState.warungId) return
  const profile = await getWarungProfile()
  if (profile) warungForm.value = { nama: profile.nama || '', alamat: profile.alamat || '', foto: profile.foto || '' }
}

const handlePhotoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 1024 * 1024) { uploadMessage.value = 'Ukuran foto terlalu besar. Maksimal 1 MB.'; input.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { warungForm.value.foto = String(reader.result || ''); uploadMessage.value = 'Foto siap disimpan.' }
  reader.readAsDataURL(file)
}

const saveProfile = async () => {
  if (!warungForm.value.nama.trim()) { profileStatus.value = 'error'; profileMessage.value = 'Nama warung wajib diisi.'; return }
  savingProfile.value = true; profileMessage.value = ''
  try {
    await updateWarungProfile({ nama: warungForm.value.nama.trim(), alamat: warungForm.value.alamat.trim(), foto: warungForm.value.foto })
    profileStatus.value = 'success'; profileMessage.value = 'Profil warung berhasil diperbarui.'
  } catch (error: any) { profileStatus.value = 'error'; profileMessage.value = error?.message || 'Gagal menyimpan profil warung.' }
  finally { savingProfile.value = false }
}

onMounted(loadProfile)
</script>
