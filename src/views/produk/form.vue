<template>
    <div class="fixed inset-0 bg-gray-200 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fadeIn">
            <!-- Header -->
            <div class="flex justify-between items-center border-b pb-2 mb-4">
                <h2 class="text-lg font-bold">
                    {{ editData ? "Edit Produk" : "Tambah Produk" }}
                </h2>
                <button @click="$emit('close')" class="text-gray-500 hover:text-black text-xl font-bold cursor-pointer">
                    ×
                </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="saveProduk" class="grid gap-3">
                <input v-model="form.kategori" placeholder="Kategori" class="input" />
                <input v-model="form.nama" placeholder="Nama Produk" class="input" />
                <input v-model="form.satuan" placeholder="Satuan" class="input" />
                <input v-model="form.unit" type="number" placeholder="Unit" class="input" />
                <input v-model="form.hargaBeli" type="number" placeholder="Harga Beli" class="input" />
                <input v-model="form.hargaBeliPerUnit" type="number" disabled class="input" />
                <input v-model="form.hargaJualPerUnit" type="number" disabled class="input" />

                <button type="submit" :disabled="loading"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer">
                    <span v-if="loading">⏳ Menyimpan...</span>
                    <span v-else>{{ editData ? "Update" : "Tambah" }} Produk</span>
                </button>
            </form>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}
</style>


<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { db } from "@/firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

const props = defineProps<{ editData?: any }>();
const emit = defineEmits(["close", "saved"]);

const form = ref({
    kategori: "",
    nama: "",
    satuan: "",
    unit: 1,
    hargaBeli: 0,
    hargaBeliPerUnit: 0,
    hargaJualPerUnit: 0,
});

const loading = ref(false);

const produkCol = collection(db, "produk");

// Auto hitung harga per unit + margin
watch([() => form.value.hargaBeli, () => form.value.unit], () => {
    if (form.value.unit > 0) {
        form.value.hargaBeliPerUnit = Math.round(form.value.hargaBeli / form.value.unit);
        form.value.hargaJualPerUnit = Math.round(form.value.hargaBeliPerUnit * 1.15);
    }
});

const saveProduk = async () => {
    if (!form.value.nama) return;

    loading.value = true;
    try {
        if (props.editData?.id) {
            const refDoc = doc(db, "produk", props.editData.id);
            await updateDoc(refDoc, { ...form.value });
        } else {
            await addDoc(produkCol, { ...form.value });
        }
        emit("saved");
        emit("close");
    } catch (err) {
        console.error("Error simpan produk:", err);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    if (props.editData) {
        form.value = { ...props.editData };
    }
});
</script>

<style scoped>
.input {
    @apply border w-full;
}
</style>
