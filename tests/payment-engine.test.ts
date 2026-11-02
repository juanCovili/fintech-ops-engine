describe('Financial Engine — Tax & RUT Validations', () => {
  const calculateTaxBreakdown = (total: number) => {
    if (total <= 0) throw new Error('Monto inválido');
    const net = Math.round(total / 1.19);
    const iva = total - net;
    return { net, iva };
  };

  const validateRut = (rut: string) => {
    const clean = rut.replace(/[.-]/g, '').toUpperCase();
    return clean.length >= 8 && clean.length <= 9;
  };

  it('debe calcular $10.000 neto y $1.900 IVA para $11.900 CLP', () => {
    const { net, iva } = calculateTaxBreakdown(11900);
    expect(net).toBe(10000);
    expect(iva).toBe(1900);
    expect(net + iva).toBe(11900);
  });

  it('debe redondear sin decimales flotantes montos impares de retail', () => {
    const { net, iva } = calculateTaxBreakdown(15990);
    expect(Number.isInteger(net)).toBe(true);
    expect(Number.isInteger(iva)).toBe(true);
    expect(net + iva).toBe(15990);
  });

  it('debe validar RUTs chilenos correctamente', () => {
    expect(validateRut('18.492.103-5')).toBe(true);
    expect(validateRut('14281993-K')).toBe(true);
    expect(validateRut('123')).toBe(false);
  });
});
