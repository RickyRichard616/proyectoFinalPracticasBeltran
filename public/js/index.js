const locales = [

{
    nombre: "La Pinta",

    imagen: "images/locales/lapinta.webp",

    fondo: "images/locales/fondopinta.webp",

    texto:
    "Taberna medieval inspirada en fantasía clásica, dragones y aventuras heroicas.",

    enlace:
    "locales.html#medieval"
},

{
    nombre: "El Puente",

    imagen: "images/locales/puente.webp",

    fondo: "images/locales/fondopuente.webp",

    texto:
    "Espacio cyberpunk dedicado a la ciencia ficción, tecnología y exploración futurista.",

    enlace:
    "locales.html#cyberpunk"
},

{
    nombre: "La Torre",

    imagen: "images/locales/torre.webp",

    fondo: "images/locales/fondotorre.webp",

    texto:
    "Base de operaciones para héroes, vigilantes y equipos de defensa del mundo.",

    enlace:
    "locales.html#heroes"
}

];

let indiceLocal = 0;

function actualizarLocal(){

    const local =
        locales[indiceLocal];

    document.getElementById(
        "nombre-local"
    ).textContent =
        local.nombre;

    document.getElementById(
        "texto-local"
    ).textContent =
        local.texto;

    document.getElementById(
        "imagen-local"
    ).src =
        local.imagen;

    document.getElementById(
        "link-local"
    ).href =
        local.enlace;

    document.getElementById(
        "selector-fondo"
    ).style.backgroundImage =
        `
        linear-gradient(
        rgba(0,0,0,.65),
        rgba(0,0,0,.65)
        ),
        url(${local.fondo})
        `;
}

document.getElementById(
    "siguiente"
).addEventListener(
    "click",
    () => {

        indiceLocal =
        (indiceLocal + 1)
        % locales.length;

        actualizarLocal();

    }
);

document.getElementById(
    "anterior"
).addEventListener(
    "click",
    () => {

        indiceLocal =
        (indiceLocal - 1 +
        locales.length)
        % locales.length;

        actualizarLocal();

    }
);