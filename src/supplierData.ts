import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'

export type SupplierRecord = {
  id: string
  nama: string
}

export const normalizeSupplierName = (name: string) => name.trim().toLocaleLowerCase('id-ID')

export const supplierDocumentId = (name: string) => {
  const bytes = new TextEncoder().encode(normalizeSupplierName(name))
  const encodedName = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `supplier_${encodedName}`
}

export const loadSupplierMaster = async (basePath: string) => {
  const [supplierSnapshot, orderSnapshot, migrationSnapshot] = await Promise.all([
    getDocs(collection(db, basePath, 'suppliers')),
    getDocs(collection(db, basePath, 'purchaseOrders')),
    getDoc(doc(db, basePath, 'suppliers', '_legacyPurchaseOrdersImported')),
  ])
  const suppliers = new Map<string, SupplierRecord>()
  for (const item of supplierSnapshot.docs) {
    const nama = String(item.data().nama || '').trim()
    const normalizedName = normalizeSupplierName(nama)
    if (normalizedName && !suppliers.has(normalizedName)) suppliers.set(normalizedName, { id: item.id, nama })
  }

  if (!migrationSnapshot.exists()) {
    const legacyNames = new Map<string, string>()
    for (const order of orderSnapshot.docs) {
      const nama = String(order.data().pemasok || '').trim()
      const normalizedName = normalizeSupplierName(nama)
      if (normalizedName && !suppliers.has(normalizedName)) legacyNames.set(normalizedName, nama)
    }

    const missingSuppliers = [...legacyNames.entries()]
    for (let offset = 0; offset < missingSuppliers.length; offset += 450) {
      const batch = writeBatch(db)
      const chunk = missingSuppliers.slice(offset, offset + 450)
      const timestamp = new Date().toISOString()
      for (const [normalizedName, nama] of chunk) {
        const supplier = { id: supplierDocumentId(nama), nama }
        suppliers.set(normalizedName, supplier)
        batch.set(doc(db, basePath, 'suppliers', supplier.id), {
          nama,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
      const isLastChunk = offset + chunk.length >= missingSuppliers.length
      if (isLastChunk) {
        batch.set(doc(db, basePath, 'suppliers', '_legacyPurchaseOrdersImported'), {
          completedAt: timestamp,
        })
      }
      await batch.commit()
    }

    if (!missingSuppliers.length) {
      const batch = writeBatch(db)
      batch.set(doc(db, basePath, 'suppliers', '_legacyPurchaseOrdersImported'), {
        completedAt: new Date().toISOString(),
      })
      await batch.commit()
    }
  }

  return {
    suppliers: [...suppliers.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id-ID', { sensitivity: 'base' })),
    purchaseOrders: orderSnapshot.docs.map((item) => item.data()),
  }
}
