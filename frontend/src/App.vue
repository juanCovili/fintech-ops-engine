<template>
  <div class="min-h-screen bg-[#0b0f19] text-gray-100 p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-800 gap-4">
      <div>
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Financial Operating System (OS)</h1>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            APIO Architecture
          </span>
        </div>
        <p class="text-sm text-gray-400 mt-1">
          Orquestador de Pagos en Tiempo Real, Colas de Trabajo Redis y Conciliación con SII
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="simulatePayment"
          :disabled="loading"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
        >
          <span v-if="loading">Encolando...</span>
          <span v-else>+ Disparar Pago Idempotente</span>
        </button>
        <button
          @click="fetchData"
          class="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition"
        >
          ↻ Refrescar
        </button>
      </div>
    </header>

    <!-- Metricas Principales -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
      <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
        <span class="text-xs font-medium text-gray-400 uppercase">Volumen Procesado</span>
        <div class="text-2xl font-bold text-white mt-1">\${{ formatCLP(metrics.totalVolume) }} CLP</div>
        <span class="text-xs text-emerald-400">100% conciliado</span>
      </div>
      <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
        <span class="text-xs font-medium text-gray-400 uppercase">Total Transacciones</span>
        <div class="text-2xl font-bold text-white mt-1">{{ metrics.transactionCount }}</div>
        <span class="text-xs text-gray-400">Idempotency rate: 100%</span>
      </div>
      <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
        <span class="text-xs font-medium text-gray-400 uppercase">Estado Cola Redis</span>
        <div class="text-2xl font-bold text-emerald-400 mt-1">Activo (BullMQ)</div>
        <span class="text-xs text-gray-400">Workers: 5 concurrentes</span>
      </div>
      <div class="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
        <span class="text-xs font-medium text-gray-400 uppercase">Integración SII (DTE)</span>
        <div class="text-2xl font-bold text-blue-400 mt-1">Operativa</div>
        <span class="text-xs text-gray-400">Retención IVA 19% calculada</span>
      </div>
    </div>

    <!-- Feed de Transacciones -->
    <div class="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mt-6">
      <div class="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
        <h2 class="text-base font-semibold text-white">Transacciones Recientes & DTE Emitidos</h2>
        <span class="text-xs text-gray-400">Actualización en vivo</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-300">
          <thead class="bg-gray-950/60 text-xs uppercase text-gray-400 border-b border-gray-800">
            <tr>
              <th class="px-6 py-3">ID Orden</th>
              <th class="px-6 py-3">RUT Cliente</th>
              <th class="px-6 py-3">Monto Total</th>
              <th class="px-6 py-3">Neto / IVA</th>
              <th class="px-6 py-3">Estado</th>
              <th class="px-6 py-3">Folio SII</th>
              <th class="px-6 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/60">
            <tr v-for="tx in transactions" :key="tx._id" class="hover:bg-gray-800/30 transition">
              <td class="px-6 py-3 font-mono text-xs text-emerald-400 font-medium">{{ tx.orderId }}</td>
              <td class="px-6 py-3 font-mono text-xs">{{ tx.customerRut }}</td>
              <td class="px-6 py-3 font-semibold text-white">\${{ formatCLP(tx.amount) }}</td>
              <td class="px-6 py-3 text-xs text-gray-400">
                \${{ formatCLP(tx.netAmount) }} / \${{ formatCLP(tx.ivaAmount) }}
              </td>
              <td class="px-6 py-3">
                <span
                  :class="{
                    'bg-emerald-950 text-emerald-400 border-emerald-800': tx.status === 'SII_EMITTED',
                    'bg-amber-950 text-amber-400 border-amber-800': tx.status === 'AUTHORIZED',
                    'bg-red-950 text-red-400 border-red-800': tx.status === 'FAILED',
                  }"
                  class="px-2 py-0.5 rounded text-[11px] font-semibold border inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="tx.status === 'SII_EMITTED' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                  {{ tx.status }}
                </span>
              </td>
              <td class="px-6 py-3 font-mono text-xs text-gray-300">
                {{ tx.siiFolio || 'Pendiente' }}
              </td>
              <td class="px-6 py-3 text-xs text-gray-500">
                {{ new Date(tx.createdAt).toLocaleTimeString() }}
              </td>
            </tr>
            <tr v-if="transactions.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                No hay transacciones registradas. Haz clic en "+ Disparar Pago Idempotente" para simular una.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const transactions = ref<any[]>([]);
const metrics = ref({ totalVolume: 0, transactionCount: 0 });
const loading = ref(false);

const API_BASE = 'http://localhost:4000/api';

const formatCLP = (val: number) => {
  return new Intl.NumberFormat('es-CL').format(val || 0);
};

const fetchData = async () => {
  try {
    const res = await fetch(`${API_BASE}/transactions`);
    if (res.ok) {
      const data = await res.json();
      transactions.value = data.transactions;
      metrics.value = data.metrics;
    }
  } catch (e) {
    console.error('Error fetching data:', e);
  }
};

const simulatePayment = async () => {
  loading.value = true;
  try {
    const randomAmount = Math.floor(Math.random() * 80000) + 10000;
    const randomRut = `${Math.floor(Math.random() * 10000000) + 15000000}-${Math.floor(Math.random() * 9)}`;
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    await fetch(`${API_BASE}/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey,
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
        amount: randomAmount,
        customerRut: randomRut,
      }),
    });

    await fetchData();
  } catch (e) {
    console.error('Error simulating payment:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
  setInterval(fetchData, 4000);
});
</script>
