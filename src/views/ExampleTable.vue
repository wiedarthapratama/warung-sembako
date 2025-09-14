<template>
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto my-8">
        <h2 class="text-2xl font-semibold mb-4 text-gray-800">Tabel Sederhana</h2>
        <div class="overflow-x-auto">
            <table class="w-full text-left table-auto">
                <thead>
                    <tr class="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6">Nama Produk</th>
                        <th class="py-3 px-6">Jumlah</th>
                        <th class="py-3 px-6">Harga</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-6">Gula Pasir</td>
                        <td class="py-3 px-6">5 kg</td>
                        <td class="py-3 px-6">Rp 75.000</td>
                    </tr>
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-6">Tepung Terigu</td>
                        <td class="py-3 px-6">10 kg</td>
                        <td class="py-3 px-6">Rp 120.000</td>
                    </tr>
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-6">Minyak Goreng</td>
                        <td class="py-3 px-6">2 L</td>
                        <td class="py-3 px-6">Rp 30.000</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>