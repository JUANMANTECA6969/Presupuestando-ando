const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { crearApp } = require('../app');

// Cliente OpenAI falso: devuelve la respuesta (o el error) que se le indique
let siguiente;
const openaiFalso = {
  chat: {
    completions: {
      create: async () => {
        if (siguiente instanceof Error) throw siguiente;
        return { choices: [{ message: { content: JSON.stringify(siguiente) } }] };
      },
    },
  },
};

let servidor;
let base;
before(async () => {
  servidor = crearApp({ openai: openaiFalso }).listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());

const post = async (ruta, body) => {
  const res = await fetch(base + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};

test('1. Solicitud clara que encaja con el catálogo', async () => {
  siguiente = {
    resumen: 'Web para restaurante con carta, reservas y dos idiomas.',
    servicios: [
      { id: 'web-corporativa', justificacion: 'Varias secciones.', cantidad: null },
      { id: 'pagina-adicional', justificacion: 'Página de carta.', cantidad: 1 },
      { id: 'formulario', justificacion: 'Reservas.', cantidad: null },
      { id: 'segundo-idioma', justificacion: 'Dos idiomas.', cantidad: null },
    ],
    dudas: [],
    noIncluidos: [],
  };
  const { status, data } = await post('/api/propuesta', {
    cliente: 'Restaurante Ficticio SL',
    descripcion: 'Necesito una web para un restaurante. Quiero mostrar la carta, reservas y dos idiomas.',
  });
  assert.equal(status, 200);
  assert.deepEqual(data.servicios.map((s) => s.id), ['web-corporativa', 'pagina-adicional', 'formulario', 'segundo-idioma']);
  assert.equal(data.servicios[1].cantidad, 1);
});

test('2. Solicitud ambigua: se devuelven dudas y cantidad inválida queda pendiente', async () => {
  siguiente = {
    resumen: 'Web sencilla, alcance poco definido.',
    servicios: [
      { id: 'web-landing', justificacion: 'Opción mínima.', cantidad: null },
      { id: 'pagina-adicional', justificacion: 'Quizá más secciones.', cantidad: 0 },
    ],
    dudas: ['¿Cuántas secciones necesitas?'],
    noIncluidos: [],
  };
  const { status, data } = await post('/api/propuesta', { cliente: 'Cliente Prueba', descripcion: 'Quiero algo en internet.' });
  assert.equal(status, 200);
  assert.equal(data.dudas.length, 1);
  assert.equal(data.servicios.find((s) => s.id === 'pagina-adicional').cantidad, null);
});

test('3. Servicio que no ofrecemos: va a noIncluidos y se descartan ids inventados', async () => {
  siguiente = {
    resumen: 'Tienda online.',
    servicios: [
      { id: 'web-corporativa', justificacion: 'Base.', cantidad: null },
      { id: 'tienda-online', justificacion: 'Inventado.', cantidad: null },
    ],
    dudas: [],
    noIncluidos: ['Pasarela de pago y tienda online'],
  };
  const { status, data } = await post('/api/propuesta', { cliente: 'Tienda Demo', descripcion: 'Quiero vender online con pagos.' });
  assert.equal(status, 200);
  assert.deepEqual(data.servicios.map((s) => s.id), ['web-corporativa']);
  assert.equal(data.noIncluidos.length, 2);
  assert.match(data.noIncluidos[1], /tienda-online/);
});

test('4. Descripción vacía o demasiado larga', async () => {
  let r = await post('/api/propuesta', { cliente: 'X', descripcion: '   ' });
  assert.equal(r.status, 400);
  r = await post('/api/propuesta', { cliente: 'X', descripcion: 'a'.repeat(2001) });
  assert.equal(r.status, 400);
  r = await post('/api/propuesta', { cliente: '', descripcion: 'Una web' });
  assert.equal(r.status, 400);
});

test('5. Fallo en la llamada a OpenAI: 502 reintentable', async () => {
  siguiente = new Error('Connection error');
  const { status, data } = await post('/api/propuesta', { cliente: 'X', descripcion: 'Una web' });
  assert.equal(status, 502);
  assert.equal(data.reintentable, true);
});

test('6. Modificación de servicios antes del PDF: el servidor recalcula', async () => {
  const { status, data } = await post('/api/presupuesto-final', {
    cliente: 'Restaurante Ficticio SL',
    resumen: 'Web restaurante',
    // El usuario quita el segundo idioma, sube a 3 páginas extra e intenta colar un precio
    servicios: [
      { id: 'web-corporativa', precio: 1 },
      { id: 'pagina-adicional', cantidad: 3 },
      { id: 'formulario' },
    ],
    aclaraciones: ['Confirmar horario de reservas'],
  });
  assert.equal(status, 200);
  assert.equal(data.total, 600 + 150 + 80);
  assert.equal(data.lineas[0].importe, 600);
  assert.deepEqual(data.aclaraciones, ['Confirmar horario de reservas']);
});

test('6b. Selección incompleta o inválida se rechaza', async () => {
  const casos = [
    [{ id: 'formulario' }], // sin tipo de web
    [{ id: 'web-landing' }, { id: 'web-corporativa' }], // dos tipos
    [{ id: 'web-landing' }, { id: 'pagina-adicional' }], // falta cantidad
    [{ id: 'web-landing' }, { id: 'hosting' }], // no existe
  ];
  for (const servicios of casos) {
    const { status } = await post('/api/presupuesto-final', { cliente: 'X', servicios });
    assert.equal(status, 400);
  }
});

test('Endpoint antiguo /api/presupuesto sigue funcionando', async () => {
  const { data } = await post('/api/presupuesto', { tipo: 'corporativa', paginas: 4, formulario: true, segundoIdioma: false });
  assert.equal(data.total, 830);
});
