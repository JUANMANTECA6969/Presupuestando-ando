const express = require('express');
const cors = require('cors');
const { TARIFAS, calcularPresupuesto } = require('./calculadora');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get('/api/estado', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/tarifas', (req, res) => {
  res.json(TARIFAS);
});

// Devuelve un mensaje de error o null si los datos son válidos
function validar({ tipo, paginas, formulario, segundoIdioma }) {
  if (tipo !== 'landing' && tipo !== 'corporativa') {
    return 'El campo "tipo" debe ser "landing" o "corporativa".';
  }
  if (!Number.isInteger(paginas) || paginas < 1 || paginas > 20) {
    return 'El campo "paginas" debe ser un número entero entre 1 y 20.';
  }
  if (typeof formulario !== 'boolean') {
    return 'El campo "formulario" debe ser booleano (true/false).';
  }
  if (typeof segundoIdioma !== 'boolean') {
    return 'El campo "segundoIdioma" debe ser booleano (true/false).';
  }
  return null;
}

app.post('/api/presupuesto', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  // Desestructuración: se ignoran propiedades adicionales
  const { tipo, paginas, formulario, segundoIdioma } = body;
  const datos = { tipo, paginas, formulario, segundoIdioma };

  const error = validar(datos);
  if (error) {
    return res.status(400).json({ error });
  }

  res.status(200).json(calcularPresupuesto(datos));
});

// JSON mal formado
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
