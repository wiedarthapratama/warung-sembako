import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'

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

export const createUserProfile = async (user: User, namaWarung: string) => {
  const warungRef = doc(db, 'warungs', user.uid)
  await setDoc(warungRef, { nama: namaWarung, ownerId: user.uid, updatedAt: new Date() })
  await setDoc(doc(db, 'users', user.uid), { email: user.email, warungId: user.uid, createdAt: new Date() })
  authState.user = user
  authState.warungId = user.uid
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
