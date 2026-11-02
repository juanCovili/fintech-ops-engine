import { CONFIG } from '../config';

export interface CreatePaymentDTO {
  idempotencyKey: string;
  orderId: string;
  amount: number;
  customerRut: string;
}

export class PaymentService {
  /**
   * Calcula el desglose neto e IVA para documentos tributarios chilenos (SII).
   */
  static calculateTaxBreakdown(totalAmount: number): { netAmount: number; ivaAmount: number } {
    if (totalAmount <= 0) {
      throw new Error('El monto de la transacción debe ser mayor a 0');
    }
    const netAmount = Math.round(totalAmount / (1 + CONFIG.IVA_PERCENTAGE));
    const ivaAmount = totalAmount - netAmount;
    return { netAmount, ivaAmount };
  }

  /**
   * Valida formato básico de RUT Chileno.
   */
  static validateRut(rut: string): boolean {
    const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
    return cleanRut.length >= 8 && cleanRut.length <= 9;
  }
}
