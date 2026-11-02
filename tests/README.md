# 🧪 Test Suite — Financial Operating System (OS)

Esta carpeta contiene la arquitectura y especificación de pruebas unitarias, de integración y de resiliencia financiera para **APIO**.

---

## 📋 Resumen de Suites de Prueba

| Archivo | Nivel | Propósito |
| :--- | :---: | :--- |
| **`tests/payment-engine.test.ts`** | Unit | Desglose exacto de IVA (19% Chile) y validación algorítmica de RUT chileno. |
| **`tests/idempotency.test.ts`** | Integration | Control de claves de idempotencia en memoria/Redis para evitar dobles cobros concurrentes. |
| **`tests/reconciliation.test.ts`** | E2E / Async | Encolado en Redis (BullMQ), reintentos exponenciales y emisión de folios DTE para el SII. |
| **`tests/concurrency.test.ts`** | Stress | Pruebas de colisiones simultáneas bajo ráfagas de 50 transacciones por segundo. |

---

## 🚀 Comandos de Ejecución

```bash
# 1. Correr pruebas en el backend
cd backend
npm test

# 2. Generar reporte de cobertura (Coverage)
npm test -- --coverage
```
