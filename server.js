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
        const { idUsuario, accionUsuario, zonaActual, tiempoRestante, salud, mente } = req.body;
        const fechaHoy = new Date().toISOString().split('T')[0]; // Obtener fecha actual

        let [filasDesafios] = await pool.query(
            'SELECT * FROM desafios_diarios WHERE fecha = ?', 
            [fechaHoy]
        );

        let desafioActual;

        if(filasDesafios.length === 0){
            const crearPrompt = `Inventa un desafío de rol diario único con un título de premisa atractivo, un tipo de cupón de recompensa (id_tipo_cupon del 1 al 5) y una introducción narrativa inicial. Responde estrictamente en formato JSON: {"tituloPremisa": "...", "idTipoCupoRecompensa": 1, "narracionInicial": "..."}`;
            const iaRespuesta = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: promptCreacion,
                config: { responseMimeType: "application/json" }
            });
            const iaDatos = JSON.parse(iaRespuesta.text);
            const [insertarResultado] = await pool.query(
                'INSERT INTO desafios_diarios (fecha, titulo_premisa, id_tipo_cupon_recompensa) VALUES (?, ?, ?)',
                [fechaHoy, iaDatos.tituloPremisa, iaDatos.idTipoCupoRecompensa]
            );

            desafioActual = {
                id_desafio_diario: insertarResultado.insertId,
                titulo_premisa: iaDatos.tituloPremisa,
                id_tipo_cupon_recompensa: iaDatos.idTipoCupoRecompensa
            };
        } else {
            desafioActual = filasDesafios[0];
        }

        // Validar unico intento por usuario
        let [filasIntentos] = await pool.query(
            'SELECT * FROM usuario_intentos_desafio WHERE id_usuario = ? AND id_desafio_diario = ?',
            [idUsuario, desafioActual.id_desafio_diario]
        );

        if(filasIntentos.length > 0 && filasIntentos[0].estado !== 'en_curso'){
            return res.status(400).json({ error: "Ya has utilizado tu intento diario para este desafío." });
        }

        if(filasIntentos.length === 0){
            await pool.query(
                'INSERT INTO usuario_intentos_desafio (id_usuario, id_desafio_diario, estado) VALUES (?, ?, "en_curso")',
                [idUsuario, desafioActual.id_desafio_diario]
            );
        }

        // 1. EL SYSTEM PROMPT (Instrucciones estrictas para la IA)
        const systemInstruction = `
            Eres el narrador experto de un juego de rol rápido.
            
            PREMISA DEL DESAFÍO DE HOY: "${desafioActual.titulo_premisa}".

            INSTRUCCIÓN DE TEMÁTICA DINÁMICA:
            - Si la acción del usuario está vacía o es un inicio de partida (""), inicia la aventura aplicando estrictamente la premisa del día.
            - El jugador parte con 100 de Salud y 100 de Mente.

            El jugador se encuentra actualmente en la zona: "${zonaActual || 'Inicio'}".
            Estado actual del jugador -> Tiempo restante: ${tiempoRestante ?? 120} min | Salud: ${salud ?? 100} | Mente: ${mente ?? 100}.
            
            Tu objetivo es continuar la historia basándote en la acción que eligió el usuario.

            REGLAS DE PROGRESIÓN OBLIGATORIAS:
            1. La aventura tiene un arco narrativo corto. Debe resolverse y llegar a un punto de VICTORIA en un máximo de 6 o 7 elecciones del usuario.
            2. Evalúa el progreso: si el jugador ya ha tomado varias decisiones inteligentes, la siguiente opción debe llevarlo al desenlace y escapar de la zona.
            3. Cuando se alcance la victoria, el campo "esVictoria" debe pasar a true y las opciones deben estar vacías [].
            4. Trata de mantener un balance entre la duración total de la aventura y el costo de cada acción.

            DEBES responder ÚNICAMENTE en formato JSON válido con la siguiente estructura exacta:
            {
                "zona": "Nombre de la primera zona o ubicación de la nueva temática",
                "narracion": "Introducción inmersiva que describe la nueva temática, el mundo y el problema actual al que se enfrenta el protagonista...",
                "esVictoria": false,
                "opciones": [
                {
                  "texto": "Descripción de la opción 1",
                  "tiempoCosto": (Valor int que consideres apropiado dada la opcion correspondiente),
                  "saludCosto": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "menteCosto": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "siguienteNodoId": 1
                },
                {
                  "texto": "Descripción de la opción 2",
                  "tiempoCosto": (Valor int que consideres apropiado dada la opcion correspondiente),
                  "saludCosto": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "menteCosto": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "siguienteNodoId": 2
                },
                {
                  "texto": "Descripción de la opción 3",
                  "tiempoCosto": (Valor int que consideres apropiado dada la opcion correspondiente),
                  "saludCosto": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "menteCosto": (Valor int que consideres apropiado dada la opcion en un margen de 1 a 100),
                  "siguienteNodoId": 3
                }
              ]
            }
        `;

        // 2. LLAMADA A LA API DE GEMINI (lite para maxima velocidad)
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: accionUsuario ? `El usuario decidió: "${accionUsuario}"` : "Inicia la aventura del desafío diario de hoy basándote en su premisa.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json" // Forzar a que devuelva estrictamente JSON
            }
        });

        // 3. Enviar la respuesta generada por la IA de vuelta al frontend
        const resultadoJson = JSON.parse(response.text);
        res.json(resultadoJson);

    } catch (error) {
        console.error("Error relacionado a Gemini:", error);
        res.status(500).json({ error: "Hubo un error al procesar el desafio." });
    }
});

//-----------------------------------

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

