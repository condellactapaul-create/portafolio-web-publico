'use strict';
// Navegación disponible también sin JavaScript.
// Ilustración local: conserva un marcador discreto si el archivo falla.
const photo = document.querySelector('#foto-perfil');
const photoFallback = document.querySelector('#foto-marcador');
if (photo && photoFallback) {
  const showPhoto = () => {
    const available = photo.naturalWidth > 0;
    photo.hidden = !available;
    photoFallback.hidden = available;
  };
  photo.addEventListener('load', showPhoto);
  photo.addEventListener('error', () => {
    photo.hidden = true;
    photoFallback.hidden = false;
  });
  // Cubre respuestas de caché anteriores a la ejecución del script defer.
  if (photo.complete) showPhoto();
}

// El HTML inicia la carga nativa. Una imagen lazy debe conservar su caja visible
// mientras espera: ocultarla hasta load impide que el navegador empiece a cargarla.
document.querySelectorAll('.evidence-card').forEach(card => {
  const image = card.querySelector('.evidence-image');
  const placeholder = card.querySelector('.evidence-placeholder');
  const state = card.querySelector('[data-evidence-state]');
  const expand = card.querySelector('.evidence-expand');
  if (!image || !placeholder || !state) return;
  const showPlaceholder = () => {
    image.hidden = true;
    placeholder.hidden = false;
    state.textContent = 'Imagen no disponible';
    if (expand) expand.hidden = true;
  };
  const showImage = () => {
    if (!image.naturalWidth) return showPlaceholder();
    image.hidden = false;
    placeholder.hidden = true;
    state.textContent = 'Captura incorporada';
    if (expand) expand.hidden = false;
  };
  image.addEventListener('load', showImage);
  image.addEventListener('error', showPlaceholder);
  // Cubre imágenes ya cargadas (o fallidas) antes de registrar los eventos.
  if (image.complete) showImage();
});

// El diálogo nativo mantiene el foco dentro de la vista modal y admite Escape.
const evidenceDialog = document.querySelector('#evidence-dialog');
if (evidenceDialog && typeof evidenceDialog.showModal === 'function') {
  const enlarged = evidenceDialog.querySelector('.dialog-image');
  const title = evidenceDialog.querySelector('#evidence-dialog-title');
  const description = evidenceDialog.querySelector('#evidence-dialog-description');
  const close = evidenceDialog.querySelector('.dialog-close');
  const error = evidenceDialog.querySelector('.dialog-error');
  let opener = null;
  enlarged.addEventListener('error', () => { error.hidden = false; enlarged.hidden = true; });
  enlarged.addEventListener('load', () => { error.hidden = true; enlarged.hidden = false; });
  document.querySelectorAll('.evidence-expand').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const card = trigger.closest('.evidence-card');
      const source = card.querySelector('.evidence-image');
      if (source.hidden) return;
      opener = trigger;
      title.textContent = card.querySelector('h3').textContent;
      description.textContent = card.querySelector('.evidence-body > p').textContent;
      error.hidden = true;
      enlarged.hidden = false;
      enlarged.alt = source.alt;
      enlarged.src = source.src;
      evidenceDialog.showModal();
      document.body.classList.add('evidence-open');
      close.focus();
    });
  });
  close.addEventListener('click', () => evidenceDialog.close());
  evidenceDialog.addEventListener('click', event => {
    if (event.target !== evidenceDialog) return;
    const rect = evidenceDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) evidenceDialog.close();
  });
  evidenceDialog.addEventListener('close', () => {
    document.body.classList.remove('evidence-open');
    if (opener) opener.focus();
  });
} else if (evidenceDialog) {
  // Alternativa para navegadores sin showModal: abre el archivo local completo.
  document.querySelectorAll('.evidence-expand').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const source = trigger.closest('.evidence-card').querySelector('.evidence-image');
      if (!source.hidden) window.location.assign(source.src);
    });
  });
}

const button = document.querySelector('.menu');
const nav = document.querySelector('#navegacion');
if (button && nav) {
  // Debe coincidir con el punto de cambio del encabezado en style.css.
  const mobile = window.matchMedia('(max-width: 960px)');
  const closeMenu = () => {
    nav.hidden = mobile.matches;
    button.setAttribute('aria-expanded', 'false');
  };
  const syncNavigation = () => {
    const active = document.activeElement;
    button.hidden = !mobile.matches;
    closeMenu();
    // Evita dejar el foco en un control oculto después de redimensionar.
    if (mobile.matches && nav.contains(active)) button.focus();
    else if (!mobile.matches && active === button) nav.querySelector('a').focus();
  };
  syncNavigation();
  button.addEventListener('click', () => {
    if (!mobile.matches) return;
    nav.hidden = !nav.hidden;
    button.setAttribute('aria-expanded', String(!nav.hidden));
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    const section = document.querySelector(link.hash);
    if (section) {
      section.setAttribute('tabindex', '-1');
      section.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && !nav.hidden) {
      closeMenu();
      button.focus();
    }
  });
  mobile.addEventListener('change', syncNavigation);
}
if (nav) {
  const links = [...document.querySelectorAll('nav a')];
  const sections = [...document.querySelectorAll('main section[id]')];
  if (links.length && sections.length) {
    const header = document.querySelector('header');
    let frame = null;
    let destination = null;
    let settleTimer;
    const markActive = id => {
      for (const link of links) {
        if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    const updateActive = () => {
      frame = null;
      if (destination) return;
      // Se activa al alcanzar la zona de lectura, no al asomar por abajo.
      const fixed = header && ['sticky', 'fixed'].includes(getComputedStyle(header).position);
      const readingLine = (fixed ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 24;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= readingLine + 1) current = section;
      }
      // Permite identificar Contacto aunque el documento no tenga más espacio para subirlo.
      const root = document.documentElement;
      const last = sections[sections.length - 1];
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2 && last.getBoundingClientRect().top < window.innerHeight) current = last;
      markActive(current.id);
    };
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(updateActive); };
    const finishNavigation = () => {
      clearTimeout(settleTimer);
      destination = null;
      schedule();
    };
    const followHash = hash => {
      const target = sections.find(section => `#${section.id}` === hash);
      if (!target) return;
      destination = target.id;
      markActive(target.id);
      clearTimeout(settleTimer);
      // Respaldo para navegadores sin scrollend y anclas ya en su posición final.
      settleTimer = setTimeout(finishNavigation, 180);
    };
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href^="#"]');
      if (link) followHash(link.hash);
    });
    window.addEventListener('hashchange', () => followHash(window.location.hash));
    window.addEventListener('scroll', () => {
      if (destination) {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(finishNavigation, 180);
      }
      schedule();
    }, {passive:true});
    window.addEventListener('scrollend', finishNavigation);
    window.addEventListener('resize', finishNavigation);
    window.addEventListener('load', schedule);
    window.addEventListener('pageshow', schedule);
    window.addEventListener('wheel', finishNavigation, {passive:true});
    window.addEventListener('touchstart', finishNavigation, {passive:true});
    document.addEventListener('keydown', event => {
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) finishNavigation();
    });
    if (window.location.hash) followHash(window.location.hash);
    else updateActive();
  }
}
