<template>
  <main class="auth-page">
    <section class="auth-card">
      <div class="brand auth-brand"><div class="brand-mark">WS</div><div><strong>Warung Sembako</strong><span>Admin Panel</span></div></div>
      <div class="auth-heading"><p class="eyebrow">AKSES WARUNG</p><h1>{{ isRegister ? 'Buat akun warung' : 'Masuk ke warung' }}</h1><p>{{ isRegister ? 'Mulai kelola katalog produk warung Anda.' : 'Kelola produk dan stok dari satu tempat.' }}</p></div>
      <form class="auth-form" @submit.prevent="submit">
        <label class="field"><span>Email</span><input v-model.trim="email" type="email" required autocomplete="email" placeholder="nama@email.com" /></label>
        <label class="field"><span>Password</span><input v-model="password" type="password" required minlength="6" autocomplete="new-password" placeholder="Minimal 6 karakter" /></label>
        <label v-if="isRegister" class="field"><span>Nama Warung</span><input v-model.trim="namaWarung" required placeholder="Contoh: Warung Makmur" /></label>
        <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>
        <button class="button button-primary auth-submit" type="submit" :disabled="loading">{{ loading ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk' }}</button>
      </form>
      <button class="auth-switch" type="button" @click="toggleMode">{{ isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar' }}</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { auth } from '@/firebase'
import { createUserProfile, refreshAuthState } from '@/auth'

const router = useRouter()
const isRegister = ref(false)
const loading = ref(false)
const email = ref('')
const password = ref('')
const namaWarung = ref('')
const errorMessage = ref('')

const toggleMode = () => { isRegister.value = !isRegister.value; errorMessage.value = '' }
const submit = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    if (isRegister.value) {
      if (!namaWarung.value.trim()) {
        throw { code: 'validation/name-required', message: 'Nama warung wajib diisi.' }
      }

      const result = await createUserWithEmailAndPassword(auth, email.value, password.value)
      await createUserProfile(result.user, namaWarung.value.trim())
    } else {
      const result = await signInWithEmailAndPassword(auth, email.value, password.value)
      await refreshAuthState(result.user)
    }

    await router.replace('/')
  } catch (error: any) {
    const messages: Record<string, string> = {
      'validation/name-required': 'Nama warung wajib diisi.',
      'auth/email-already-in-use': 'Email sudah digunakan.',
      'auth/invalid-credential': 'Email atau password salah.',
      'auth/weak-password': 'Password minimal 6 karakter.',
      'auth/network-request-failed': 'Koneksi internet bermasalah. Coba lagi.',
      'auth/operation-not-allowed': 'Login email/password belum diaktifkan di Firebase.',
      'permission-denied': 'Akses database ditolak. Harap publish aturan Firestore dan pastikan pengguna login sudah aktif.',
      'firestore/permission-denied': 'Akses database ditolak. Harap publish aturan Firestore dan pastikan pengguna login sudah aktif.'
    }

    console.error('Auth error:', error)
    errorMessage.value = messages[error?.code] || error?.message || 'Terjadi kesalahan. Silakan coba lagi.'
  } finally { loading.value = false }
}
</script>
