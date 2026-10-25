const API_URL =
    "http://localhost:3000";

document
    .getElementById("form-registro")
    .addEventListener("submit", registrar);

document
    .getElementById("form-login")
    .addEventListener("submit", login);

async function registrar(e){

    e.preventDefault();

    const nombre =
        document.getElementById(
            "registro-usuario"
        ).value;

    const password =
        document.getElementById(
            "registro-password"
        ).value;

    try{

        const response =
            await fetch(
                `${API_URL}/api/registro`,
                {

                    method:"POST",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },

                    body:JSON.stringify({
                        nombre,
                        password
                    })

                }
            );

        const data =
            await response.json();

        alert(data.mensaje);

    }

    catch(error){

        console.error(error);

        alert(
            "Error al registrar usuario"
        );

    }

}

async function login(e){

    e.preventDefault();

    const nombre =
        document.getElementById(
            "login-usuario"
        ).value;

    const password =
        document.getElementById(
            "login-password"
        ).value;

    try{

        const response =
            await fetch(
                `${API_URL}/api/login`,
                {

                    method:"POST",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },

                    body:JSON.stringify({
                        nombre,
                        password
                    })

                }
            );

        const data =
            await response.json();

        if(data.idUsuario){

            localStorage.setItem(
                "idUsuario",
                data.idUsuario
            );

            alert(
                "Inicio de sesión correcto"
            );

        }

        else{

            alert(
                "Usuario o contraseña incorrectos"
            );

        }

    }

    catch(error){

        console.error(error);

    }

}

/*Registro*/

app.post(
    "/api/registro",
    async (req,res) => {

        const {
            nombre,
            password
        } = req.body;

        try{

            await pool.query(

                `
                INSERT INTO usuarios
                (
                    nombre,
                    contrasenia
                )
                VALUES
                (?,?)
                `,

                [
                    nombre,
                    password
                ]

            );

            res.json({
                mensaje:
                "Usuario creado"
            });

        }

        catch(error){

            console.error(error);

            res.status(500).json({
                mensaje:"Error"
            });

        }

    }
);
/*Login*/
app.post(
    "/api/login",
    async (req,res) => {

        const {
            nombre,
            password
        } = req.body;

        try{

            const [usuarios] =
                await pool.query(

                    `
                    SELECT *
                    FROM usuarios
                    WHERE nombre = ?
                    AND contrasenia = ?
                    `,

                    [
                        nombre,
                        password
                    ]

                );

            if(
                usuarios.length === 0
            ){

                return res.status(401)
                .json({
                    error:"Credenciales"
                });

            }

            res.json({

                idUsuario:
                usuarios[0].id_usuario,

                nombre:
                usuarios[0].nombre

            });

        }

        catch(error){

            console.error(error);

            res.status(500).json({
                error:"Servidor"
            });

        }

    }
);