import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { CONFIG } from './config';
import { RECONCILIATION_QUEUE_NAME } from './queues/reconciliationQueue';
import { TransactionModel } from './models/Transaction';

console.log('⚡ Iniciando Worker de Conciliación Financiera y SII...');

mongoose.connect(CONFIG.MONGO_URI).then(() => {
  console.log('📦 Worker conectado a MongoDB');
});

const worker = new Worker(
  RECONCILIATION_QUEUE_NAME,
  async (job: Job) => {
    const { transactionId, orderId, amount } = job.data;
    console.log(`[Job ${job.id}] Iniciando conciliación para orden ${orderId} (\$${amount})...`);

    // Simulación de latencia de red y conexión con SII / Operador Bancario
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generación de Folio y TrackId de DTE (Documento Tributario Electrónico)
    const siiFolio = `DTE-${Math.floor(100000 + Math.random() * 900000)}`;
    const siiTrackId = `SII-TRK-${Date.now()}`;

    // Actualizar transacción a estado SII_EMITTED
    const updated = await TransactionModel.findByIdAndUpdate(
      transactionId,
      {
        status: 'SII_EMITTED',
        siiFolio,
        siiTrackId,
      },
      { new: true }
    );

    console.log(`✅ [Job ${job.id}] Orden ${orderId} conciliada con éxito. Folio SII: ${siiFolio}`);
    return { success: true, siiFolio, siiTrackId };
  },
  {
    connection: {
      host: CONFIG.REDIS.host,
      port: CONFIG.REDIS.port,
    },
    concurrency: 5,
  }
);

worker.on('failed', (job, err) => {
  console.error(`❌ [Job ${job?.id}] Falló intento de conciliación:`, err.message);
});
