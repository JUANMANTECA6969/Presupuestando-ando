# Casos de prueba: `POST /api/presupuesto`

Ejecutados contra el backend en `http://localhost:3000` con `curl`.

| # | Caso | Solicitud (body JSON) | Resultado esperado | Resultado obtenido |
|---|------|-----------------------|--------------------|--------------------|
| 1 | Landing 1 página sin extras | `{"tipo":"landing","paginas":1,"formulario":false,"segundoIdioma":false}` | 200, total 300 | ✅ 200, `total: 300` |
| 2 | Corporativa 4 páginas + formulario | `{"tipo":"corporativa","paginas":4,"formulario":true,"segundoIdioma":false}` | 200, total 830 (600+150+80) | ✅ 200, `total: 830` |
| 3 | Corporativa 20 páginas + todos los extras | `{"tipo":"corporativa","paginas":20,"formulario":true,"segundoIdioma":true}` | 200, total 1780 (600+950+80+150) | ✅ 200, `total: 1780` |
| 4 | Propiedades extra (hacker input) ignoradas | `{"tipo":"landing","paginas":3,"formulario":false,"segundoIdioma":true,"precio":0,"admin":true}` | 200, total 550 (300+100+150) | ✅ 200, `total: 550` |
| 5 | Tipo no válido | `{"tipo":"tienda","paginas":1,"formulario":false,"segundoIdioma":false}` | 400, error de `tipo` | ✅ 400, `El campo "tipo" debe ser "landing" o "corporativa".` |
| 6 | Páginas fuera de rango (21) | `{"tipo":"landing","paginas":21,"formulario":false,"segundoIdioma":false}` | 400, error de `paginas` | ✅ 400, `El campo "paginas" debe ser un número entero entre 1 y 20.` |
| 7 | Páginas como string `"4"` | `{"tipo":"landing","paginas":"4","formulario":false,"segundoIdioma":false}` | 400, error de `paginas` | ✅ 400, `El campo "paginas" debe ser un número entero entre 1 y 20.` |
| 8 | Booleano como string `"false"` | `{"tipo":"landing","paginas":1,"formulario":"false","segundoIdioma":false}` | 400, error de `formulario` | ✅ 400, `El campo "formulario" debe ser booleano (true/false).` |
| 9 | Falta un campo obligatorio | `{"tipo":"landing","paginas":1,"formulario":false}` | 400, error de `segundoIdioma` | ✅ 400, `El campo "segundoIdioma" debe ser booleano (true/false).` |

Resultado: **9/9 casos superados.**
