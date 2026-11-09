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

---

# Casos de prueba: asistente IA y presupuesto en PDF

Automatizados en `backend/test/api.test.js` (`npm test`) con un cliente OpenAI **simulado**, para que sean reproducibles y no gasten saldo. Datos ficticios.

| # | Caso | Qué se comprueba | Resultado |
|---|------|------------------|-----------|
| 1 | Solicitud clara (restaurante: carta, reservas, 2 idiomas) | 200; servicios `web-corporativa`, `pagina-adicional` (1), `formulario`, `segundo-idioma` | ✅ |
| 2 | Solicitud ambigua («Quiero algo en internet») | Se devuelven `dudas`; cantidad inválida (0) queda a `null` y el usuario debe completarla | ✅ |
| 3 | Servicio no ofrecido (tienda online con pagos) | Va a `noIncluidos`; el id inventado `tienda-online` se descarta y se avisa | ✅ |
| 4 | Descripción vacía / >2000 caracteres / cliente vacío | 400 en los tres casos, sin llamar a OpenAI | ✅ |
| 5 | Fallo en la llamada a OpenAI | 502 con `reintentable: true`; la interfaz muestra el error y botón «Reintentar» | ✅ |
| 6 | Modificación antes del PDF (quitar idioma, 3 páginas extra, precio manipulado) | Total recalculado en servidor: 600 + 150 + 80 = 830 € (el `precio` enviado se ignora) | ✅ |
| 6b | Selección inválida (sin tipo de web, dos tipos, falta cantidad, id inexistente) | 400 en todos | ✅ |
| 7 | Endpoint antiguo `/api/presupuesto` | Sigue devolviendo 830 € | ✅ |

Resultado: **8/8 tests superados.**

## Pruebas manuales con la API real (rellenar tras probar con vuestra clave)

| Caso | Texto usado | Resultado observado |
|------|-------------|---------------------|
| Clara | «Necesito una web para un restaurante. Quiero mostrar la carta, tener un formulario para solicitar reservas y ofrecer el contenido en dos idiomas.» | |
| Ambigua | «Quiero tener presencia en internet para mi negocio.» | |
| No ofrecido | «Quiero una tienda online con pago con tarjeta y una app móvil.» | |
| Vacía | (vacío) | |
| Fallo OpenAI | Arrancar con `OPENAI_API_KEY=clave-falsa` | |
| Modificación | Quitar/añadir servicios y comprobar que el PDF coincide con el total | |
