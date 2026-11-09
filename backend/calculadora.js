// Tarifas base del sistema (ficticias)
const TARIFAS = {
  landing: 300,
  corporativa: 600,
  paginaAdicional: 50,
  formulario: 80,
  segundoIdioma: 150,
  moneda: 'EUR',
};

// Catálogo de servicios: única referencia válida para la IA y para el cálculo.
// - grupo 'base': hay que elegir exactamente uno.
// - unidad: si existe, la partida necesita una cantidad entera (min-max).
const CATALOGO = [
  {
    id: 'web-landing',
    nombre: 'Landing page',
    descripcion: 'Web de una sola página con diseño adaptable a móvil. Incluye la primera página.',
    precio: TARIFAS.landing,
    grupo: 'base',
  },
  {
    id: 'web-corporativa',
    nombre: 'Web corporativa',
    descripcion: 'Web de empresa con varias secciones y diseño adaptable a móvil. Incluye la primera página.',
    precio: TARIFAS.corporativa,
    grupo: 'base',
  },
  {
    id: 'pagina-adicional',
    nombre: 'Páginas adicionales',
    descripcion: 'Cada página extra a partir de la segunda (p. ej. carta, servicios, galería, equipo).',
    precio: TARIFAS.paginaAdicional,
    unidad: 'página',
    min: 1,
    max: 19,
  },
  {
    id: 'formulario',
    nombre: 'Formulario',
    descripcion: 'Formulario de contacto o solicitud (p. ej. reservas) que envía los datos por correo electrónico.',
    precio: TARIFAS.formulario,
  },
  {
    id: 'segundo-idioma',
    nombre: 'Segundo idioma',
    descripcion: 'Versión de todo el contenido de la web en un segundo idioma.',
    precio: TARIFAS.segundoIdioma,
  },
];

const buscarServicio = (id) => CATALOGO.find((s) => s.id === id);

// Calcula el presupuesto a partir de datos YA validados
function calcularPresupuesto({ tipo, paginas, formulario, segundoIdioma }) {
  const base = TARIFAS[tipo];
  const paginasAdicionales = (paginas - 1) * TARIFAS.paginaAdicional;
  const costeFormulario = formulario ? TARIFAS.formulario : 0;
  const costeIdioma = segundoIdioma ? TARIFAS.segundoIdioma : 0;

  return {
    base,
    paginasAdicionales,
    formulario: costeFormulario,
    segundoIdioma: costeIdioma,
    total: base + paginasAdicionales + costeFormulario + costeIdioma,
    moneda: TARIFAS.moneda,
  };
}

// Valida una selección [{ id, cantidad? }] contra el catálogo.
// Devuelve { error } o { lineas } con los servicios normalizados.
function validarSeleccion(servicios) {
  if (!Array.isArray(servicios) || servicios.length === 0) {
    return { error: 'Debes seleccionar al menos un servicio.' };
  }
  const vistos = new Set();
  const lineas = [];
  for (const item of servicios) {
    const id = item && item.id;
    const servicio = buscarServicio(id);
    if (!servicio) return { error: `El servicio "${String(id)}" no existe en el catálogo.` };
    if (vistos.has(id)) return { error: `El servicio "${servicio.nombre}" está repetido.` };
    vistos.add(id);

    let cantidad = 1;
    if (servicio.unidad) {
      cantidad = item.cantidad;
      if (!Number.isInteger(cantidad) || cantidad < servicio.min || cantidad > servicio.max) {
        return {
          error: `Indica cuántas unidades de "${servicio.nombre}" necesitas (entero entre ${servicio.min} y ${servicio.max}).`,
        };
      }
    }
    lineas.push({ servicio, cantidad });
  }
  const bases = lineas.filter((l) => l.servicio.grupo === 'base');
  if (bases.length !== 1) {
    return { error: 'Debes elegir exactamente un tipo de web: "Landing page" o "Web corporativa".' };
  }
  return { lineas };
}

// Calcula importes de una selección YA validada. Precios siempre desde el catálogo.
function calcularLineas(lineas) {
  const detalle = lineas.map(({ servicio, cantidad }) => ({
    id: servicio.id,
    nombre: servicio.nombre,
    descripcion: servicio.descripcion,
    cantidad,
    unidad: servicio.unidad ?? null,
    precioUnitario: servicio.precio,
    importe: servicio.precio * cantidad,
  }));
  return {
    lineas: detalle,
    total: detalle.reduce((suma, l) => suma + l.importe, 0),
    moneda: TARIFAS.moneda,
  };
}

module.exports = { TARIFAS, CATALOGO, buscarServicio, calcularPresupuesto, validarSeleccion, calcularLineas };
