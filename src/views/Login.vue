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
      const result = await createUserWithEmailAndPassword(auth, email.value, password.value)
      await createUserProfile(result.user, namaWarung.value)
    } else {
      const result = await signInWithEmailAndPassword(auth, email.value, password.value)
      await refreshAuthState(result.user)
    }
    await router.replace('/')
  } catch (error: any) {
    const messages: Record<string, string> = { 'auth/email-already-in-use': 'Email sudah digunakan.', 'auth/invalid-credential': 'Email atau password salah.', 'auth/weak-password': 'Password minimal 6 karakter.' }
    errorMessage.value = messages[error?.code] || 'Terjadi kesalahan. Silakan coba lagi.'
  } finally { loading.value = false }
}
</script>
