describe('Financial Engine — Idempotency Control', () => {
  it('debe garantizar que dos solicitudes con la misma clave no generen doble cobro', () => {
    const ledger = new Map<string, any>();
    const idempotencyKey = 'idemp_live_998877';

    const executePayment = (key: string, amount: number) => {
      if (ledger.has(key)) {
        return { isDuplicate: true, record: ledger.get(key) };
      }
      const record = { id: 'tx_uuid_123', amount, status: 'AUTHORIZED' };
      ledger.set(key, record);
      return { isDuplicate: false, record };
    };

    // Primer cobro
    const res1 = executePayment(idempotencyKey, 45000);
    expect(res1.isDuplicate).toBe(false);
    expect(res1.record.status).toBe('AUTHORIZED');

    // Reintento por desconexión de red
    const res2 = executePayment(idempotencyKey, 45000);
    expect(res2.isDuplicate).toBe(true);
    expect(res2.record.id).toBe('tx_uuid_123');
    expect(ledger.size).toBe(1);
  });
});
