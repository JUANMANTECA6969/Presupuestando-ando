// Tarifas base del sistema (ficticias)
const TARIFAS = {
  landing: 300,
  corporativa: 600,
  paginaAdicional: 50,
  formulario: 80,
  segundoIdioma: 150,
  moneda: 'EUR',
};

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

module.exports = { TARIFAS, calcularPresupuesto };
