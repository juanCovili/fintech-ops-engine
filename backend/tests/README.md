# 🧪 Suite de Pruebas & Calidad — Financial Ops Engine

Esta carpeta contiene la suite de pruebas automatizadas del microservicio financiero y del worker de conciliación, implementadas con **Jest** y **ts-jest**.

---

## 🎯 Pirámide de Pruebas & Cobertura

```
               /\\
              /  \\     Pruebas de Integración (Idempotencia & Flow E2E)
             /────\\    -----------------------------------------------
            /      \\    Pruebas Unitarias (Matemática Financiera, IVA, RUT)
           /────────\\
```

### 1. Pruebas Unitarias (`paymentService.test.ts`)
* **Cálculo de IVA (19% Chile):** Valida la separación exacta entre Monto Neto y Débito Fiscal IVA sin pérdida de centavos/redondeo para boletas y facturas electrónicas.
* **Validación de RUT:** Verifica la integridad del formato de identificación tributaria chilena.
* **Manejo de Excepciones:** Asegura que montos `<= 0` o valores corruptos sean rechazados antes de llegar al ledger.

### 2. Pruebas de Idempotencia (`idempotency.test.ts`)
* Simula solicitudes concurrentes de red con el mismo `idempotencyKey` para verificar que:
  * El primer intento autorice y cobre.
  * El segundo intento devuelva el estado existente con código HTTP `200` (**Idempotency Hit**) sin duplicar el cobro ni el registro en base de datos.

### 3. Pruebas de Conciliación & Worker (`reconciliationWorker.test.ts`)
* Verifica la generación de folios DTE (`DTE-XXXXXX`) y Track IDs del SII.
* Valida el mecanismo de reintentos exponenciales en caso de caída temporal del servicio tributario.

---

## 🚀 Comandos de Ejecución

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con reporte de cobertura detallado
npm test -- --coverage

# Modo observador (TDD / watch mode)
npm test -- --watch
```
