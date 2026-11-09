require('dotenv').config();
const { crearApp } = require('./app');

const PORT = process.env.PORT || 3000;

crearApp().listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
