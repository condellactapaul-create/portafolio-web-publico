// Verificaciones locales sin dependencias: node assets/verify-local.cjs
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'css/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'js/main.js'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size);
const voidTags = new Set(['meta', 'link', 'br', 'img', 'input', 'hr', 'source', 'wbr']);
const stack = [];
for (const match of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi)) {
  const [, closing, tag] = match;
  if (closing) assert.equal(stack.pop(), tag, `Unbalanced HTML: ${tag}`);
  else if (!voidTags.has(tag)) stack.push(tag);
}
assert.equal(stack.length, 0);
assert.equal((html.match(/<section\b/g) || []).length, 7);
assert.equal((html.match(/class="evidence-card"/g) || []).length, 5);
assert.equal((html.match(/class="participation"/g) || []).length, 5);
assert.equal((html.match(/class="project"/g) || []).length, 5);
assert.equal((html.match(/class="experience"/g) || []).length, 2);
const evidenceFiles = [
  'sistema-preguntas-respuestas.png', 'pcondell-publico.png'
];
const evidenceTags = [...html.matchAll(/<img class="evidence-image"[^>]*>/g)].map(match => match[0]);
const evidencePaths = evidenceTags.map(tag => tag.match(/\ssrc="([^"]+)"/)[1]);
assert.deepEqual(evidencePaths, evidenceFiles.map(file => 'assets/img/evidencias/' + file));
assert.equal(evidenceTags.length,2);
for (const tag of evidenceTags) {
  assert(/alt="[^"]+"/.test(tag));
  assert(!/\shidden(?:\s|>)/.test(tag),'No combinar lazy loading con una imagen oculta al iniciar');
  assert(tag.includes('loading="lazy"'));
  assert(!tag.includes('data-evidence-src'));
}
for (const relativePath of evidencePaths) {
  const imagePath = path.join(root, relativePath);
  assert(fs.statSync(path.dirname(imagePath)).isDirectory());
  assert(fs.existsSync(imagePath), `Falta una evidencia real: ${relativePath}`);
  if (fs.existsSync(imagePath)) {
    const bytes = fs.readFileSync(imagePath);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `No tiene cabecera PNG: ${relativePath}`);
    assert.equal(bytes.subarray(12, 16).toString(), 'IHDR');
    assert(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0, `Dimensiones inválidas: ${relativePath}`);
  }
}
const evidenceSection = html.match(/<section id="evidencias"[\s\S]*?<\/section>/)[0];
const fiberProject = [...html.matchAll(/<article class="project">[\s\S]*?<\/article>/g)].find(match => match[0].includes('<h3>Gestión de infraestructura de fibra óptica</h3>'))[0];
const fiberEvidence = [...evidenceSection.matchAll(/<article class="evidence-card">[\s\S]*?<\/article>/g)].find(match => match[0].includes('<h3>Gestión de infraestructura de fibra óptica</h3>'))[0];
const description = card => card.match(/<\/h3><p>(.*?)<\/p>/)[1];
assert.equal(description(fiberProject), description(fiberEvidence), 'El alcance de fibra óptica debe coincidir en ambas secciones');
for (const card of [fiberProject, fiberEvidence]) {
  for (const term of ['React', 'Vite', 'Node.js', 'Express', 'Leaflet', 'OpenStreetMap', 'datos ficticios', 'MySQL', 'configuración y validación']) assert(card.includes(term));
}

assert(!/<dt>(Correo electrónico|Teléfono|LinkedIn)<\/dt>/.test(html), 'No mostrar contactos sin confirmar');
for (const file of ['index-CpCHni7L.js', 'index-B5r9Ei_8.css']) assert(!fs.existsSync(path.join(__dirname, file)), `Archivo heredado innecesario: ${file}`);
assert(!/Espacio para|Espacios preparados/.test(evidenceSection));
for (const term of ['API REST', 'palabra clave', 'reproducción de canales', 'SIAGIE', 'mapas interactivos']) assert(evidenceSection.includes(term));
const extraImages = fs.readdirSync(path.join(__dirname, 'img/evidencias')).filter(file => /\.(png|jpe?g|webp|gif)$/i.test(file) && !evidenceFiles.includes(file));
for (const file of extraImages) console.log(`REVISAR: imagen adicional: assets/img/evidencias/${file}`);
assert(!fs.existsSync(path.join(__dirname, 'img/evidencias/aurora-ines-tejada.jpg')), 'No reincorporar la captura antigua con datos escolares');
for (const name of ['pcondell.png','fiberplus-tv.png','aurora-ines-tejada.png','infraestructura-fibra-optica.png']) {
 assert(!fs.existsSync(path.join(__dirname,'img/evidencias',name)));
 assert(!html.includes('evidencias/'+name));
}
const reserved = [...evidenceSection.matchAll(/<article class="evidence-card">[\s\S]*?<\/article>/g)].map(m=>m[0]).filter(c=>!c.includes('class="evidence-image"'));
assert.equal(reserved.length,3);
for (const card of reserved) {
 assert(card.includes('Representación conceptual'));
 assert(card.includes('<figure class="concept-art">'));
 assert(card.includes('<figcaption>Ilustración conceptual'));
 assert(!card.includes('class="evidence-expand"'));
 const tag=card.match(/<img[^>]+>/)[0];
 assert(/alt="Ilustración conceptual: [^"]+"/.test(tag));
 const svg=fs.readFileSync(path.join(root,tag.match(/src="([^"]+)"/)[1]),'utf8');
 assert(svg.includes('viewBox="0 0 560 290"'));
 assert(svg.includes('<title') && svg.includes('<desc'));
 assert(!/<(?:script|image|foreignObject)\b|\b(?:href|onload|onclick)=/i.test(svg),'SVG propio sin recursos externos ni código ejecutable');
}
assert(!html.includes('Captura reservada'));
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]));
for (const file of ['assets/css/style.css', 'assets/js/main.js']) {
  assert(html.includes(file));
  assert(fs.existsSync(path.join(root, file)));
}
assert(!/Mely|Kari|Rojas|index-CpCHni7L|index-B5r9Ei_8/.test(html));
const externalLinks = [...html.matchAll(/<a\b[^>]*href="(https?:[^\"]+)"[^>]*>/g)];
assert.equal(externalLinks.length, 2);
for (const [tag, url] of externalLinks) {
  assert.equal(url, 'https://github.com/condellactapaul-create');
  assert(tag.includes('target="_blank"'));
  assert(tag.includes('rel="noopener noreferrer"'));
}
const cvFile = path.join(root, 'assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf');
const cvLink = 'href="assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf"';
if (html.includes(cvLink)) {
  const downloadLink = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].find(match => match[1].includes(cvLink));
  assert(downloadLink, 'La descarga debe ser un enlace nativo accesible con teclado');
  assert(/\sdownload(?:\s|=|$)/.test(downloadLink[1]));
  assert.equal(downloadLink[2].trim(), 'Descargar CV');
  assert(!/\b(?:disabled|hidden)\b|tabindex="-1"|aria-disabled="true"/.test(downloadLink[1]));
  assert(!html.includes('estado-cv'), 'No debe quedar el aviso del PDF pendiente');
  assert(fs.existsSync(cvFile), 'El enlace CV requiere el archivo real');
  const pdf = fs.readFileSync(cvFile);
  assert(pdf.length > 5 && pdf.subarray(0, 5).toString() === '%PDF-', 'No es un PDF válido según su cabecera');
} else {
  assert.fail('Debe existir el enlace activo al PDF público verificado');
}
assert(!fs.existsSync(path.join(__dirname,'docs/CV_Paul_Pascual_Conde_Llacta.pdf')), 'No incorporar el PDF privado');
assert(html.includes('Imagen no disponible'));
const photoTag = html.match(/<img\b[^>]*id="foto-perfil"[^>]*>/)[0];
const photoSource = photoTag.match(/src="([^"]+)"/)[1];
assert.equal(photoSource, 'assets/img/perfil-tecnologico.png');
assert(fs.existsSync(path.join(root, photoSource)));
const profileBytes = fs.readFileSync(path.join(root, photoSource));
assert.equal(profileBytes.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
assert.equal(profileBytes.readUInt32BE(16),1536);
assert.equal(profileBytes.readUInt32BE(20),1024);
assert(!/<img\b[^>]*src="https?:/i.test(html), 'Todas las imágenes deben ser locales');
assert(/<a href="#inicio" aria-current="location">Inicio<\/a>/.test(html));
assert(!/\shidden(?:\s|>)/.test(photoTag), 'La imagen no debe depender de JS para empezar visible');
assert(/alt="[^"]+"/.test(photoTag));
assert(!/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html));
for (const match of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert(ids.includes(match[1]));
for (const match of html.matchAll(/aria-describedby="([^"]+)"/g)) for (const id of match[1].split(/\s+/)) assert(ids.includes(id));
for (const match of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\s(?:src|href)="(assets\/[^"#]+)"/g)) {
  assert(fs.existsSync(path.join(root, match[1])), `Ruta local ausente: ${match[1]}`);
}
for (const match of html.matchAll(/<button\b([^>]*)>/g)) {
  assert(match[1].includes('disabled') || match[1].includes('aria-controls="navegacion"') || match[1].includes('class="evidence-expand"') || match[1].includes('class="dialog-close"'));
}
assert.equal((html.match(/class="evidence-expand"/g) || []).length, 2);
assert(html.includes('<dialog id="evidence-dialog"'));
assert.equal((css.match(/{/g)||[]).length, (css.match(/}/g)||[]).length);
assert(css.includes('@media(max-width:960px)'));
assert(css.includes('prefers-reduced-motion:reduce'));
assert(css.includes('nav[hidden],.menu[hidden]'));

// Prueba funcional del controlador con estados equivalentes a móvil y escritorio.
const handlers = {};
const attributes = {};
const document = { activeElement: null, querySelectorAll: () => [] };
const section = {setAttribute: () => {}, focus: () => document.activeElement = section};
const link = {hash: '#proyectos', focus: () => document.activeElement = link};
const button = {
  hidden: true,
  setAttribute: (k,v) => attributes[k] = v,
  addEventListener: (k,f) => handlers['button:'+k] = f,
  focus: () => document.activeElement = button
};
const nav = {
  hidden: false,
  contains: element => element === link,
  querySelector: () => link,
  addEventListener: (k,f) => handlers['nav:'+k] = f
};
const mobile = {matches: true, addEventListener: (k,f) => handlers['viewport:'+k] = f};
document.querySelector = selector => ({'.menu': button, '#navegacion': nav, '#proyectos': section})[selector] || null;
document.addEventListener = (k,f) => handlers['document:'+k] = f;
const window = {matchMedia: query => {
  assert.equal(query, '(max-width: 960px)');
  return mobile;
}};
vm.runInNewContext(js, {document, window});
assert.equal(button.hidden, false); assert.equal(nav.hidden, true);
handlers['button:click'](); assert.equal(nav.hidden, false); assert.equal(attributes['aria-expanded'], 'true');
handlers['button:click'](); assert.equal(nav.hidden, true); assert.equal(attributes['aria-expanded'], 'false');
handlers['button:click'](); document.activeElement = link;
handlers['nav:click']({target: {closest: () => link}});
assert.equal(nav.hidden, true); assert.equal(attributes['aria-expanded'], 'false'); assert.equal(document.activeElement, section);
handlers['button:click'](); handlers['document:keydown']({key: 'Escape'});
assert.equal(nav.hidden, true); assert.equal(document.activeElement, button);
handlers['button:click'](); mobile.matches = false; handlers['viewport:change']();
assert.equal(button.hidden, true); assert.equal(nav.hidden, false); assert.equal(attributes['aria-expanded'], 'false');
assert.equal(document.activeElement, link);
handlers['button:click'](); assert.equal(nav.hidden, false);
mobile.matches = true; handlers['viewport:change']();
assert.equal(button.hidden, false); assert.equal(nav.hidden, true); assert.equal(document.activeElement, button);

// Cambio de estado para anchos representativos; no mide geometría de píxeles.
for (const width of [320, 375, 768, 960, 961, 1024, 1440]) {
  mobile.matches = width <= 960;
  handlers['viewport:change']();
  assert.equal(button.hidden, width > 960);
  assert.equal(nav.hidden, width <= 960);
  assert.equal(attributes['aria-expanded'], 'false');
}
console.log('PASS: HTML, seven sections, five projects, five cards and two evidence images, participation labels, links, CV state and local resources.');
console.log('PASS: mobile/desktop states at 320, 375, 768, 960, 961, 1024 and 1440; toggle, Escape, section focus and resize reset.');

// La ilustración local se prueba sin red.
function checkPhoto(complete, naturalWidth, initiallyHidden) {
  const events = {};
  const photo = {complete, naturalWidth, hidden: false, addEventListener: (name, fn) => events[name] = fn};
  const fallback = {hidden: false};
  const photoDocument = {querySelectorAll: () => [], querySelector: selector => ({'#foto-perfil': photo, '#foto-marcador': fallback})[selector] || null};
  vm.runInNewContext(js, {document: photoDocument, window: {}});
  assert.equal(photo.hidden, initiallyHidden);
  assert.equal(fallback.hidden, complete && naturalWidth > 0);
  photo.naturalWidth = 400; events.load();
  assert.equal(photo.hidden, false); assert.equal(fallback.hidden, true);
  events.error();
  assert.equal(photo.hidden, true); assert.equal(fallback.hidden, false);
}
checkPhoto(false, 0, false); // Solicitud en curso.
checkPhoto(true, 400, false); // Cargada desde caché.
checkPhoto(true, 0, true); // Error anterior a defer.
console.log('PASS: local technological illustration loading, cached success and error fallback; no remote avatar.');

// Evidencia ausente, carga correcta, error posterior y caché (sin abrir archivos ni red).
for (const complete of [false, true]) {
  for (const naturalWidth of [0, 1280]) {
    const events = {};
    const image = {
      hidden: false, complete, naturalWidth, src:evidencePaths[0],
      addEventListener: (name, fn) => events[name] = fn
    };
    const placeholder = {hidden: true};
    const state = {textContent: 'Evidencia académica'};
    const card = {querySelector: selector => ({
      '.evidence-image': image, '.evidence-placeholder': placeholder, '[data-evidence-state]': state
    })[selector]};
    const evidenceDocument = {querySelector: () => null, querySelectorAll: () => [card]};
    vm.runInNewContext(js, {document: evidenceDocument, window: {}});
    assert.equal(image.src, evidencePaths[0]);
    assert.equal(image.hidden, complete && naturalWidth === 0);
    assert.equal(placeholder.hidden, !(complete && naturalWidth===0));
    if (!complete) assert.equal(state.textContent,'Evidencia académica','Una carga pendiente no debe marcarse como error');
    image.naturalWidth = 1280; events.load();
    assert.equal(image.hidden, false); assert.equal(placeholder.hidden, true);
    assert.equal(state.textContent, 'Captura incorporada');
    events.error();
    assert.equal(image.hidden, true); assert.equal(placeholder.hidden, false);
    assert.equal(state.textContent, 'Imagen no disponible');
  }
}
console.log('PASS: two required local PNG images, headers and dimensions, descriptions, missing/cached/loaded/error evidence states.');
console.log('Source and simulated DOM checks; visual layout and native Tab/Enter behavior require browser review.');

// Prueba funcional de ampliación: contenido correcto, cierre y retorno del foco.
const modalEvents = {};
const imageEvents = {};
let openEvidence;
let closeEvidence;
let focusTarget;
const bodyClasses = new Set();
const enlargedImage = {addEventListener: (name, fn) => imageEvents[name] = fn};
const dialogTitle = {textContent: ''};
const dialogDescription = {textContent: ''};
const dialogError = {hidden: true};
const closeControl = {addEventListener: (name, fn) => closeEvidence = fn, focus: () => focusTarget = closeControl};
const sourceImage = {hidden: false, src: evidencePaths[1], alt: 'Controles generales de SIAGIE'};
const evidenceCard = {querySelector: selector => selector === 'h3' ? {textContent: 'Prácticas en Aurora Inés Tejada'} : selector === '.evidence-body > p' ? {textContent: 'Apoyo en gestión administrativa mediante SIAGIE.'} : sourceImage};
const trigger = {addEventListener: (name, fn) => openEvidence = fn, closest: () => evidenceCard, focus: () => focusTarget = trigger};
const dialog = {
  open: false,
  querySelector: selector => ({'.dialog-image': enlargedImage, '#evidence-dialog-title': dialogTitle, '#evidence-dialog-description': dialogDescription, '.dialog-close': closeControl, '.dialog-error': dialogError})[selector],
  showModal: () => dialog.open = true,
  close: () => { dialog.open = false; modalEvents.close(); },
  addEventListener: (name, fn) => modalEvents[name] = fn,
  getBoundingClientRect: () => ({left: 20, right: 300, top: 20, bottom: 300})
};
const modalDocument = {
  querySelector: selector => selector === '#evidence-dialog' ? dialog : null,
  querySelectorAll: selector => selector === '.evidence-expand' ? [trigger] : [],
  body: {classList: {add: name => bodyClasses.add(name), remove: name => bodyClasses.delete(name)}}
};
vm.runInNewContext(js, {document: modalDocument, window: {}});
openEvidence();
assert(dialog.open); assert(bodyClasses.has('evidence-open')); assert.equal(focusTarget, closeControl);
assert.equal(enlargedImage.src, sourceImage.src); assert.equal(enlargedImage.alt, sourceImage.alt);
assert.equal(dialogTitle.textContent, 'Prácticas en Aurora Inés Tejada');
assert.equal(dialogDescription.textContent, 'Apoyo en gestión administrativa mediante SIAGIE.');
imageEvents.error(); assert(!dialogError.hidden); assert(enlargedImage.hidden);
imageEvents.load(); assert(dialogError.hidden); assert(!enlargedImage.hidden);
modalEvents.click({target: dialog, clientX: 50, clientY: 50}); assert(dialog.open);
closeEvidence(); assert(!dialog.open); assert(!bodyClasses.has('evidence-open')); assert.equal(focusTarget, trigger);
openEvidence(); modalEvents.click({target: dialog, clientX: 0, clientY: 0}); assert(!dialog.open);
openEvidence(); dialog.close(); assert.equal(focusTarget, trigger); // Ruta de cierre nativa, incluido Escape.
sourceImage.hidden = true; openEvidence(); assert(!dialog.open);
console.log('PASS: evidence dialog content, alt text, error/reload, close button, backdrop, scroll reset and focus restoration. Native Escape/Tab require browser review.');

for(const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g))assert(!/^(?:file:|[A-Za-z]:[\\/]|[\\/]{2})/i.test(m[1]),'No usar enlaces Windows ni rutas absolutas');
console.log('PASS: descarga activa del CV público y ausencia del PDF privado.');
