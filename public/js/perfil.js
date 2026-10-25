const API_URL = "https://landing-site-fufr.onrender.com";

document.getElementById("form-registro")
        .addEventListener("submit", registrar);

document.getElementById("form-login")
        .addEventListener("submit", login);

async function registrar(e){
    e.preventDefault();
    const nombre = document.getElementById("registro-usuario").value;
    const password = document.getElementById("registro-password").value;
    try{
        const response = await fetch(`${API_URL}/api/registro`,{
            method:"POST",
            headers:{
                "Content-Type":
                "application/json"
            },
            body:JSON.stringify({
                nombre,
                password
            })
        });
        const data = await response.json();
        alert(data.mensaje);
    }catch(error){
        console.error(error);
        alert("Error al registrar usuario");
    }
}

async function login(e){
    e.preventDefault();
    const nombre = document.getElementById("login-usuario").value;
    const password = document.getElementById("login-password").value;
    try{
        const response = await fetch(`${API_URL}/api/login`,{
            method:"POST",
            headers:{
                "Content-Type":
                "application/json"
            },
            body:JSON.stringify({
                nombre,
                password
            })
        });
        const data = await response.json();
        if(data.idUsuario){
            localStorage.setItem("idUsuario",data.idUsuario);
            alert("Inicio de sesión correcto");
        }else{
            alert("Usuario o contraseña incorrectos");
        }
    }catch(error){
        console.error(error);
    }
}

/*Registro*/

app.post("/api/registro",async (req,res) => {
    const { nombre, password } = req.body;
    try{
        await pool.query(`INSERT INTO usuarios(nombre, contrasenia) VALUES (?,?)`,[nombre, password]);
        res.json({ mensaje: "Usuario creado" });
    }catch(error){
        console.error(error);
        res.status(500).json({ mensaje:"Error" });
    }
});

/*Login*/

app.post("/api/login",async (req,res) => {
    const { nombre, password } = req.body;
    try{
        const [usuarios] = await pool.query(`SELECT * FROM usuarios WHERE nombre = ? AND contrasenia = ?`,
        [nombre, password]);
        if(usuarios.length === 0){
            return res.status(401).json({ error:"Credenciales" });
        }

        res.json({
            idUsuario: usuarios[0].id_usuario,
            nombre: usuarios[0].nombre
        });
    }catch(error){
        console.error(error);
        res.status(500).json({error:"Servidor"});
    }
});

/*Botones de registrio y login*/
function abrirLogin(){
    document
        .getElementById("modal-login")
        .classList.remove("oculto");
}

function abrirRegistro(){
    document
        .getElementById("modal-registro")
        .classList.remove("oculto");
}

function cerrarLogin(){
    document
        .getElementById("modal-login")
        .classList.add("oculto");
}

function cerrarRegistro(){
    document
        .getElementById("modal-registro")
        .classList.add("oculto");
}

/*Estoy logueado o no*/
if(idUsuario){
    document
        .getElementById("btn-login")
        .style.display ="none";
    document
        .getElementById("btn-registro")
        .style.display ="none";
    document
        .getElementById("btn-logout")
        .style.display ="inline-block";
}

window.addEventListener("DOMContentLoaded",() => {
    const idUsuario = localStorage.getItem("idUsuario");

    if(idUsuario){
        document
            .getElementById("bloqueo-cupones")
            .classList.add("oculto");
    }else{
        document
            .getElementById("contenido-cupones")
            .classList.add("oculto");
    }
});

/*Lo mismo pero de los cupones*/

document
    .getElementById("contenido-cupones")
    .style.display = "none";
document
    .getElementById("bloqueo-cupones")
    .style.display = "none";