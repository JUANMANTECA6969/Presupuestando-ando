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

## Estructura

```
backend/
  calculadora.js   # Tarifas y función de cálculo
  server.js        # Rutas Express y validación
frontend/
  src/App.tsx      # Formulario y vista del presupuesto
  src/components/ui/  # Componentes shadcn
PRUEBAS.md         # Casos de prueba
```
