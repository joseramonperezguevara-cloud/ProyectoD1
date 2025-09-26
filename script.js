document.addEventListener("DOMContentLoaded", () => {
  const btnContacto = document.getElementById("btnContacto");
  const contacto = document.getElementById("contacto");

  btnContacto.addEventListener("click", () => {
    if (contacto.style.display === "none" || contacto.style.display === "") {
      contacto.style.display = "block";
      btnContacto.textContent = "Ocultar contacto";
    } else {
      contacto.style.display = "none";
      btnContacto.textContent = "Mostrar contacto";
    }
  });
});
