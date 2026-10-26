const API_URL =
    "https://landing-site-fufr.onrender.com";

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

    const contrasenia =
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
                        contrasenia
                    })
                }
            );

        const data =await response.json();

        if (!response.ok) {
            alert(data.error);
        }else{
            alert(data.mensaje);
        }
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

    const contrasenia =
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
                        contrasenia
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

function cerrarSesion(){
    localStorage.removeItem(("idUsuario"));
    document
        .getElementById("btn-logout")
        .classList.add("oculto");
    document
        .getElementById("btn-login")
        .style.display = "inline-block";
        document
        .getElementById("btn-registro")
        .style.display = "inline-block";

    
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

window.addEventListener(

    "DOMContentLoaded",

    () => {

        const idUsuario =
            localStorage.getItem(
                "idUsuario"
            );

        if(idUsuario){

            document
                .getElementById("btn-login")
                .style.display =
                "none";

            document
                .getElementById("btn-registro")
                .style.display =
                "none";

            document
                .getElementById("btn-logout")
                .classList.remove("oculto");

            document
                .getElementById("bloqueo-cupones")
                .classList.add("oculto");

            document
                .getElementById("bloqueo-reserva")
                .classList.add("oculto");

        }

        else{

            document
                .getElementById("contenido-cupones")
                .classList.add("oculto");

            document
                .getElementById("contenido-reserva")
                .classList.add("oculto");

            document
                .getElementById("eliminar-perfil")
                .classList.add("oculto");

        }

    }

);