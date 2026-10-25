document.addEventListener("DOMContentLoaded", () => {

    const imagenes =
        document.querySelectorAll(".imagen-parallax");

    window.addEventListener("scroll", () => {

        imagenes.forEach((imagen) => {

            const rect =
                imagen.parentElement.getBoundingClientRect();

            const velocidad = 0.08;

            const movimiento =
                rect.top * velocidad;

            imagen.style.transform =
                `translateY(${movimiento}px)`;

        });

    });

});
