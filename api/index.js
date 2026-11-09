// Punto de entrada serverless para Vercel: reutiliza la misma app Express del backend
const { crearApp } = require('../backend/app');

module.exports = crearApp();
