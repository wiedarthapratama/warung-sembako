<template>
    <div class="max-w-5xl mx-auto p-6 bg-white -lg shadow mt-8">
        <h2 class="text-xl font-bold mb-4">Daftar Produk</h2>

        <button @click="openForm()"
            class="mb-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 -lg transition cursor-pointer">
            Tambah Produk
        </button>

        <table class="w-full border">
            <thead class="bg-gray-100">
                <tr>
                    <th class="border ">Kategori</th>
                    <th class="border ">Nama</th>
                    <th class="border ">Satuan</th>
                    <th class="border ">Unit</th>
                    <th class="border ">Harga Beli</th>
                    <th class="border ">Harga Beli/Unit</th>
                    <th class="border ">Harga Jual/Unit</th>
                    <th class="border ">Harga Jual Real</th>
                    <th class="border ">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="produk in produkList" :key="produk.id" class="border-t">
                    <td class="border ">{{ produk.kategori }}</td>
                    <td class="border ">{{ produk.nama }}</td>
                    <td class="border ">{{ produk.satuan }}</td>
                    <td class="border ">{{ produk.unit }}</td>
                    <td class="border ">{{ formatRupiah(produk.hargaBeli) }}</td>
                    <td class="border ">{{ formatRupiah(produk.hargaBeliPerUnit) }}</td>
                    <td class="border ">{{ formatRupiah(produk.hargaJualPerUnit) }}</td>
                    <td class="border ">{{ formatRupiah(produk.hargaJualReal) }}</td>
                    <td class="border px-2 py-1 text-center">
                        <button @click="openForm(produk)"
                            class="px-2 py-1 text-white bg-blue-500 hover:bg-blue-600 rounded cursor-pointer">
                            Edit
                        </button>
                        <button @click="deleteProduk(produk.id)"
                            class="ml-2 px-2 py-1 text-white bg-red-500 hover:bg-red-600 rounded cursor-pointer">
                            Hapus
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Modal Form -->
        <FormProduk v-if="showForm" :editData="editData" @close="closeForm" @saved="handleSaved" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Swal from "sweetalert2";
import FormProduk from "./form.vue";

const produkList = ref<any[]>([]);
const produkCol = collection(db, "produk");
const showForm = ref(false);
const editData = ref<any | null>(null);

const loadProduk = async () => {
    const snapshot = await getDocs(produkCol);
    produkList.value = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    }));
};

const deleteProduk = async (id: string) => {
    const confirm = await Swal.fire({
        title: "Yakin hapus produk?",
        text: "Data tidak bisa dikembalikan",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus",
        cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
        await deleteDoc(doc(db, "produk", id));
        await loadProduk();
        Swal.fire("Terhapus!", "Produk berhasil dihapus", "success");
    }
};

const openForm = (produk: any | null = null) => {
    editData.value = produk;
    showForm.value = true;
};

const closeForm = () => {
    showForm.value = false;
    editData.value = null;
};

const handleSaved = async () => {
    await loadProduk();
    Swal.fire("Berhasil!", "Produk berhasil disimpan", "success");
};

onMounted(() => {
    loadProduk();
});

const formatRupiah = (value: number | string) => {
    if (!value) return "-";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(Number(value));
};
</script>