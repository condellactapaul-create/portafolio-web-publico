// Simula un subdirectorio GitHub Pages sin publicación ni dependencias.
const fs=require('node:fs'), path=require('node:path'), http=require('node:http');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const prefix='/portafolio-web-publico/';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.pdf':'application/pdf'};
const server=http.createServer((request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    if(!pathname.startsWith(prefix)){response.writeHead(404).end();return;}
    const relative=pathname.slice(prefix.length)||'index.html';
    if(relative.split('/').some(part=>part.startsWith('.'))){response.writeHead(404).end();return;}
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
    fs.createReadStream(file).pipe(response);
  }catch{response.writeHead(400).end();}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+prefix;
  try{
    const page=await fetch(base+'index.html');
    assert.equal(page.status,200);
    const html=await page.text();
    const resources=Array.from(html.matchAll(/<(?:img|script|link)\b[^>]*\s(?:src|href)="([^"]+)"/g),m=>m[1]);
    assert.equal(resources.length,8); // CSS, JS, tres PNG y tres SVG propios.
    for(const relative of resources){
      assert(!/^(?:[\\/]|file:|[A-Za-z]:)/.test(relative));
      const url=new URL(relative,base);
      assert(url.href.startsWith(base));
      const result=await fetch(url);
      assert.equal(result.status,200,relative);
      const bytes=Buffer.from(await result.arrayBuffer());
      assert(bytes.length>0);
      if(relative.endsWith('.png'))assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      if(relative.endsWith('.svg'))assert(result.headers.get('content-type').includes('image/svg+xml'));
    }
    assert(html.includes('href="assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf" download'));
    const pdfResponse=await fetch(base+'assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf');
    assert.equal(pdfResponse.status,200);
    assert(pdfResponse.headers.get('content-type').includes('application/pdf'));
    const pdfBytes=Buffer.from(await pdfResponse.arrayBuffer());
    assert(pdfBytes.equals(fs.readFileSync(path.join(root,'assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf'))));
    assert.equal((await fetch(base+'assets/docs/CV_Paul_Pascual_Conde_Llacta.pdf')).status,404);
    assert.equal((await fetch(base+'assets/img/evidencias/aurora-ines-tejada.jpg')).status,404);
    for (const name of ['pcondell.png','fiberplus-tv.png','aurora-ines-tejada.png','infraestructura-fibra-optica.png']) assert.equal((await fetch(base+'assets/img/evidencias/'+name)).status,404);
    // Un repositorio local es válido; sus metadatos nunca deben servirse.
    for (const relative of ['.git/HEAD','.git/config','.git/objects/','%2egit/config']) {
      assert.equal((await fetch(base+relative)).status,404,'No exponer metadatos Git: '+relative);
    }
    console.log('PASS: subdirectorio local, ocho recursos HTTP 200, tres PNG y tres SVG; originales reservados HTTP 404; PDF público HTTP 200 con bytes íntegros.');
    const exitCode=await new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[path.join(__dirname,'verify-browser.cjs')],{cwd:root,env:{...process.env,CV_PREVIEW_URL:base+'index.html'},stdio:'inherit',windowsHide:true});
      child.on('error',reject);child.on('exit',resolve);
    });
    assert.equal(exitCode,0,'La prueba real de navegador debe finalizar correctamente');
  }finally{
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
