import { PaymentService } from '../src/services/paymentService';

describe('PaymentService Unit Tests', () => {
  describe('calculateTaxBreakdown (IVA Chile 19%)', () => {
    it('debe calcular correctamente el neto y el 19% de IVA para $11.900 CLP', () => {
      const { netAmount, ivaAmount } = PaymentService.calculateTaxBreakdown(11900);
      expect(netAmount).toBe(10000);
      expect(ivaAmount).toBe(1900);
      expect(netAmount + ivaAmount).toBe(11900);
    });

    it('debe calcular redondeo sin decimales para montos impares', () => {
      const { netAmount, ivaAmount } = PaymentService.calculateTaxBreakdown(15990);
      expect(Number.isInteger(netAmount)).toBe(true);
      expect(Number.isInteger(ivaAmount)).toBe(true);
      expect(netAmount + ivaAmount).toBe(15990);
    });

    it('debe lanzar un error si el monto es menor o igual a 0', () => {
      expect(() => PaymentService.calculateTaxBreakdown(0)).toThrow(
        'El monto de la transacción debe ser mayor a 0'
      );
    });
  });

  describe('validateRut', () => {
    it('debe validar RUTs chilenos correctamente', () => {
      expect(PaymentService.validateRut('12.345.678-9')).toBe(true);
      expect(PaymentService.validateRut('12345678-K')).toBe(true);
      expect(PaymentService.validateRut('123')).toBe(false);
    });
  });
});
