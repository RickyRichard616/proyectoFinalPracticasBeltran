const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS y lectura de JSON
app.use(cors());
app.use(express.json());

// 1. Servir los archivos estáticos de tu frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Ejemplo de una ruta de API (para conectar con tu base de datos o IA más adelante)
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: "El backend está funcionando correctamente con la base de datos." });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
