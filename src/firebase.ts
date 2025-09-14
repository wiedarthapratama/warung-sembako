import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB0F7Z65MFfIhht2QyuShiLDE6mdwlnvYA',
  authDomain: 'warung-sembako-ffa06.firebaseapp.com',
  projectId: 'warung-sembako-ffa06',
  storageBucket: 'warung-sembako-ffa06.appspot.com',
  messagingSenderId: '752684471991',
  appId: '1:752684471991:web:99c8e001e12ee15df79f32',
}

// Init Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
