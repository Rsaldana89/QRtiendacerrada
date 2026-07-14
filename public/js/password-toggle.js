(function () {
  const eyeOpen = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z"></path>
      <circle cx="12" cy="12" r="2.8"></circle>
    </svg>`;

  const eyeClosed = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18"></path>
      <path d="M10.6 6.7A9.5 9.5 0 0 1 12 6.5c6.1 0 9.5 5.5 9.5 5.5a15.8 15.8 0 0 1-2.6 3.4"></path>
      <path d="M6.2 6.2C3.7 8 2.5 12 2.5 12s3.4 5.5 9.5 5.5a9.8 9.8 0 0 0 3.1-.5"></path>
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
    </svg>`;

  document.querySelectorAll('[data-password-toggle]').forEach(function (button) {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!input) return;

    function render(isVisible) {
      button.innerHTML = isVisible ? eyeClosed : eyeOpen;
      button.setAttribute('aria-pressed', String(isVisible));
      button.setAttribute('aria-label', isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      button.title = isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña';
    }

    render(input.type === 'text');

    button.addEventListener('click', function () {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      render(show);
      input.focus({ preventScroll: true });
      try {
        const end = input.value.length;
        input.setSelectionRange(end, end);
      } catch (_) {
        // Algunos navegadores no permiten controlar la selección en este tipo de campo.
      }
    });
  });
})();
