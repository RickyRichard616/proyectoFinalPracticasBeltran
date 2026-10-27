const API_URL =
    "https://landing-site-fufr.onrender.com";

document
    .getElementById("form-registro")
    .addEventListener("submit", registrar);

document
    .getElementById("form-login")
    .addEventListener("submit", login);

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
                    mesaSelect.innerHTML = '';
                    
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

// Envio de formulario para crear reservas
    const formReserva = document.getElementById('form-reserva');
    formReserva.addEventListener('submit', async (e) => {
        // 1. Evitamos que la página se recargue por defecto
        e.preventDefault();
        // 2. Verificamos que el usuario esté logueado
        const idUsuario = localStorage.getItem("idUsuario");
        if (!idUsuario) {
            alert("Debes iniciar sesión para poder realizar una reserva.");
            return;
        }
        // 3. Recolectamos los datos de los inputs
        const datosReserva = {
            idUsuario: idUsuario,
            idLocal: document.getElementById('local').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            idMesa: document.getElementById('mesa').value,
        };
        try {
            // 4. Enviamos los datos al backend mediante POST
            const response = await fetch('/api/reservar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(datosReserva)
            });
            const resultado = await response.json();
            if (response.ok) {
                alert("¡Reserva creada con éxito!");
                formReserva.reset(); // Limpia el formulario
                actualizarMesasDisponibles();
            } else {
                alert("No se pudo completar la reserva: " + (resultado.error || "Inténtalo de nuevo."));
            }
        } catch (error) {
            console.error("Error al enviar la reserva:", error);
            alert("Hubo un error de conexión con el servidor.");
        }
    });

// Cerrar sesion
    const btnLogout = document.getElementById('btn-logout');
    btnLogout.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("id: "+idUsuario);
        if (idUsuario) {
            try {
                // Avisamos al backend que cambie el online a 0
                const response = await fetch(`${API_URL}/api/cerrar-sesion`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idUsuario })
                });
                const resultado = await response.json();
                console.log(resultado);
                if(!response.ok){
                    console.log(resultado.error);
                }else{
                    console.log(resultado.mensaje);
                    localStorage.removeItem("idUsuario");
                    verReservas();
                }
            } catch (error) {
                console.error("Error al notificar cierre de sesión:", error);
            }
        }
    });
});

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
            if(data.error){
                alert("El usuario se encuentra en uso");
            }else{
                alert("Usuario o contraseña incorrectos");
            }
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

    verReservas();
}

function habilitarLogueo(){
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
    
    verReservas();
}

function verReservas(){
    const idUsuario = localStorage.getItem("idUsuario");
    const bloqueoReserva = document.getElementById("bloqueo-reserva");
    const contenidoReserva = document.getElementById("contenido-reserva");
    const listaReservas = document.getElementById("lista-reservas");

    if(!idUsuario){
        listaReservas.innerHTML = "";
        return;
    }

    // 2. Consultar las reservas del usuario en el backend
    fetch(`${API_URL}/api/ver-reservas?idUsuario=${idUsuario}`)
        .then(response => response.json())
        .then(reservas => {
        // Limpiamos el contenedor por si acaso
        listaReservas.innerHTML = "";

        if (reservas.length === 0) {
            listaReservas.innerHTML = "<p>No tienes reservas registradas.</p>";
            return;
        }

        // 3. Generar un item por cada reserva manteniendo la jerarquía
        reservas.forEach(reserva => {
            const tarjeta = document.createElement("div");
            
            switch(reserva.local){
                case "La Pinta": tarjeta.className = "tarjeta-turno tarjeta-pinta";
                break;

                case "El Puente": tarjeta.className = "tarjeta-turno tarjeta-puente";
                break;

                case "La Torre": tarjeta.className = "tarjeta-turno tarjeta-torre";
                break;
            }

            tarjeta.innerHTML = `
                <h3>
                    ${reserva.local}
                </h3>
                <p>
                    Fecha: ${reserva.fecha} - ${reserva.hora} hs
                </p>
                <p>
                    Mesa: ${reserva.mesaNumero}
                </p>
                <p>
                    Capacidad: ${reserva.capacidad}
                </p>
                <div class="acciones-reserva">
                    <button class="btn-cancelar" data-id="${reserva.id}">
                        Cancelar Reserva
                    </button>
                </div>
            `;

            listaReservas.appendChild(tarjeta);
        });
    })
    .catch(error => {
        console.error("Error al obtener las reservas:", error);
        listaReservas.innerHTML = "<p>Hubo un error al cargar tus reservas.</p>";
    });
}