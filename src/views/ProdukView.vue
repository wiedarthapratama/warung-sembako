<template>
    <div class="max-w-3xl mx-auto p-6 bg-white -lg shadow mt-8">
        <h2 class="text-xl font-bold mb-4">CRUD Produk - Firestore</h2>

        <!-- Form Produk -->
        <form @submit.prevent="saveProduk" class="grid gap-4">
            <input v-model="form.kategori" placeholder="Kategori" class="input" />
            <input v-model="form.nama" placeholder="Nama Produk" class="input" />
            <input v-model="form.satuan" placeholder="Satuan" class="input" />
            <input v-model="form.unit" type="number" placeholder="Unit" class="input" />
            <input v-model="form.hargaBeli" type="number" placeholder="Harga Beli" class="input" />
            <input v-model="form.hargaBeliPerUnit" type="number" placeholder="Harga Beli per Unit" class="input"
                disabled />
            <input v-model="form.hargaJualPerUnit" type="number" placeholder="Harga Jual per Unit" class="input"
                disabled />

            <button type="submit" class="bg-blue-500 text-white px-4 py-2 ">
                {{ editId ? 'Update' : 'Tambah' }} Produk
            </button>
        </form>

        <!-- List Produk -->
        <div class="mt-8">
            <h3 class="text-lg font-semibold mb-2">Daftar Produk</h3>
            <table class="w-full border">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border">Kategori</th>
                        <th class="border">Nama</th>
                        <th class="border">Satuan</th>
                        <th class="border">Unit</th>
                        <th class="border">Harga Beli</th>
                        <th class="border">Harga Beli/Unit</th>
                        <th class="border">Harga Jual/Unit</th>
                        <th class="border">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="produk in produkList" :key="produk.id" class="border-t">
                        <td class="border">{{ produk.kategori }}</td>
                        <td class="border">{{ produk.nama }}</td>
                        <td class="border">{{ produk.satuan }}</td>
                        <td class="border">{{ produk.unit }}</td>
                        <td class="border">{{ produk.hargaBeli }}</td>
                        <td class="border">{{ produk.hargaBeliPerUnit }}</td>
                        <td class="border">{{ produk.hargaJualPerUnit }}</td>
                        <td class="border">
                            <button @click="editProduk(produk)" class="text-blue-500 mr-2">Edit</button>
                            <button @click="deleteProduk(produk.id)" class="text-red-500">Hapus</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { db } from "@/firebase"; // pastikan sudah buat src/firebase.ts
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";

const produkList = ref<any[]>([]);
const form = ref({
    kategori: "",
    nama: "",
    satuan: "",
    unit: 1,
    hargaBeli: 0,
    hargaBeliPerUnit: 0,
    hargaJualPerUnit: 0,
});
const editId = ref<string | null>(null);

const produkCol = collection(db, "produk");

// Auto hitung hargaBeliPerUnit & hargaJualPerUnit
watch([() => form.value.hargaBeli, () => form.value.unit], () => {
    if (form.value.unit > 0) {
        form.value.hargaBeliPerUnit = Math.round(form.value.hargaBeli / form.value.unit);
        form.value.hargaJualPerUnit = Math.round(form.value.hargaBeliPerUnit * 1.15);
    }
});

// Simpan produk baru atau update
const saveProduk = async () => {
    if (!form.value.nama) {
        alert("Nama produk wajib diisi");
        return;
    }

    try {
        if (editId.value) {
            const refDoc = doc(db, "produk", editId.value);
            await updateDoc(refDoc, { ...form.value });
            console.log("Produk berhasil diupdate");
            editId.value = null;
        } else {
            await addDoc(produkCol, { ...form.value });
            console.log("Produk berhasil ditambahkan");
        }
    } catch (err) {
        console.error("Gagal simpan produk:", err);
        alert("Error simpan produk, cek console!");
    }

    resetForm();
    loadProduk();
};

// Ambil semua produk
const loadProduk = async () => {
    const snapshot = await getDocs(produkCol);
    produkList.value = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
};

// Hapus produk
const deleteProduk = async (id: string) => {
    await deleteDoc(doc(db, "produk", id));
    loadProduk();
};

// Edit produk
const editProduk = (produk: any) => {
    form.value = { ...produk };
    editId.value = produk.id;
};

// Reset form
const resetForm = () => {
    form.value = {
        kategori: "",
        nama: "",
        satuan: "",
        unit: 1,
        hargaBeli: 0,
        hargaBeliPerUnit: 0,
        hargaJualPerUnit: 0,
    };
};

onMounted(() => {
    loadProduk();
});
</script>

<style scoped>
.input {
    @apply border w-full;
}
</style>
