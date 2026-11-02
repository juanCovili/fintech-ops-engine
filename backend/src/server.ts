import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { CONFIG } from './config';
import { PaymentService } from './services/paymentService';
import { TransactionModel } from './models/Transaction';
import { reconciliationQueue } from './queues/reconciliationQueue';

const app = express();
app.use(cors());
app.use(express.json());

// Health check para Kubernetes Liveness & Readiness Probes
app.get('/healthz', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'OK' : 'DEGRADED';
  res.status(200).json({ status: 'healthy', mongo: mongoStatus, uptime: process.uptime() });
});

// Endpoint principal: Procesamiento de pago idempotente
app.post('/api/payments/process', async (req: Request, res: Response) => {
  try {
    const { idempotencyKey, orderId, amount, customerRut } = req.body;

    if (!idempotencyKey || !orderId || !amount || !customerRut) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (!PaymentService.validateRut(customerRut)) {
      return res.status(400).json({ error: 'RUT chileno inválido' });
    }

    // 1. Verificación de Idempotencia (Previene doble cobro)
    const existing = await TransactionModel.findOne({ idempotencyKey });
    if (existing) {
      return res.status(200).json({
        message: 'Transacción ya procesada previamente (Idempotency Hit)',
        transaction: existing,
      });
    }

    // 2. Cálculo tributario
    const { netAmount, ivaAmount } = PaymentService.calculateTaxBreakdown(amount);

    // 3. Crear registro autorizado
    const transaction = await TransactionModel.create({
      idempotencyKey,
      orderId,
      amount,
      netAmount,
      ivaAmount,
      customerRut,
      status: 'AUTHORIZED',
    });

    // 4. Encolar a Redis para conciliación asíncrona con SII y Banco
    await reconciliationQueue.add('reconcile-transaction', {
      transactionId: transaction._id,
      orderId: transaction.orderId,
      amount: transaction.amount,
      customerRut: transaction.customerRut,
    });

    return res.status(201).json({
      message: 'Pago autorizado exitosamente y encolado para conciliación SII',
      transaction,
    });
  } catch (error: any) {
    console.error('Error procesando pago:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Listar transacciones en tiempo real
app.get('/api/transactions', async (req: Request, res: Response) => {
  try {
    const transactions = await TransactionModel.find().sort({ createdAt: -1 }).limit(50);
    const totalVolume = await TransactionModel.aggregate([
      { $match: { status: { $ne: 'FAILED' } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      transactions,
      metrics: {
        totalVolume: totalVolume[0]?.total || 0,
        transactionCount: totalVolume[0]?.count || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Inicialización de conexiones
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(CONFIG.MONGO_URI)
    .then(() => {
      console.log('📦 Conectado a MongoDB');
      app.listen(CONFIG.PORT, () => {
        console.log(`🚀 Financial Ops API corriendo en puerto ${CONFIG.PORT}`);
      });
    })
    .catch((err) => {
      console.error('Fallo conectando a MongoDB:', err);
    });
}

export default app;
