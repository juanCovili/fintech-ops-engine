import mongoose, { Schema, Document } from 'mongoose';

export type TransactionStatus = 'PENDING' | 'AUTHORIZED' | 'RECONCILED' | 'SII_EMITTED' | 'FAILED';

export interface ITransaction extends Document {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  netAmount: number;
  ivaAmount: number;
  currency: string;
  customerRut: string;
  status: TransactionStatus;
  siiFolio?: string;
  siiTrackId?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    ivaAmount: { type: Number, required: true },
    currency: { type: String, default: 'CLP' },
    customerRut: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'RECONCILED', 'SII_EMITTED', 'FAILED'],
      default: 'PENDING',
    },
    siiFolio: { type: String },
    siiTrackId: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransaction>('Transaction', TransactionSchema);
