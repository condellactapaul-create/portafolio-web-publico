// Revisión real sin dependencias: node assets/verify-browser.cjs
// Usa Edge instalado en Windows o CV_BROWSER_PATH. No instala navegador.
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const pageUrl=process.env.CV_PREVIEW_URL || pathToFileURL(path.join(root,'index.html')).href;
const executable = process.env.CV_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
assert(fs.existsSync(executable), 'No hay navegador local; indica CV_BROWSER_PATH sin instalar dependencias.');
const temporary = fs.mkdtempSync(path.join(root, '.cv-preview-'));
const profile = path.join(temporary, 'profile');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
let socket;
let sessionId;
let nextId = 0;
const pending = new Map();
const scriptErrors = [];
const downloadProgress = new Map();
const downloads = [];
function cdp(method, params = {}, session = sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {pending.delete(id); reject(new Error('CDP timeout: ' + method));}, 15000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params, ...(session ? {sessionId: session} : {})}));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', {expression, awaitPromise:true, returnByValue:true});
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function key(key, code, windowsVirtualKeyCode) {
  await cdp('Input.dispatchKeyEvent', {type:'keyDown',key,code,windowsVirtualKeyCode,...(key==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});
  await cdp('Input.dispatchKeyEvent', {type:'keyUp',key,code,windowsVirtualKeyCode});
  await pause(80);
}
async function screenshot(name) {
  const {data} = await cdp('Page.captureScreenshot', {format:'png',captureBeyondViewport:false});
  fs.writeFileSync(path.join(temporary, name + '.png'), Buffer.from(data,'base64'));
}
async function loadEvidenceByScrolling() {
  // No cambia loading/src/hidden ni llama a decode para forzar la carga.
  for (let index=0;index<2;index++) {
    await evaluate(`document.querySelectorAll('.evidence-image')[${index}].scrollIntoView({behavior:'instant',block:'center'})`);
    let loaded = false;
    for (let attempt=0;attempt<25;attempt++) {
      loaded = await evaluate(`(() => {const i=document.querySelectorAll('.evidence-image')[${index}];return i.complete && i.naturalWidth>0 && !i.hidden})()`);
      if (loaded) break;
      await pause(100);
    }
    if (!loaded) console.log('Estado real de las evidencias:',await evaluate(`Array.from(document.querySelectorAll('.evidence-image'),i=>({src:i.getAttribute('src'),loading:i.loading,hidden:i.hidden,complete:i.complete,naturalWidth:i.naturalWidth,rects:i.getClientRects().length}))`));
    assert(loaded,`La evidencia ${index+1} no carga al entrar en pantalla con file://`);
  }
  await evaluate(`scrollTo({top:0,behavior:'instant'})`); await pause(250);
}
(async () => {
 try {
  browser = spawn(executable, ['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking','--disable-component-update','--disable-sync','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1','about:blank'], {stdio:'ignore',windowsHide:true});
  browser.on('error', error => console.error(error.message));
  let portInfo;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {portInfo = fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/); break;} catch {}
    await pause(250);
  }
  assert(portInfo, 'El navegador no inició el puerto local de inspección.');
  socket = new WebSocket(`ws://127.0.0.1:${portInfo[0]}${portInfo[1]}`);
  await new Promise((resolve,reject) => {socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if(message.method==='Fetch.requestPaused'){
 const allowed=message.params.request.url.startsWith(new URL('.',pageUrl).href);
 cdp(allowed?'Fetch.continueRequest':'Fetch.failRequest',{requestId:message.params.requestId,...(allowed?{}:{errorReason:'BlockedByClient'})}).catch(e=>scriptErrors.push({text:e.message}));
}
    if(message.method==='Browser.downloadWillBegin')downloads.push(message.params);
    if(message.method==='Browser.downloadProgress')downloadProgress.set(message.params.guid,message.params.state);
    if (message.method==='Runtime.exceptionThrown') scriptErrors.push(message.params.exceptionDetails);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id); clearTimeout(request.timer);
    if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
  });
  const {targetId} = await cdp('Target.createTarget',{url:'about:blank'},null);
  sessionId = (await cdp('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  console.log('Navegador instalado:', executable, await cdp('Browser.getVersion',{},null));
  await cdp('Page.bringToFront');
  await cdp('Emulation.setFocusEmulationEnabled',{enabled:true});
  if(pageUrl.startsWith('http:'))await cdp('Fetch.enable',{patterns:[{urlPattern:'*'}]});
  else await cdp('Network.setBlockedURLs',{urls:['http://*','https://*']});
  const navigation=await cdp('Page.navigate',{url:pageUrl});
  assert(!navigation.errorText,JSON.stringify(navigation));
  for (let attempt=0; attempt<60; attempt++) {
    if (await evaluate(`document.readyState === 'complete' && !!document.querySelector('.menu')`)) break;
    await pause(100);
  }
  console.log("Documento de prueba:",await evaluate("({url:location.href,title:document.title,hasMenu:!!document.querySelector('.menu')})"));
  assert(await evaluate("document.querySelector('a[download]').getAttribute('href')==='assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf' && !document.querySelector('#estado-cv-publico')"));
  assert.equal(await evaluate(`document.querySelectorAll('.evidence-card').length`),5);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('.evidence-card')).filter(c=>c.querySelector('.concept-art') && !c.querySelector('.evidence-expand')).length`),3);
  assert(await evaluate(`Promise.all(Array.from(document.querySelectorAll('.concept-art img'),i=>i.decode())).then(()=>true)`));
  const accessibility = await cdp('Accessibility.getFullAXTree');
  assert.equal(accessibility.nodes.filter(n=>n.role?.value==='image' && n.name?.value.startsWith('Ilustración conceptual:')).length,3,'Las tres ilustraciones deben tener nombres accesibles');
  await loadEvidenceByScrolling();
  assert.equal(await evaluate(`document.querySelectorAll('.evidence-image:not([hidden])').length`),2);
  assert(await evaluate(`document.querySelector('#foto-perfil').decode().then(()=>document.querySelector('#foto-perfil').naturalWidth===1536)`));
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#foto-perfil')).objectFit`),'contain');
  assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#inicio');
  console.log('PASS: ilustración tecnológica local cargada completa e Inicio activo en la apertura.');
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  for (const width of [320,375,768,960,1024,1440]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await evaluate(`scrollTo(0,0)`); await pause(150);
    const result = await evaluate(`(() => {const d=document.documentElement;const p=document.querySelector('.profile').getBoundingClientRect();return {width:innerWidth,overflow:d.scrollWidth>d.clientWidth,columns:getComputedStyle(document.querySelector('.hero')).gridTemplateColumns,profileBottom:Math.round(p.bottom),menu:!document.querySelector('.menu').hidden}})()`);
    assert(!result.overflow, `Desbordamiento horizontal a ${width}px`);
    assert(await evaluate(`Array.from(document.querySelectorAll('.evidence-media')).every(media => {const r=media.getBoundingClientRect();return Math.abs(r.height-r.width/1.6)<2})`),'Los marcos de evidencia deben conservar su relación de aspecto y altura uniforme');
    assert(await evaluate(`Array.from(document.querySelectorAll('.concept-art')).every(art=>{const img=art.querySelector('img'),cap=art.querySelector('figcaption'),a=art.getBoundingClientRect(),i=img.getBoundingClientRect(),c=cap.getBoundingClientRect();return img.naturalWidth>0 && i.height>70 && i.bottom<=c.top && c.bottom<=a.bottom && cap.scrollWidth<=cap.clientWidth && parseFloat(getComputedStyle(cap).fontSize)>=14})`),'Ilustraciones y leyendas legibles sin solapamientos');
    assert(await evaluate(`Array.from(document.querySelectorAll('.badge')).every(b=>b.scrollWidth<=b.clientWidth && parseFloat(getComputedStyle(b).fontSize)>=14)`),'Etiquetas de estado legibles y sin recortes');
    assert.equal(result.menu,width<=960);
    assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#inicio');
    if (width>=1024) assert(result.profileBottom<=900,'Perfil fuera del viewport de escritorio');
    console.log('PASS layout:',JSON.stringify(result));
    if (width===375 || width===1440) await screenshot('viewport-'+width);
  }
  // Reflujo equivalente a un escritorio de 1440 px al 200%: 720 CSS px.
  await cdp('Emulation.setDeviceMetricsOverride',{width:720,height:450,deviceScaleFactor:2,mobile:false});
  assert(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`));
  console.log('PASS: reflujo a 720 CSS px con escala de píxel 2; zoom nativo requiere revisión manual.');
  await cdp('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:false});
  await pause(250);
  await evaluate(`scrollTo(0,0)`);
  await evaluate(`document.querySelector('.menu').focus()`); await key('Enter','Enter',13);
  assert(await evaluate(`!document.querySelector('nav').hidden && document.querySelector('.menu').getAttribute('aria-expanded')==='true'`));
  await key('Escape','Escape',27);
  assert(await evaluate(`document.querySelector('nav').hidden && document.activeElement.matches('.menu')`));
  await key('Enter','Enter',13); await key('Tab','Tab',9);
  assert(await evaluate(`document.activeElement.matches('nav a')`));
  await key('Enter','Enter',13);
  assert(await evaluate(`document.querySelector('nav').hidden && document.activeElement.id==='inicio'`));
  console.log('PASS: menú móvil con Enter, Tab, ancla, Escape y foco nativos.');
  await evaluate(`document.querySelector('.evidence-expand').focus()`); await key(' ','Space',32);
  assert(await evaluate(`document.querySelector('dialog').open`));
  await key('Escape','Escape',27);
  for (let index=0;index<2;index++) {
    await evaluate(`document.querySelectorAll('.evidence-expand')[${index}].focus()`); await key('Enter','Enter',13);
    assert(await evaluate(`document.querySelector('dialog').open && document.body.classList.contains('evidence-open') && getComputedStyle(document.body).overflow==='hidden'`));
    assert(await evaluate(`!!document.querySelector('#evidence-dialog-description').textContent && document.activeElement.matches('.dialog-close')`));
    await key('Tab','Tab',9);
    assert(await evaluate(`document.activeElement.closest('dialog')!==null || document.activeElement===document.body`));
    await key('Escape','Escape',27);
    assert(await evaluate(`!document.querySelector('dialog').open && !document.body.classList.contains('evidence-open') && document.activeElement===document.querySelectorAll('.evidence-expand')[${index}]`));
  }
  console.log('PASS: dos modales con teclado nativo, descripción, bloqueo de scroll y retorno del foco.');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await pause(150);
  for (const id of ['proyectos','evidencias']) {
    await evaluate(`document.getElementById('${id}').scrollIntoView()`); await pause(200);
    assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#'+id);
    await screenshot(id);
  }
  await cdp('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  await evaluate(`scrollTo(0,0)`); await pause(150);
  assert(await evaluate(`document.querySelector('.profile').getBoundingClientRect().bottom<innerHeight && document.querySelector('.actions').getBoundingClientRect().bottom<innerHeight`));
  console.log('PASS: perfil y cuatro botones visibles a 1366 x 768; indicador de sección activa en Proyectos y Evidencias.');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.querySelectorAll('.evidence-expand')[1].click()`); await pause(120); await screenshot('modal-pcondell');
  await evaluate(`document.querySelector('.dialog-close').click()`);
  assert(await evaluate(`!document.querySelector('dialog').open`));
  await evaluate(`document.querySelector('.evidence-expand').click()`);
  await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:5,y:5,button:'left',clickCount:1});
  await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:5,y:5,button:'left',clickCount:1});
  assert(await evaluate(`!document.querySelector('dialog').open`));
  console.log('PASS: cierre mediante botón. Capturas locales:',temporary);
  // Cruza cada límite desde ambos lados, con cabecera fija y sin ella.
  for (const width of [375,1440]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await pause(250);
    const ids = await evaluate(`Array.from(document.querySelectorAll('main section[id]'),section=>section.id)`);
    for (let index=1; index<ids.length; index++) {
      const target = JSON.stringify(ids[index]);
      await evaluate(`(() => {const h=document.querySelector('header');const line=(getComputedStyle(h).position==='sticky'?h.getBoundingClientRect().bottom:0)+24;scrollTo(0,document.getElementById(${target}).getBoundingClientRect().top+scrollY-line-70)})()`);
      await pause(250);
      const atBottom = await evaluate(`scrollY>0 && scrollY+innerHeight>=document.documentElement.scrollHeight-2`);
      const expected = atBottom && index===ids.length-1 ? ids[index] : ids[index-1];
      assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#'+expected,`Activación prematura antes de ${ids[index]} a ${width}px`);
      await evaluate(`scrollBy(0,74)`); await pause(250);
      assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#'+ids[index],`Sección incorrecta tras alcanzar ${ids[index]} a ${width}px`);
    }
    await evaluate(`scrollTo(0,0)`); await pause(250);
    assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#inicio');
  }
  await evaluate(`document.querySelector('.actions a[href="#proyectos"]').click()`); await pause(300);
  assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#proyectos');
  await evaluate(`document.querySelector('footer a[href="#inicio"]').click()`); await pause(300);
  assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#inicio');
  await evaluate(`location.hash='#experiencia'`); await pause(300);
  assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#experiencia');
  await cdp('Page.reload'); await pause(500);
  assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#experiencia');
  await loadEvidenceByScrolling();
  for (let index=0;index<2;index++) {
    await evaluate(`document.querySelectorAll('.evidence-expand')[${index}].focus()`); await key('Enter','Enter',13);
    assert(await evaluate(`document.querySelector('dialog').open && document.querySelector('.dialog-image').naturalWidth>0`));
    await key('Escape','Escape',27);
    assert(await evaluate(`!document.querySelector('dialog').open`));
  }
  console.log('PASS: recarga con carga lazy nativa de dos capturas y dos modales cerrados con Escape.');
  await evaluate(`document.querySelectorAll('.evidence-card')[2].scrollIntoView({behavior:'instant',block:'start'})`);
  await pause(150); await screenshot('ilustraciones-conceptuales');
  await evaluate(`document.querySelectorAll('.evidence-card')[4].scrollIntoView({behavior:'instant',block:'start'})`);
  await pause(150); await screenshot('ilustracion-fibra');
  await cdp('Emulation.setDeviceMetricsOverride',{width:375,height:900,deviceScaleFactor:1,mobile:false});
  await evaluate(`document.querySelectorAll('.evidence-card')[2].scrollIntoView({behavior:'instant',block:'start'})`);
  await pause(150); await screenshot('ilustracion-movil');
  await evaluate(`location.hash='#inicio'`); await pause(300);
  assert.equal(await evaluate(`document.querySelector('nav a[aria-current]').hash`),'#inicio');
  await evaluate(`document.querySelector('#foto-perfil').src='assets/img/imagen-inexistente-prueba.png'`); await pause(150);
  assert(await evaluate(`document.querySelector('#foto-perfil').hidden && !document.querySelector('#foto-marcador').hidden`));
  await evaluate(`document.querySelector('#foto-perfil').src='assets/img/perfil-tecnologico.png'`);
  await evaluate(`document.querySelector('#foto-perfil').decode()`); await pause(80);
  assert(await evaluate(`!document.querySelector('#foto-perfil').hidden && document.querySelector('#foto-marcador').hidden`));
  const downloadDirectory=path.join(temporary,'downloads');
  fs.mkdirSync(downloadDirectory);
  await cdp('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDirectory,eventsEnabled:true},null);
  await evaluate("document.querySelector('a[download]').click()");
  for(let attempt=0;attempt<100;attempt++){if(downloads.length && downloadProgress.get(downloads[0].guid)==='completed')break;await pause(100);}
  assert.equal(downloads.length,1,'La descarga debe iniciarse una vez');
  assert.equal(downloadProgress.get(downloads[0].guid),'completed');
  assert.equal(downloads[0].suggestedFilename,'CV_Paul_Pascual_Conde_Llacta_Publico.pdf');
  const downloaded=fs.readFileSync(path.join(downloadDirectory,downloads[0].suggestedFilename));
  assert(downloaded.equals(fs.readFileSync(path.join(root,'assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf'))),'El PDF descargado debe ser idéntico al público verificado');
  console.log('PASS: descarga nativa completada y PDF recibido idéntico al archivo público.');
  assert.equal(scriptErrors.length,0,'No debe haber excepciones JavaScript en el navegador');
  console.log('PASS: límites de todas las secciones en móvil/escritorio sin activación prematura; enlaces internos, hash, recarga profunda, retorno a Inicio y marcador local ante error.');
  if (process.env.CV_KEEP_PREVIEW !== '1') console.log('Las capturas temporales se retirarán al finalizar. Usa CV_KEEP_PREVIEW=1 para conservarlas.');
 } finally {
  if (socket && socket.readyState===1) {try {await cdp('Browser.close',{},null);} catch {} socket.close();}
  if (browser && browser.exitCode===null) browser.kill();
  await pause(1000);
  // Solo elimina el directorio temporal creado por esta ejecución dentro de CV.
  if (process.env.CV_KEEP_PREVIEW !== '1' && path.dirname(temporary)===root && path.basename(temporary).startsWith('.cv-preview-')) fs.rmSync(temporary,{recursive:true,force:true,maxRetries:3,retryDelay:500});
 }
})().catch(error => {console.error(error);process.exitCode=1;});
