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
                <label for="">Kategori</label>
                <input v-model="form.kategori" placeholder="Kategori" class="input" />
                <label for="">Nama Produk</label>
                <input v-model="form.nama" placeholder="Nama Produk" class="input" />
                <label for="">Satuan</label>
                <input v-model="form.satuan" placeholder="Satuan" class="input" />
                <label for="">Unit</label>
                <input v-model="form.unit" type="number" placeholder="Unit" class="input" />
                <label for="">Harga Beli</label>
                <input :value="formatCurrency(form.hargaBeli)" @input="updateNumber('hargaBeli', $event)" type="text"
                    placeholder="Harga Beli" class="input" />
                <label for="">Harga Beli per Unit</label>
                <input :value="formatCurrency(form.hargaBeliPerUnit)" type="text" disabled class="input" />
                <label for="">Harga Jual per Unit</label>
                <input :value="formatCurrency(form.hargaJualPerUnit)" type="text" disabled class="input" />
                <label for="">Harga Jual</label>
                <input :value="formatCurrency(form.hargaJualReal)" @input="updateNumber('hargaJualReal', $event)"
                    type="text" class="input" />
                <label for="">Barcode</label>
                <div class="flex gap-2">
                    <input v-model="form.barcode" type="text" placeholder="Scan / input barcode" class="input flex-1" />
                    <button type="button" @click="startScanner" class="bg-green-500 text-white px-3 rounded">📷</button>
                </div>

                <!-- Modal atau area kamera -->
                <div v-if="showScanner" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div class="bg-white p-4 rounded-lg">
                        <h3 class="font-semibold mb-2">Arahkan barcode ke kamera</h3>
                        <video ref="videoRef" class="border w-72 h-48"></video>
                        <div class="mt-2 flex justify-end">
                            <button @click="stopScanner" class="bg-red-500 text-white px-3 py-1 rounded">Tutup</button>
                        </div>
                    </div>
                </div>



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

.fixed.inset-0 video {
    position: relative;
    z-index: 1;
}

.fixed.inset-0 button.bg-red-500 {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
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
    hargaJualReal: 0,
    barcode: "",
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


// ✅ Fungsi format dan parse angka
const formatCurrency = (value: number) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);
};

const updateNumber = (field: string, e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/[^\d]/g, ""); // hapus non-digit
    form.value[field] = raw ? parseInt(raw) : 0;
};

import { BrowserMultiFormatReader } from "@zxing/browser";
import { ref } from "vue";

let codeReader: BrowserMultiFormatReader | null = null;
const showScanner = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
let activeStream: MediaStream | null = null;

const startScanner = async () => {
    showScanner.value = true;
    codeReader = new BrowserMultiFormatReader();

    try {
        // Minta izin kamera dulu
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // hanya untuk izin

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
            alert("Kamera tidak ditemukan. Pastikan izin kamera diizinkan di browser.");
            showScanner.value = false;
            return;
        }

        const selectedDeviceId = devices[0].deviceId;

        if (videoRef.value) {
            // Jalankan scanner
            codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.value, (result, err, controls) => {
                if (result) {
                    form.value.barcode = result.getText();
                    // Simpan stream aktif untuk dimatikan nanti
                    activeStream = videoRef.value?.srcObject as MediaStream;
                    stopScanner();
                }
            });
        }
    } catch (err) {
        console.error("Error starting scanner:", err);
        alert("Gagal mengakses kamera. Pastikan sudah mengizinkan akses kamera.");
        showScanner.value = false;
    }
};

const stopScanner = () => {
    // hentikan pemindaian (ZXing versi baru pakai controls.stop())
    if (videoRef.value && videoRef.value.srcObject) {
        const stream = videoRef.value.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.value.srcObject = null;
    }

    // Pastikan kamera dimatikan
    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
    }

    showScanner.value = false;
};

</script>

<style scoped>
.input {
    @apply border w-full;
}
</style>
