<template>
  <section class="page-stack">
    <div class="page-heading">
      <div>
        <p class="eyebrow">OVERVIEW</p>
        <h1>Selamat datang kembali</h1>
        <p class="page-description">Akses modul operasional dan master data warung dari satu tempat.</p>
      </div>
      <RouterLink to="/pos" class="button button-primary">Buka POS <span>→</span></RouterLink>
    </div>

    <div class="stats-grid">
      <article class="stat-card">
        <div class="stat-icon stat-icon-blue">▦</div>
        <div><span>Total Produk</span><strong>{{ totalProduk }}</strong></div>
        <small>Item di katalog</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon-green">Rp</div>
        <div><span>Nilai Katalog</span><strong>{{ formatRupiah(totalNilai) }}</strong></div>
        <small>Estimasi harga jual</small>
      </article>
      <article class="stat-card">
        <div class="stat-icon stat-icon-orange">!</div>
        <div><span>Stok Terbatas</span><strong>{{ stokTerbatas }}</strong></div>
        <small>Produk dengan unit ≤ 5</small>
      </article>
    </div>

    <div class="home-modules" aria-label="Modul warung">
      <RouterLink
        v-for="module in modules"
        :key="module.title"
        :to="module.to"
        class="home-module-card"
      >
        <span class="home-module-icon" :class="`home-module-icon-${module.color}`" aria-hidden="true">
          {{ module.icon }}
        </span>
        <span class="home-module-copy">
          <strong>{{ module.title }}</strong>
          <small>{{ module.description }}</small>
        </span>
        <span class="home-module-arrow" aria-hidden="true">→</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import { db } from '@/firebase'
import { authState } from '@/auth'

defineOptions({ name: 'WelcomeDashboard' })

const totalProduk = ref(0)
const totalNilai = ref(0)
const stokTerbatas = ref(0)
const modules = [
  { title: 'Purchase Order', description: 'Catat pembelian dan pemasok', to: '/pembelian', icon: '↙', color: 'blue' },
  { title: 'POS', description: 'Buat dan kelola transaksi penjualan', to: '/pos', icon: '▣', color: 'green' },
  { title: 'Produk', description: 'Kelola katalog dan harga produk', to: '/produk', icon: '▦', color: 'purple' },
  { title: 'Pelanggan', description: 'Lihat data dan riwayat pelanggan', to: '/pelanggan', icon: '◉', color: 'orange' },
  { title: 'Supplier', description: 'Kelola daftar pemasok', to: '/supplier', icon: '▤', color: 'teal' },
  { title: 'Utang / Piutang', description: 'Pantau dan kelola pembayaran tertunda', to: '/utang', icon: 'Rp', color: 'red' },
  { title: 'Stok', description: 'Pantau ketersediaan barang', to: '/stok', icon: '▥', color: 'indigo' },
  { title: 'Stock Opname', description: 'Catat dan tinjau hasil stok opname', to: '/stok-opname', icon: '✓', color: 'slate' },
]

const loadSummary = async () => {
  if (!authState.warungId) return
  const snapshot = await getDocs(collection(db, 'warungs', authState.warungId, 'produk'))
  const products = snapshot.docs.map((item) => item.data())
  totalProduk.value = products.length
  totalNilai.value = products.reduce((sum, item) => sum + Number(item.hargaJualReal || item.hargaJualPerUnit || 0), 0)
  stokTerbatas.value = products.filter((item) => Number(item.unit || 0) <= 5).length
}

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)

onMounted(loadSummary)
</script>

<style scoped>
.home-modules {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.home-module-card {
  display: flex;
  min-width: 0;
  min-height: 112px;
  align-items: center;
  gap: 14px;
  border: 1px solid #e6eaf0;
  border-radius: 10px;
  background: #fff;
  padding: 18px;
  color: inherit;
  text-decoration: none;
  transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
}

.home-module-card:hover {
  transform: translateY(-2px);
  border-color: #cbd9ed;
  box-shadow: 0 8px 20px #26385212;
}

.home-module-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  font-size: 19px;
  font-weight: 800;
}

.home-module-icon-blue { background: #e8f1ff; color: #2f80ed; }
.home-module-icon-green { background: #e7f8ef; color: #1b9b5b; }
.home-module-icon-purple { background: #f0eaff; color: #7652c8; }
.home-module-icon-orange { background: #fff2e2; color: #d97706; }
.home-module-icon-teal { background: #e3f7f5; color: #0f8b83; }
.home-module-icon-red { background: #ffeded; color: #d14343; }
.home-module-icon-indigo { background: #e9edff; color: #4b5fc4; }
.home-module-icon-slate { background: #edf1f5; color: #566579; }

.home-module-copy {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 5px;
}

.home-module-copy strong {
  color: #29364c;
  font-size: 13px;
}

.home-module-copy small {
  color: #8792a5;
  font-size: 11px;
  line-height: 1.45;
}

.home-module-arrow {
  flex: 0 0 auto;
  color: #a4afbf;
  font-size: 16px;
}

.home-module-card:hover .home-module-arrow {
  color: #2f80ed;
}

@media (max-width: 1100px) {
  .home-modules {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .home-modules {
    grid-template-columns: 1fr;
  }
}
</style>
