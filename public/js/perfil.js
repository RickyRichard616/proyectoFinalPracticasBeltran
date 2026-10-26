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
            cerrarRegistro();
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
            cerrarLogin();
            habilitarDeslogeo();
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
    habilitarLogueo();
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

function habilitarDeslogeo(){
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
        .getElementById("contenido-cupones")
        .classList.remove("oculto");
    document
        .getElementById("bloqueo-reserva")
        .classList.add("oculto");
    document
        .getElementById("contenido-reserva")
        .classList.remove("oculto");
    document
        .getElementById("eliminar-perfil")
        .classList.remove("oculto");
        document
        .getElementById("btn-crear-reserva")
        .disabled = false;
}

function habilitarLogueo(){
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
    document
        .getElementById("bloqueo-cupones")
        .classList.remove("oculto");
    document
        .getElementById("contenido-cupones")
        .classList.add("oculto");
    document
        .getElementById("bloqueo-reserva")
        .classList.remove("oculto");
    document
        .getElementById("contenido-reserva")
        .classList.add("oculto");
    document
        .getElementById("eliminar-perfil")
        .classList.add("oculto");
    document
        .getElementById("btn-crear-reserva")
        .disabled = true;
}

document.addEventListener("DOMContentLoaded",() => {
    // Esconder o mostrar contenido segun si estas logeado
    const idUsuario =
        localStorage.getItem(
            "idUsuario"
        );
    if(idUsuario){
        habilitarDeslogeo();
    }else{
        habilitarLogueo();
    }


    // Consultar mesas disponibles por local, dia y hora
    const localSelect = document.getElementById('local');
    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora');
    const mesaSelect = document.getElementById('mesa');

    function actualizarMesasDisponibles() {
        const local = localSelect.value;
        const fecha = fechaInput.value;
        const hora = horaInput.value;

        // Solo consultamos si los tres campos están completos
        if (local && fecha && hora) {
            // Petición a tu API o backend
            fetch(`${API_URL}/api/mesas-disponibles?local=${local}&fecha=${fecha}&hora=${hora}`)
                .then(response => response.json())
                .then(mesas => {
                    // Limpiamos las opciones anteriores
                    mesaSelect.innerHTML = '<option value="">Selecciona una mesa disponible</option>';
                    
                    // Añadimos las mesas que devolvió la base de datos
                    mesas.forEach(mesa => {
                        const option = document.createElement('option');
                        option.value = mesa.id_mesa;
                        option.textContent = `Mesa ${mesa.numero_mesa} (Hasta ${mesa.capacidad} jugadores)`;
                        mesaSelect.appendChild(option);
                    });
                })
                .catch(error => console.error('Error al obtener las mesas:', error));
        }
    }

    // Escuchamos cambios en los tres campos clave
    localSelect.addEventListener('change', actualizarMesasDisponibles);
    fechaInput.addEventListener('change', actualizarMesasDisponibles);
    horaInput.addEventListener('change', actualizarMesasDisponibles);
});