# Presupuestador Web

Calculadora de presupuestos para páginas web.

- **backend/**: API REST con Node.js + Express (puerto **3000**)
- **frontend/**: React + Vite + TypeScript + TailwindCSS + shadcn/ui (puerto **5173**)

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

```bash
# Backend
cd backend
npm install

# Frontend (en otra terminal)
cd frontend
npm install
```

## Clave de OpenAI

La llamada a OpenAI se hace **solo desde el servidor**. La clave va en una variable de entorno y nunca en el repositorio:

```bash
cd backend
cp .env.example .env   # y rellena OPENAI_API_KEY (opcional: OPENAI_MODEL)
```

`.env` está en `.gitignore`. Sin clave, `/api/propuesta` responde 502 con un mensaje claro y la calculadora rápida sigue funcionando.

## Arrancar los servidores

Hay que tener **los dos** en marcha, cada uno en su terminal.

```bash
# Terminal 1: backend en http://localhost:3000
cd backend
npm start

# Terminal 2: frontend en http://localhost:5173
cd frontend
npm run dev
```

Después, abre **http://localhost:5173** en el navegador.

## Tarifas

| Concepto                                | Precio |
| --------------------------------------- | -----: |
| Landing (incluye la 1ª página)          |  300 € |
| Corporativa (incluye la 1ª página)      |  600 € |
| Página adicional (a partir de la 2ª)    |   50 € |
| Formulario de contacto                  |   80 € |
| Segundo idioma                          |  150 € |

## API

### `GET /api/estado`

Comprueba que el servidor está activo.

```json
{ "status": "ok" }
```

### `GET /api/tarifas`

Devuelve las tarifas base.

```json
{ "landing": 300, "corporativa": 600, "paginaAdicional": 50, "formulario": 80, "segundoIdioma": 150, "moneda": "EUR" }
```

### `POST /api/presupuesto`

Body (JSON):

| Campo           | Tipo      | Reglas                                 |
| --------------- | --------- | -------------------------------------- |
| `tipo`          | string    | `"landing"` o `"corporativa"`          |
| `paginas`       | number    | Entero entre 1 y 20 (`"4"` no vale)    |
| `formulario`    | boolean   | `true` / `false` (`"false"` no vale)   |
| `segundoIdioma` | boolean   | `true` / `false` (`"false"` no vale)   |

Las propiedades adicionales se ignoran.

**200 OK**

```json
{ "base": 600, "paginasAdicionales": 150, "formulario": 80, "segundoIdioma": 0, "total": 830, "moneda": "EUR" }
```

**400 Bad Request**

```json
{ "error": "El campo \"paginas\" debe ser un número entero entre 1 y 20." }
```

Ejemplo con curl:

```bash
curl -X POST http://localhost:3000/api/presupuesto \
  -H "Content-Type: application/json" \
  -d '{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}'
```

### `GET /api/catalogo`

Catálogo de servicios (`id`, `nombre`, `descripcion`, `precio`, y `unidad/min/max` si necesita cantidad).

| id                 | Servicio            | Precio            |
| ------------------ | ------------------- | ----------------: |
| `web-landing`      | Landing page        | 300 €             |
| `web-corporativa`  | Web corporativa     | 600 €             |
| `pagina-adicional` | Páginas adicionales | 50 € / página (1-19) |
| `formulario`       | Formulario          | 80 €              |
| `segundo-idioma`   | Segundo idioma      | 150 €             |

Regla: hay que elegir **exactamente un** tipo de web (landing o corporativa).

### `POST /api/propuesta`

Body: `{ "cliente": string (1-100), "descripcion": string (1-2000) }`.
Envía la descripción y el catálogo (sin precios) a OpenAI con *Structured Outputs* (JSON Schema estricto, `id` limitado al catálogo). El servidor vuelve a validar la respuesta: descarta ids desconocidos o repetidos, cantidades fuera de rango y tipos de web duplicados.

```json
{ "resumen": "...", "servicios": [{ "id": "formulario", "nombre": "...", "descripcion": "...", "justificacion": "...", "cantidad": null }],
  "dudas": ["..."], "noIncluidos": ["Tienda online"] }
```

Errores: `400` (validación) · `502` con `"reintentable": true` (fallo de OpenAI).

### `POST /api/presupuesto-final`

Body: `{ cliente, resumen, servicios: [{ id, cantidad? }], aclaraciones: string[] }`.
Valida la selección final y calcula **todos** los importes con las tarifas del servidor (cualquier precio enviado por el cliente se ignora). Su respuesta es lo único que se usa para generar el PDF.

## Flujo del asistente

1. El cliente escribe su nombre y qué necesita.
2. La IA propone servicios del catálogo con justificación, dudas y necesidades no incluidas.
3. El usuario quita/añade servicios, completa cantidades (no puede continuar si faltan) y edita resumen y aclaraciones.
4. El servidor calcula el presupuesto.
5. Vista previa del PDF → «Aceptar y descargar».

## PDF: librerías valoradas

| Librería | Dónde | Valoración |
| --- | --- | --- |
| **jsPDF + jspdf-autotable** ✅ | Navegador | Ligera, texto real (seleccionable), tablas con salto de página automático. Sin servidor, ideal para Vercel. **Elegida.** |
| pdfmake | Navegador/Node | Muy buena, definición declarativa; más pesada (fuentes embebidas ~1 MB). Buena alternativa. |
| @react-pdf/renderer | Navegador/Node | PDF con componentes React; potente pero bundle grande y CSS limitado. |
| PDFKit | Node | Sólida en servidor, API de bajo nivel (posiciones a mano). |
| pdf-lib | Ambos | Para **modificar** PDFs existentes/rellenar formularios, no para maquetar desde cero. |
| Puppeteer / Playwright | Node | HTML→PDF perfecto, pero descarga Chromium (~150 MB): lento y problemático en funciones serverless. |
| html2pdf.js / html2canvas | Navegador | **Evitar**: hace una captura de pantalla → texto no seleccionable, borroso y cortes de página malos. |

## Despliegue en Vercel

En la raíz: `vercel.json`, `package.json` (dependencias de la función) y `api/index.js`, que reutiliza la app Express de `backend/app.js`. El frontend se publica desde `frontend/dist` y `/api/*` se redirige a la función.

1. Importa el repositorio en Vercel (Root Directory: la raíz del repo).
2. En *Settings → Environment Variables* añade `OPENAI_API_KEY` (y opcionalmente `OPENAI_MODEL`).
3. Deploy.

## Tests

```bash
cd backend && npm test
```

## Estructura

```
api/index.js       # Función serverless de Vercel
backend/
  calculadora.js   # Tarifas, catálogo y cálculo
  ia.js            # Instrucciones, esquema y llamada a OpenAI + validación
  app.js           # Rutas Express y validación
  server.js        # Arranque local (lee .env)
  test/            # Tests con OpenAI simulado
frontend/
  src/App.tsx                        # Pestañas
  src/components/Asistente.tsx       # Solicitud → revisión → presupuesto → PDF
  src/components/CalculadoraRapida.tsx  # Calculadora anterior
  src/lib/pdf.ts                     # Generación del PDF (jsPDF)
  src/components/ui/  # Componentes shadcn
PRUEBAS.md         # Casos de prueba
```
