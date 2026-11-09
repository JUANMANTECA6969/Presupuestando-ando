const express = require('express');
const cors = require('cors');
const { TARIFAS, CATALOGO, calcularPresupuesto, validarSeleccion, calcularLineas } = require('./calculadora');
const { generarPropuesta, ErrorIA } = require('./ia');

const MAX_CLIENTE = 100;
const MAX_DESCRIPCION = 2000;
const MAX_ACLARACIONES = 20;

// openai: cliente opcional (se inyecta en los tests)
function crearApp({ openai } = {}) {
  const app = express();

  app.use(express.json({ limit: '50kb' }));
  app.use(cors());

  app.get('/api/estado', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tarifas', (req, res) => {
    res.json(TARIFAS);
  });

  app.get('/api/catalogo', (req, res) => {
    res.json({ servicios: CATALOGO, moneda: TARIFAS.moneda });
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

  // Devuelve el nombre del cliente validado o un error
  function validarCliente(cliente) {
    if (typeof cliente !== 'string' || !cliente.trim()) {
      return { error: 'Indica el nombre del cliente o empresa.' };
    }
    if (cliente.trim().length > MAX_CLIENTE) {
      return { error: `El nombre no puede superar ${MAX_CLIENTE} caracteres.` };
    }
    return { valor: cliente.trim() };
  }

  app.post('/api/propuesta', async (req, res) => {
    const { cliente, descripcion } = req.body ?? {};
    const nombre = validarCliente(cliente);
    if (nombre.error) return res.status(400).json({ error: nombre.error });

    if (typeof descripcion !== 'string' || !descripcion.trim()) {
      return res.status(400).json({ error: 'Describe tu proyecto: la descripción no puede estar vacía.' });
    }
    if (descripcion.trim().length > MAX_DESCRIPCION) {
      return res.status(400).json({ error: `La descripción no puede superar ${MAX_DESCRIPCION} caracteres.` });
    }

    try {
      const propuesta = await generarPropuesta({ cliente: nombre.valor, descripcion: descripcion.trim() }, openai);
      res.json(propuesta);
    } catch (err) {
      if (err instanceof ErrorIA) return res.status(502).json({ error: err.message, reintentable: true });
      console.error(err);
      res.status(500).json({ error: 'Error interno del servidor.', reintentable: true });
    }
  });

  // Selección confirmada por el usuario: el servidor valida y calcula todos los importes
  app.post('/api/presupuesto-final', (req, res) => {
    const { cliente, resumen, servicios, aclaraciones } = req.body ?? {};
    const nombre = validarCliente(cliente);
    if (nombre.error) return res.status(400).json({ error: nombre.error });

    const seleccion = validarSeleccion(servicios);
    if (seleccion.error) return res.status(400).json({ error: seleccion.error });

    const notas = (Array.isArray(aclaraciones) ? aclaraciones : [])
      .filter((a) => typeof a === 'string' && a.trim())
      .map((a) => a.trim().slice(0, 300))
      .slice(0, MAX_ACLARACIONES);

    res.json({
      cliente: nombre.valor,
      fecha: new Date().toISOString(),
      resumen: typeof resumen === 'string' ? resumen.trim().slice(0, 1000) : '',
      ...calcularLineas(seleccion.lineas),
      aclaraciones: notas,
    });
  });

  // JSON mal formado
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
    }
    next(err);
  });

  return app;
}

module.exports = { crearApp };
