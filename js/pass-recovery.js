//Lógica para recuperar la contraseña

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("passForm");
  if (!form) {
    console.error("No se encontró el formulario #passForm. Revisa el HTML.");
    return;
  }
  const VALID_USER = "MH230747";

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const userInput = (document.getElementById("carnet")?.value || "").trim();

    if (!userInput) {
      alert("Por favor, ingresa tu carnet o usuario.");
      return;
    }

    if (userInput === VALID_USER) {
      alert("Se envió un correo con tu contraseña, revisa.");
    } else {
      alert(
        "Error: usuario no encontrado. Revisa el carnet o usuario ingresado."
      );
    }
  });
});
