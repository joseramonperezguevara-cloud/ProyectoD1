function toggleContacto() {
  const contacto = document.getElementById("contacto");
  if (contacto.style.display === "none" || contacto.style.display === "") {
    contacto.style.display = "block";
  } else {
    contacto.style.display = "none";
  }
}
