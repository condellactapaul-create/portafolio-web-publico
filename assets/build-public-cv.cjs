// Genera únicamente el CV público desde su fuente HTML, usando un navegador instalado.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const input=path.join(root,'assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.html');
const output=input.replace(/\.html$/,'.pdf');
const executable=process.env.CV_BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
assert(fs.existsSync(executable),'Se requiere navegador instalado; no se instala ninguno');
const temp=fs.mkdtempSync(path.join(root,'.cv-preview-'));
const profile=path.join(temp,'profile');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser,socket,session,id=0;
const pending=new Map();
function cdp(method,params={},sid=session){return new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout: '+method))},15000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sid?{sessionId:sid}:{})}));})}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
(async()=>{try{
 browser=spawn(executable,['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking','--disable-component-update','--disable-sync','--host-resolver-rules=MAP * ~NOTFOUND','about:blank'],{stdio:'ignore',windowsHide:true});
 let port;
 for(let i=0;i<80;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/);break}catch{}await pause(250)}
 assert(port,'No arrancó el navegador');
 socket=new WebSocket('ws://127.0.0.1:'+port[0]+port[1]);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)});
 const {targetId}=await cdp('Target.createTarget',{url:'about:blank'},null);
 session=(await cdp('Target.attachToTarget',{targetId,flatten:true},null)).sessionId;
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
 await cdp('Network.setBlockedURLs',{urls:['http://*','https://*']});
 await cdp('Page.navigate',{url:pathToFileURL(input).href});
 for(let i=0;i<60;i++){if(await evaluate("document.readyState==='complete' && !!document.querySelector('main')"))break;await pause(100)}
 await evaluate('document.fonts.ready.then(()=>true)');
 const result=await cdp('Page.printToPDF',{preferCSSPageSize:true,displayHeaderFooter:false,printBackground:false,generateTaggedPDF:true});
 const bytes=Buffer.from(result.data,'base64');
 assert(bytes.subarray(0,5).toString()==='%PDF-');
 fs.writeFileSync(output,bytes);
 console.log('PDF nuevo generado:',path.basename(output),'bytes:',bytes.length,'páginas:',(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length);
 const opened=await cdp('Page.navigate',{url:pathToFileURL(output).href});
 assert(!opened.errorText,JSON.stringify(opened));
 await pause(1500);
 const image=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 fs.writeFileSync(path.join(temp,'cv-publico.png'),Buffer.from(image.data,'base64'));
 console.log('PDF abierto por el navegador; captura local:',path.join(temp,'cv-publico.png'));
}finally{
 if(socket&&socket.readyState===1){try{await cdp('Browser.close',{},null)}catch{}socket.close()}
 if(browser&&browser.exitCode===null)browser.kill();
 await pause(1000);
 if(process.env.CV_KEEP_PREVIEW!=='1'&&path.dirname(temp)===root&&path.basename(temp).startsWith('.cv-preview-'))fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:500});
}})().catch(error=>{console.error(error);process.exitCode=1});
