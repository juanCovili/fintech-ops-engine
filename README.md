# ⚡ Financial Operating System (OS) — Microservicios & Conciliación SII

[![CI/CD Pipeline](https://github.com/juanCovili/fintech-ops-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/juanCovili/fintech-ops-engine/actions)
[![Live Demo](https://img.shields.io/badge/Demo-GitHub%20Pages%20Live-brightgreen.svg)](https://juanCovili.github.io/fintech-ops-engine/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-emerald.svg)](https://vuejs.org/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Production%20Ready-326CE5.svg)](https://kubernetes.io/)
[![Jest Tests](https://img.shields.io/badge/Tests-Jest%20Passing-success.svg)](backend/tests/)

> **Showcase de Arquitectura Financiera & DevOps:** Plataforma desacoplada de orquestación de pagos de alto tráfico, colas asíncronas con **Redis / BullMQ**, cálculo tributario chileno (19% IVA) y conciliación con el **SII (Documentos Tributarios Electrónicos - DTE)**, empaquetado en contenedores **Docker** y desplegado en **Kubernetes (HPA + Probes)** con integración continua en **GitHub Actions**.

👉 **[PROBAR DEMO INTERACTIVA EN VIVO (GitHub Pages)](https://juanCovili.github.io/fintech-ops-engine/)**

---

## 🏗️ Diagrama de Arquitectura en Kubernetes

```mermaid
flowchart TD
    Client(["🌐 Cliente / Navegador"]) -->|HTTPS| Ingress["Ingress Controller (Nginx)"]
    
    subgraph K8s["☸️ Cluster Kubernetes (Namespace: fintech-ops)"]
        Ingress -->|/api| SvcAPI["Service: backend-service"]
        Ingress -->|/| SvcUI["Service: frontend-service"]
        
        subgraph PodsAPI["ReplicaSet: API Gateway (HPA 2 - 10 Pods)"]
            Pod1["Node.js / Express API Pod 1"]
            Pod2["Node.js / Express API Pod 2"]
        end
        
        SvcAPI --> Pod1
        SvcAPI --> Pod2
        
        Pod1 -->|Idempotent Store| MongoSvc["Service: mongo-service"]
        Pod1 -->|Enqueue Job| RedisSvc["Service: redis-service"]
        
        MongoSvc --> Mongo[("MongoDB 7.0 Cluster")]
        RedisSvc --> Redis[("Redis 7.2 Broker")]
        
        subgraph Workers["Workers Desacoplados (Reconciliation)"]
            W1["Worker Pod 1"]
            W2["Worker Pod 2"]
        end
        
        Redis -->|Consume Task| W1
        Redis -->|Consume Task| W2
        
        W1 -->|Emit DTE / Update Ledger| Mongo
        W2 -->|Emit DTE / Update Ledger| Mongo
    end

    W1 -.->|Certificado Digital| SII["🏛️ SII Chile (DTE API)"]
    W2 -.->|Certificado Digital| SII
```

---

## 🔄 Flujo Transaccional & Conciliación Tributaria

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario / Checkout
    participant API as API Gateway (Node.js/TS)
    participant DB as MongoDB (Idempotency Store)
    participant Q as Redis Queue (BullMQ)
    participant W as Worker Conciliación
    participant SII as SII Chile (DTE)

    User->>API: POST /api/payments/process (Idempotency-Key, RUT, Monto)
    API->>DB: Verificar Idempotency-Key
    alt Clave ya existe (Duplicate Request)
        DB-->>API: Transacción previa
        API-->>User: 200 OK (Idempotency Hit - No se duplica cobro)
    else Nueva Transacción
        API->>API: Calcular Desglose Tributario (19% IVA)
        API->>DB: Guardar estado 'AUTHORIZED'
        API->>Q: Encolar tarea 'reconcile-transaction'
        API-->>User: 201 Created (Pago autorizado)
        
        Note over Q,W: Procesamiento Asíncrono Desacoplado
        Q->>W: Despachar Job (backoff exponencial en fallos)
        W->>SII: Transmitir DTE y conciliar con banco
        SII-->>W: Aprobación + Folio DTE emitido
        W->>DB: Actualizar estado a 'SII_EMITTED' + Folio
    end
```

---

## 🛠️ Stack Tecnológico Implementado

| Capa | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Backend** | `Node.js 20`, `TypeScript 5.4`, `Express` | Microservicio de pagos, control de idempotencia y API REST. |
| **Frontend** | `Vue 3`, `Vite`, `Tailwind CSS`, `TypeScript` | Panel de control en tiempo real con monitoreo de métricas y feed transaccional. |
| **Colas & Caché** | `Redis 7`, `BullMQ` | Procesamiento asíncrono desacoplado, reintentos con backoff exponencial. |
| **Base de Datos** | `MongoDB 7.0`, `Mongoose` | Almacenamiento no relacional indexado con claves de idempotencia únicas. |
| **DevOps / Infra** | `Docker`, `Docker Compose`, `Kubernetes (K8s)` | Despliegue contenerizado, Horizontal Pod Autoscaling (HPA) y Probes de salud. |
| **Calidad & CI/CD** | `Jest`, `ts-jest`, `GitHub Actions` | Pruebas unitarias de desglose tributario, validación de RUT y pipeline automatizado. |

---

## 🔒 Patrones Financieros & Resiliencia

1. **Idempotencia Garantizada:** Cada transacción requiere un `idempotencyKey` único en base de datos. Si la red se corta y el cliente reintenta, el sistema devuelve la transacción original sin duplicar el cobro.
2. **Desglose Tributario Automático (SII Chile):** Cálculo exacto de monto neto y 19% de IVA para facturación electrónica DTE.
3. **Workers Desacoplados con BullMQ:** Si el servidor del SII o el banco experimenta latencia o caída temporal, los pagos no se bloquean: quedan seguros en la cola de Redis y se reintentan automáticamente con backoff exponencial.
4. **Zero-Downtime en Kubernetes:** Manifiestos con `readinessProbe` y `livenessProbe` para que el tráfico solo llegue a pods 100% listos. `HorizontalPodAutoscaler` (HPA) escala de 2 a 10 réplicas al superar 70% de CPU.

---

## 🚀 Despliegue Rápido Local (1 Comando)

### Prerrequisitos
- Docker & Docker Compose instalados.

### Ejecución:
```bash
# 1. Clonar el repositorio
git clone https://github.com/juanCovili/fintech-ops-engine.git
cd fintech-ops-engine

# 2. Levantar todo el stack contenerizado (Mongo + Redis + API + Worker + Vue UI)
docker compose up --build
```
- **Panel Web (Vue 3):** `http://localhost:3000`
- **API Healthz:** `http://localhost:4000/healthz`
- **Simulación:** Abre el panel web y presiona `+ Disparar Pago Idempotente`. Verás el pago pasar de `AUTHORIZED` a `SII_EMITTED` en menos de 2 segundos.

---

## ☸️ Despliegue en Kubernetes (Producción)

```bash
# Aplicar todos los manifiestos ordenados en el namespace 'fintech-ops'
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/
```

Para verificar pods y autoscaling:
```bash
kubectl get pods -n fintech-ops
kubectl get hpa -n fintech-ops
```

---

## 🧪 Pruebas Unitarias & Cobertura (Jest)

Documentación completa en [`backend/tests/README.md`](backend/tests/README.md).

```bash
cd backend
npm test
```
* Pruebas de cálculo de IVA chileno (19%) sin desfase de decimales.
* Validación de formato de RUT chileno.
* Pruebas de concurrencia y claves de idempotencia.
* Validación de generación de Folios DTE y Track IDs.

---

## 👤 Autor
**Juan Covili** — Ingeniero en Informática (INACAP)  
[LinkedIn](https://www.linkedin.com/in/juanCovili/) • [GitHub](https://github.com/juanCovili)
