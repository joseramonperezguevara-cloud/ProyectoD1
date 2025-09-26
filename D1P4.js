document.addEventListener("DOMContentLoaded", () => {
  const botones = document.querySelectorAll(".choice");
  const resultadoDiv = document.getElementById("resultado");
  const winsSpan = document.getElementById("wins");
  const lossesSpan = document.getElementById("losses");
  const drawsSpan = document.getElementById("draws");

  let wins = 0;
  let losses = 0;
  let draws = 0;

  const opciones = ["piedra", "papel", "tijera"];

  function jugar(eleccionJugador) {
    const eleccionComputadora = opciones[Math.floor(Math.random() * 3)];

    let mensaje = `Tú elegiste: ${eleccionJugador.toUpperCase()} <br> 
                   La computadora eligió: ${eleccionComputadora.toUpperCase()} <br>`;

    if (eleccionJugador === eleccionComputadora) {
      mensaje += "👉 ¡Empate!";
      draws++;
      drawsSpan.textContent = draws;
    } else if (
      (eleccionJugador === "piedra" && eleccionComputadora === "tijera") ||
      (eleccionJugador === "papel" && eleccionComputadora === "piedra") ||
      (eleccionJugador === "tijera" && eleccionComputadora === "papel")
    ) {
      mensaje += "🎉 ¡Ganaste!";
      wins++;
      winsSpan.textContent = wins;
    } else {
      mensaje += "💀 ¡Perdiste!";
      losses++;
      lossesSpan.textContent = losses;
    }

    resultadoDiv.innerHTML = mensaje;
  }

  botones.forEach(boton => {
    boton.addEventListener("click", () => {
      jugar(boton.dataset.choice);
    });
  });
});
