let ultimaPosicion = 0;

const header = document.querySelector("header");

window.addEventListener("scroll", () => {

    const posicionActual = window.pageYOffset;

    if (posicionActual > ultimaPosicion && posicionActual > 80) {

        header.classList.add("header-oculto");

    } else {

        header.classList.remove("header-oculto");

    }

    ultimaPosicion = posicionActual;
});