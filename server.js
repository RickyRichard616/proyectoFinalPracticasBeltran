const express = require('express');
const path = require('path');
const cors = require('cors');
// importando libreria de googleAI
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS y lectura de JSON
app.use(cors());
app.use(express.json());

// 1. Servir los archivos frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

//-----------------------------------

// inicializar cliente de gemini con la variable de entorno en Render
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
    res.json({ estado: "Backend y API listos" });
})

// Endpoint principal del minijuego (Recibe la acción del usuario y el estado actual)
app.post('/api/jugar', async (req, res) => {
    try {
        const { accionUsuario, zonaActual, tiempoRestante, salud, mente } = req.body;

        // 1. EL SYSTEM PROMPT (Instrucciones estrictas para la IA)
        const systemInstruction = `
            Eres el narrador experto de un juego de rol rapido.
            El jugador se encuentra actualmente en la zona: "${zonaActual}".
            Estado actual del jugador -> Tiempo restante: ${tiempoRestante} min | Salud: ${salud} | Mente: ${mente}.
            
            Tu objetivo es continuar la historia basándote en la acción que eligió el usuario.
            DEBES responder ÚNICAMENTE en formato JSON válido (sin bloques de código markdown como \`\`\`json, solo el objeto JSON puro) con la siguiente estructura exacta:
            {
              "zona": "Nombre de la zona actual (puede cambiar si se movió)",
              "narracion": "Párrafo descriptivo de lo que ocurre tras la acción del usuario...",
              "opciones": [
                {
                  "texto": "Descripción de la opción 1",
                  "tiempoCoste": (Valor int que consideres apropiado dada la opcion correspondiente),
                  "saludCoste": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "menteCoste": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "siguienteNodoId": 1
                },
                {
                  "texto": "Descripción de la opción 2",
                  "tiempoCoste": (Valor int que consideres apropiado dada la opcion correspondiente),
                  "saludCoste": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "menteCoste": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "siguienteNodoId": 2
                },
                {
                  "texto": "Descripción de la opción 3",
                  "tiempoCoste": (Valor int que consideres apropiado dada la opcion correspondiente),
                  "saludCoste": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "menteCoste": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "siguienteNodoId": 3
                }
              ]
            }
        `;

        // 2. LLAMADA A LA API DE GEMINI (Usando Gemini 1.5 Flash para máxima velocidad)
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: accionUsuario ? `El usuario decidió: "${accionUsuario}"` : "Inicia la aventura del desafío diario de hoy.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json" // Forzar a que devuelva estrictamente JSON
            }
        });

        // 3. Enviar la respuesta generada por la IA de vuelta al frontend
        const resultadoJson = JSON.parse(response.text);
        res.json(resultadoJson);

    } catch (error) {
        console.error("Error al conectar con la API de Gemini:", error);
        res.status(500).json({ error: "Hubo un error al procesar el turno del narrador con la IA." });
    }
});

//-----------------------------------

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

