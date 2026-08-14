import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

export type WarungProfile = {
  nama: string
  ownerId: string
  updatedAt: Date | string | null
  alamat?: string
  foto?: string
}

export const authState = {
  user: null as User | null,
  warungId: null as string | null,
  ready: false,
}

export const authReady = new Promise<void>((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    authState.user = user
    authState.warungId = null
    if (user) {
      const userSnapshot = await getDoc(doc(db, 'users', user.uid))
      authState.warungId = userSnapshot.data()?.warungId || user.uid
    }
    authState.ready = true
    resolve()
    unsubscribe()
  })
})

export const createUserProfile = async (
  user: User,
  namaWarung: string,
  alamat = '',
  foto = '',
) => {
  const warungRef = doc(db, 'warungs', user.uid)
  await setDoc(warungRef, {
    nama: namaWarung,
    ownerId: user.uid,
    updatedAt: new Date(),
    alamat,
    foto,
  })
  await setDoc(doc(db, 'users', user.uid), { email: user.email, warungId: user.uid, createdAt: new Date() })
  authState.user = user
  authState.warungId = user.uid
}

export const getWarungProfile = async () => {
  if (!authState.warungId) return null
  const snapshot = await getDoc(doc(db, 'warungs', authState.warungId))
  return snapshot.exists() ? (snapshot.data() as WarungProfile) : null
}

export const updateWarungProfile = async (payload: { nama: string; alamat?: string; foto?: string }) => {
  if (!authState.warungId) throw new Error('Sesi warung tidak ditemukan')

  const data: WarungProfile = {
    nama: payload.nama,
    ownerId: authState.user?.uid || authState.warungId,
    updatedAt: new Date(),
    alamat: payload.alamat || '',
    foto: payload.foto || '',
  }

  await setDoc(doc(db, 'warungs', authState.warungId), data)
  return data
}

export const refreshAuthState = async (user: User | null) => {
  authState.user = user
  if (!user) {
    authState.warungId = null
    return
  }
  const snapshot = await getDoc(doc(db, 'users', user.uid))
  authState.warungId = snapshot.data()?.warungId || user.uid
}
