/* ============================
   script.js
   Comentarios: validación en tiempo real, manejo del modal y confeti.
   ============================ */

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const form = document.getElementById('contactForm');
  const nameInp = document.getElementById('name');
  const emailInp = document.getElementById('email');
  const msgInp = document.getElementById('message');

  const errName = document.getElementById('error-name');
  const errEmail = document.getElementById('error-email');
  const errMsg = document.getElementById('error-message');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('closeModal');
  const confettiContainer = document.getElementById('confettiContainer');

  const subscribeBtns = document.querySelectorAll('#subscribeBtn, #subscribeBtnForm');

  // Actualiza el año en el footer
  document.getElementById('year').textContent = new Date().getFullYear();

  /* -------------------------
     VALIDACIÓN
     - validación en tiempo real (input events)
     - al enviar, se valida y muestra modal si todo es correcto
     ------------------------- */

  // Expresión para email simple (no exhaustiva pero práctica)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // funciones de validación por campo
  function validateName() {
    const val = nameInp.value.trim();
    if (!val) {
      errName.textContent = 'El nombre es obligatorio.';
      return false;
    }
    errName.textContent = '';
    return true;
  }

  function validateEmail() {
    const val = emailInp.value.trim();
    if (!val) {
      errEmail.textContent = 'El correo es obligatorio.';
      return false;
    }
    if (!emailRegex.test(val)) {
      errEmail.textContent = 'Formato de email inválido.';
      return false;
    }
    errEmail.textContent = '';
    return true;
  }

  function validateMessage() {
    const val = msgInp.value.trim();
    if (!val) {
      errMsg.textContent = 'El mensaje no puede estar vacío.';
      return false;
    }
    if (val.length < 8) {
      errMsg.textContent = 'Escribe al menos 8 caracteres.';
      return false;
    }
    errMsg.textContent = '';
    return true;
  }

  // Validación en tiempo real
  nameInp.addEventListener('input', validateName);
  emailInp.addEventListener('input', validateEmail);
  msgInp.addEventListener('input', validateMessage);

  // Manejo submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okName = validateName();
    const okEmail = validateEmail();
    const okMsg = validateMessage();

    if (okName && okEmail && okMsg) {
      // Simular envío: mostrar modal + confeti
      openModal('¡Gracias por contactarnos!', 'Pronto nos pondremos en contacto contigo.');
      // limpiar formulario (opcional)
      form.reset();
    } else {
      // Si hay errores, enfocar el primer campo con error
      if (!okName) nameInp.focus();
      else if (!okEmail) emailInp.focus();
      else msgInp.focus();
    }
  });

  /* -------------------------
     MODAL y CONFETTI
     ------------------------- */

  function openModal(title, message) {
    // Actualizar texto del modal (si fuese dinámico)
    const modalTitle = document.getElementById('modalTitle');
    const modalMsg = document.getElementById('modalMsg');
    modalTitle.textContent = title;
    modalMsg.textContent = message;

    // Hacer visible el overlay (accesible)
    modalOverlay.setAttribute('aria-hidden', 'false');

    // Crear confeti: entre 10 y 15 piezas
    createConfettiPieces(randomInt(10, 15));

    // Cerrar modal tras 4.5s (opcional) — aquí NO autocerramos para que el usuario lo cierre
    // setTimeout(closeModal, 4500);
  }

  function closeModal() {
    modalOverlay.setAttribute('aria-hidden', 'true');
    // Limpiar confetti (remover nodos)
    while (confettiContainer.firstChild) confettiContainer.removeChild(confettiContainer.firstChild);
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    // cerrar solo si se hace click fuera de la modal (overlay)
    if (e.target === modalOverlay) closeModal();
  });

  // Suscribe buttons crean confetti + mensaje positivo (sin enviar formulario)
  subscribeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openModal('¡Gracias por suscribirte!', 'Bienvenido a nuestra comunidad. Revisa tu correo para confirmar.');
    });
  });

  /* -------------------------
     LÓGICA DE CONFETTI
     - crea divs con clase .confetti, los posiciona y les aplica animación
     ------------------------- */

  function createConfettiPieces(n) {
    // Colores variados
    const colors = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#7c3aed'];

    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.classList.add('confetti');

      // tamaño aleatorio
      const w = randomInt(6, 14);
      const h = randomInt(8, 18);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;

      // color
      el.style.background = colors[i % colors.length];

      // posición inicial: x aleatorio dentro del ancho modal (0-100%)
      const leftPercent = Math.random() * 100;
      el.style.left = `${leftPercent}%`;
      el.style.top = `-10%`; // iniciar por encima

      // rotación inicial aleatoria
      el.style.transform = `rotate(${randomInt(0, 360)}deg)`;

      // duración aleatoria entre 1500ms y 3000ms — se asigna como inline style para variar
      const duration = randomInt(1500, 3000);
      el.style.animationDuration = `${duration}ms`;

      // delay ligeramente aleatorio para cascada
      el.style.animationDelay = `${randomInt(0, 300)}ms`;

      // añadir efecto lateral mediante left oscillation con CSS variable, si se desea
      // (Aquí usamos animación confettiFall básica; la posición horizontal se ve natural)
      confettiContainer.appendChild(el);

      // Eliminar el elemento cuando termine la animación para limpiar DOM
      el.addEventListener('animationend', () => {
        if (el.parentElement) el.parentElement.removeChild(el);
      });
    }
  }

  /* -------------------------
     UTILIDADES
     ------------------------- */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

});
