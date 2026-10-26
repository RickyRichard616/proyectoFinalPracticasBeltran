const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql2/promise');
// importando libreria de googleAI
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS y lectura de JSON
app.use(cors());
app.use(express.json());

// Establecer coneccion con la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,          // Host provisto por tu servicio (ej. Aiven)
    user: process.env.DB_USER,          // Usuario (ej. avnadmin)
    password: process.env.DB_PASSWORD,  // Contraseña de la base de datos
    database: process.env.DB_NAME,      // Nombre de la base de datos (rol_y_locales_db)
    port: process.env.DB_PORT || 3306,  // Puerto de MySQL
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
// inicializar cliente de gemini con la variable de entorno en Render
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });

// ENDPOINTS
app.get('/', (req, res) => {
    res.json({ estado: "Backend y API listos" });
})
// Endpoint del minijuego
app.post('/api/jugar', async (req, res) => {
    try {
        //const { idUsuario, accionUsuario, zonaActual, tiempoRestante, salud, mente } = req.body;
        const idUsuario = 1;
        const { accionUsuario, zonaActual, tiempoRestante, salud, mente } = req.body;
        const fechaHoy = new Date().toISOString().split('T')[0]; // Obtener fecha actual

        let [filasDesafios] = await pool.query(
            'SELECT * FROM desafios_diarios WHERE fecha = ?', 
            [fechaHoy]
        );

        let desafioActual;

        if(filasDesafios.length === 0){
            // 1. CONSULTAR DINÁMICAMENTE LOS TIPOS DE CUPONES VÁLIDOS DESDE LA BASE DE DATOS
            // (Excluimos el id_tipo_cupon 0 si corresponde a "Sin recompensa" para que siempre gane un premio real)
            const [tiposCuponesDB] = await pool.query(
                'SELECT id_tipo_cupon, nombre_tipo FROM tipos_cupones WHERE id_tipo_cupon > 0'
            );

            // Si por alguna razón la tabla está vacía, definimos un respaldo por seguridad
            if (tiposCuponesDB.length === 0) {
                throw new Error("No hay tipos de cupones registrados en la base de datos.");
            }

            // Extraemos un arreglo con los IDs puros (ej: [1, 2, 3, 4, 5])
            const idsValidos = tiposCuponesDB.map(t => t.id_tipo_cupon);

            // Creamos un texto descriptivo para inyectarlo en el prompt de la IA
            const descripcionTipos = tiposCuponesDB.map(t => `ID ${t.id_tipo_cupon} (${t.nombre_tipo})`).join(', ');

            const crearPrompt = `Inventa un desafío de rol diario único con un título de premisa atractivo, Además, debes asignarle un 'id_tipo_cupon_recompensa' que DEBE ser obligatoriamente uno de los siguientes IDs válidos de nuestra base de datos: [${descripcionTipos}]. y una introducción narrativa inicial. Responde estrictamente en formato JSON: {"tituloPremisa": "...", "idTipoCupoRecompensa": <un_numero_de_la_lista>, "narracionInicial": "..."}`;
            const iaRespuesta = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: crearPrompt,
                config: { responseMimeType: "application/json" }
            });

            const iaDatosLimpio = iaResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const iaDatos = JSON.parse(iaDatosLimpio);

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
            return res.status(400).json({ error: "Ya has utilizado tu intento diario para este desafío.", motivo: "intentoGastado" });
        }

        if(filasIntentos.length === 0){
            await pool.query(
                'INSERT INTO usuario_intentos_desafio (id_usuario, id_desafio_diario, estado) VALUES (?, ?, ?)',
                [idUsuario, desafioActual.id_desafio_diario, 'en_curso']
            );
        }

        // 3. Evaluar si el usuario ya venía derrotado por estadísticas (salud, mente o tiempo)
        const estaDerrotadoPorStats = (salud <= 0 || mente <= 0 || tiempoRestante <= 0);
        if (estaDerrotadoPorStats) {
            let [filasIntentos] = await pool.query(
                'SELECT * FROM usuario_intentos_desafio WHERE id_usuario = ? AND id_desafio_diario = ?',
                [idUsuario, desafioActual.id_desafio_diario]
            );
            if (filasIntentos.length > 0) {
                let intentoActual = filasIntentos[0]; // Obtenemos el objeto real de la primera fila

                // 3. Actualizamos usando el id_intento correcto
                await pool.query(
                    'UPDATE usuario_intentos_desafio SET estado = ? WHERE id_intento = ?',
                    ['perdido', intentoActual.id_intento]
                );
            }
            return res.json({ 
                zona: "Zona de Finalización",
                narracion: "¡DERROTA! Tus fuerzas se han agotado por completo y has sucumbido ante las adversidades. Tu intento ha finalizado.",
                esVictoria: false, 
                opciones: [] // Opciones vacías para bloquear el juego automáticamente
            });
        }

        // 1. EL SYSTEM PROMPT (Instrucciones estrictas para la IA)
        const systemInstruction = `
            Eres el narrador despiadado y experto de un juego de rol de supervivencia y terror. 
            El juego debe ser DIFÍCIL. Los errores deben costar caros y la muerte o la locura deben ser una amenaza constante.
            
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

            REGLAS DE EQUILIBRIO Y COSTOS (¡MUY IMPORTANTE!):
            1. Los costos de las opciones DEBEN SER ALTOS Y PUNITIVOS. 
               - Salud y Mente: Deben costar entre 15 y 40 puntos por cada mala decisión (si el jugador toma 3 decisiones imprudentes, debe morir o perder la cordura).
               - Tiempo: Cada acción debe consumir entre 25 y 45 minutos in-game para que el reloj sea un peligro real.
            2. No protejas al jugador: Si elige una acción imprudente, estúpida o arriesgada, castígale severamente la salud o la mente y acércalo a la derrota.
            3. La aventura debe resolverse en un máximo de 4 a 5 turnos bien jugados, pero si el usuario titubea o toma malas decisiones, morirá antes de llegar.
            4. Cuando se alcance la victoria, el campo "esVictoria" debe pasar a true y las opciones deben estar vacías [].

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
        const textoLimpio = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultadoJson = JSON.parse(textoLimpio);

        // 5. Verificar si la IA decretó la VICTORIA en este turno
        if (resultadoJson.esVictoria === true || resultadoJson.esVictoria === "true") {
            // Actualizar intento a ganado y registrar el tipo de cupón obtenido
            await pool.query(
                'UPDATE usuario_intentos_desafio SET estado = ?, id_tipo_cupon_ganado = ? WHERE id_intento = ?',
                ['ganado', desafioActual.id_tipo_cupon_recompensa, intentoActual.id_intento]
            );

            // Opcional: Generar automáticamente el cupón en la tabla 'cupones' y asignarlo al perfil ('usuario_cupones')
            const codigoUnicoCupón = `RECOMPENSA-${idUsuario}-${Date.now()}`;
            const [resCupon] = await pool.query(
                'INSERT INTO cupones (codigo, id_tipo_cupon, descripcion, fecha_expiracion) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
                [codigoUnicoCupón, desafioActual.id_tipo_cupon_recompensa, `Cupón ganado en el desafío diario: ${desafioActual.titulo_premisa}`]
            );

            await pool.query(
                'INSERT INTO usuario_intentos_desafio SET id_tipo_cupon_ganado = ? WHERE id_intento = ?', // Asegurar registro si aplica
                [desafioActual.id_tipo_cupon_recompensa, intentoActual.id_intento]
            ).catch(() => {}); // Manejo defensivo

            await pool.query(
                'INSERT INTO usuario_cupones (id_usuario, id_cupon, estado) VALUES (?, ?, ?)',
                [idUsuario, resCupon.insertId, 'disponible']
            );
        }

        res.json(resultadoJson);

    } catch (error) {
        console.error("Error relacionado a Gemini:", error);
        res.status(500).json({ error: "Hubo un error al procesar el desafio." });
    }
});
// Endpoint para registrar usuarios
app.post('/api/registro', async (req, res) => {
    try{
        const {nombre,contrasenia} = req.body;

        if (!nombre || !contrasenia){
            return res.status(400).json({ error: "Faltan datos obligatorios como Nombre y Contraseña." });
        }

        const [resultado] = await pool.query(
            'INSERT INTO usuarios (nombre, contrasenia) VALUES (?,?)',
            [nombre,contrasenia]
        );

        res.status(201).json({
            mensaje: "Usuario ID["+resultado.insertId+"] registrado con exito."
        });
    }catch(error){
        console.error("Error relacionado al registrar usuario:", error);
        if(error.code === 'ER_DUP_ENTRY'){
            res.status(400).json({ error: "Ese usuario ya existe." });            
        }else{
            res.status(500).json({ error: "Hubo un error al registrar al usuario." });
        }
    }
});
// Endpoint para verificar login de usuario
app.post('/api/login', async (req, res) => {
    try{
        const {nombre,contrasenia} = req.body;

        if (!nombre || !contrasenia){
            return res.status(400).json({ error: "Faltan datos obligatorios como Nombre y Contraseña." });
        }

        const [resultado] = await pool.query(
            'SELECT id_usuario, online FROM usuarios WHERE nombre=? AND contrasenia=?',
            [nombre,contrasenia]
        );

        if (resultado.online === 1) {
            return res.status(400).json({ error: "El usuario ya se encuentra conectado en otra sesión." });
        }

        await pool.query(
            'UPDATE usuarios SET online = 1 WHERE id_usuario = ?',
            [usuario.id_usuario]
        );

        res.status(200).json({
            idUsuario: resultado[0].id_usuario
        });
    }catch(error){
        console.error("Error relacionado al log in:", error);
        if(error.code === 'ER_DUP_ENTRY'){
            res.status(400).json({ error: "Ese usuario ya existe." });            
        }else{
            res.status(500).json({ error: "Hubo un error al ingresar como usuario." });
        }
    }
});
//Endpoint para obtener mesas disponibles
app.get('/api/mesas-disponibles', async (req, res) => {
    const {local,fecha,hora} = req.query;

    if(!local || !fecha || !hora){
        return res.status(400).json({ error: 'Faltan parametros (local, fecha, hora)'});
    }

    try{
        const consulta = `
        SELECT id_mesa, numero_mesa, capacidad
        FROM mesas
        WHERE id_local = ?
        AND id_mesa NOT IN (
            SELECT id_mesa
            FROM reservas
            WHERE fecha = ? AND fecha_hora = ?
        )
        `;

        const [mesasDisponibles] = await pool.query(consulta, [local, fecha, hora]);

        res.json(mesasDisponibles);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al buscar mesas disponibles'});
    }
});
//Endpoint para registrar reservas
app.post('/api/reservar', async (req, res) => {
    const {idUsuario, idLocal, fecha, hora, idMesa} = req.body;

    console.log(idUsuario+'|'+idLocal+'|'+fecha+'|'+hora+'|'+idMesa);
    if(!idUsuario || !idLocal || !fecha || !hora || !idMesa){
        return res.status(400).json({ error: 'Faltan parametros para la reserva'});
    }

    try{
        const [resultado] = await pool.query(`
            INSERT INTO reservas
            (id_usuario, id_mesa, fecha_hora, estado, fecha)
            VALUES (?,?,?,'confirmada',?)`,
            [idUsuario,idMesa,hora,fecha]
        );
        res.status(201).json({
            mensaje: "Reserva registrada con exito."
        });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al registrar una reserva'});
    }
});
//Endpoint para ver reservas agendadas
app.get('/api/ver-reservas', async (req, res) => {
    const {idUsuario} = req.query;

    if(!idUsuario){
        return res.status(400).json({ error: 'Faltan parametros (idUsuario)'});
    }

    try{
        const consulta = `
        SELECT 
            r.id_reserva AS id,
            r.fecha_hora AS hora,
            r.fecha AS fecha,
            m.numero_mesa AS mesaNumero,
            m.capacidad AS capacidad,
            l.nombre_local AS local
        FROM reservas r
        JOIN mesas m ON r.id_mesa = m.id_mesa
        JOIN locales l ON m.id_local = l.id_local
        WHERE r.id_usuario = ? AND r.estado = ?
        ORDER BY r.fecha ASC, r.fecha_hora ASC;
        `;

        const [reservas] = await pool.query(consulta, [idUsuario,'confirmada']);

        res.json(reservas);
    }catch(error){
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al buscar reservas'});
    }
});
// 1. Servir los archivos frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

