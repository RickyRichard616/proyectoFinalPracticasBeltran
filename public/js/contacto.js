function mostrarFormulario(){

    const formulario =
        document.getElementById(
            "formulario-contacto"
        );

    formulario.classList.remove(
        "oculto"
    );

    setTimeout(() => {

        window.scrollTo({

            top:
                formulario.offsetTop - 120,

            behavior: "smooth"

        });

    }, 100);

}