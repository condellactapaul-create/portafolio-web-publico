"""Verifica el PDF público generado por Chromium, sin dependencias externas.
No es un lector PDF general. Rechaza estructuras que no puede inspeccionar.
Uso: python -B assets/verify-public-cv.py [--reference ruta-al-pdf-privado]
La referencia opcional solo se lee; sus contactos nunca se guardan ni imprimen.
"""
from pathlib import Path
from html.parser import HTMLParser
import re, zlib, unicodedata, sys

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / 'assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf'
SOURCE = PDF.with_suffix('.html')

def canonical(text):
    return ''.join(c for c in unicodedata.normalize('NFKC', text).casefold() if c.isalnum())

def inspect_pdf(file):
    raw = Path(file).read_bytes()
    assert raw.startswith(b'%PDF-') and raw.rstrip().endswith(b'%%EOF'), 'Cabecera o cierre PDF incorrectos'
    objects = {int(n):body for n,body in re.findall(rb'(\d+)\s+\d+\s+obj\b(.*?)\bendobj\b', raw, re.S)}
    streams = {}
    for n,body in objects.items():
        start = re.search(rb'stream\r?\n', body)
        if not start:
            continue
        header = body[:start.start()]
        length = re.search(rb'/Length\s+(\d+)(?:\s+(\d+)\s+R)?', header)
        assert length, 'Stream sin longitud inspeccionable'
        count = int(objects[int(length[1])].strip()) if length[2] else int(length[1])
        data = body[start.end():start.end()+count]
        assert len(data) == count
        if b'/FlateDecode' in header:
            data = zlib.decompress(data)
        else:
            assert b'/Filter' not in header, 'Filtro no soportado por esta verificación'
        streams[n] = data
    cmaps = {}
    for n,data in streams.items():
        if b'begincmap' not in data:
            continue
        mapping = {}
        for block in re.findall(rb'beginbfchar(.*?)endbfchar', data, re.S):
            for a,b in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', block):
                mapping[a.decode().upper()] = bytes.fromhex(b.decode()).decode('utf-16-be')
        for block in re.findall(rb'beginbfrange(.*?)endbfrange', data, re.S):
            for a,b,c in re.findall(rb'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[^>]+>|\[[^\]]+\])', block):
                first,last = int(a,16),int(b,16)
                assert last-first < 65536
                if c.startswith(b'['):
                    targets = re.findall(rb'<([0-9A-Fa-f]+)>', c)
                    assert len(targets) == last-first+1
                    values = [bytes.fromhex(t.decode()).decode('utf-16-be') for t in targets]
                else:
                    target=c[1:-1]
                    base=int(target,16)
                    width=len(target)//2
                    values=[(base+i).to_bytes(width,'big').decode('utf-16-be') for i in range(last-first+1)]
                for code,value in zip(range(first,last+1),values):
                    mapping[format(code,'0'+str(len(a))+'X')] = value
        assert mapping
        cmaps[n] = mapping
    fonts = {}
    for name,ref in re.findall(rb'/(F\d+)\s+(\d+)\s+0\s+R',raw):
        match = re.search(rb'/ToUnicode\s+(\d+)\s+0\s+R',objects[int(ref)])
        if match:
            fonts[name] = cmaps[int(match[1])]
    assert fonts, 'El PDF debe contener fuentes y mapas Unicode'
    chunks = []
    for data in streams.values():
        if not re.search(rb'\bBT\s',data):
            continue
        font=None
        pattern=rb'/(F\d+)\s+[\d.+-]+\s+Tf|<([0-9A-Fa-f\s]+)>\s*Tj|\[([^\]]*)\]\s*TJ'
        for match in re.finditer(pattern,data,re.S):
            if match[1]:
                font=match[1]
                continue
            assert font in fonts, 'Fuente no inspeccionable'
            mapping=fonts[font]
            width=max(map(len,mapping))
            parts=[match[2]] if match[2] is not None else re.findall(rb'<([0-9A-Fa-f\s]+)>',match[3])
            for part in parts:
                value=re.sub(rb'\s+',b'',part).decode().upper()
                assert len(value)%width == 0
                for i in range(0,len(value),width):
                    code=value[i:i+width]
                    assert code in mapping, 'Glifo sin correspondencia Unicode'
                    chunks.append(mapping[code])
    text=''.join(chunks)
    assert len(text)>1500, 'Texto insuficiente o PDF sin texto seleccionable'
    uris=[uri.decode('utf-8') for uri in re.findall(rb'/URI\s*\(([^)]+)\)',raw)]
    # Inspección adicional de strings y metadatos, incluidos textos UTF-16.
    views=[text,raw.decode('latin1')]
    for body in list(objects.values())+list(streams.values()):
        views.append(body.decode('utf-8','ignore'))
        for h in re.findall(rb'(?<!<)<([0-9A-Fa-f]+)>(?!>)',body):
            if len(h)%4 == 0:
                try:
                    value=bytes.fromhex(h.decode())
                    views.append(value.decode('utf-16' if value.startswith((b'\xfe\xff',b'\xff\xfe')) else 'utf-16-be'))
                except (UnicodeError,ValueError):
                    pass
    return raw,text,uris,views

class BodyText(HTMLParser):
    def __init__(self):
        super().__init__(); self.active=False; self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag=='body': self.active=True
    def handle_endtag(self,tag):
        if tag=='body': self.active=False
    def handle_data(self,data):
        if self.active: self.parts.append(data)

def verify(reference=None):
    raw,text,uris,views=inspect_pdf(PDF)
    pages=len(re.findall(rb'/Type\s*/Page\b',raw))
    assert pages==1, 'El CV público debe conservar una página legible'
    assert raw.count(b'%%EOF')==1, 'No debe haber revisiones incrementales con contenido previo'
    for marker in [b'/Encrypt',b'/AcroForm',b'/XFA',b'/EmbeddedFiles',b'/JavaScript',b'/OCProperties',b'/Subtype /Image']:
        assert marker not in raw, 'Estructura no permitida: '+marker.decode()
    assert set(uris)=={'mailto:condellactapaul@gmail.com','https://github.com/condellactapaul-create'}, 'Enlaces inesperados'
    assert len(re.findall(rb'/Subtype\s*/Link\b',raw))==len(uris), 'Anotaciones distintas de los enlaces autorizados'
    assert not re.search(rb'/Subtype\s*/(Text|Widget|FileAttachment|FreeText|Stamp)\b',raw), 'Anotaciones no permitidas'
    for required in ['PAUL PASCUAL CONDE LLACTA','condellactapaul@gmail.com','https://github.com/condellactapaul-create','SENATI','PCONDELL','SIAGIE']:
        assert required in text, 'Falta texto profesional autorizado'
    forbidden=re.compile(r'\b(?:celular|telefono|teléfono|DNI|domicilio|contraseña)\b|tel:|\[AGREGAR\]',re.I)
    phone=re.compile(r'(?<!\d)(?:\+?51[\s.-]*)?9(?:[\s.-]*\d){8}(?!\d)')
    for value in views:
        assert not forbidden.search(value), 'Se encontró un campo privado o provisional'
    # Las coordenadas y métricas de fuentes no son números telefónicos.
    # El número exacto de referencia se busca además en todos los objetos/streams.
    textual=[text]+uris
    info=re.search(rb'/Info\s+(\d+)\s+0\s+R',raw)
    if info:
        body=re.search(rb'\b'+info[1]+rb'\s+0\s+obj(.*?)endobj',raw,re.S)[1]
        textual.append(body.decode('latin1'))
        for h in re.findall(rb'<([0-9A-Fa-f]+)>',body):
            value=bytes.fromhex(h.decode())
            if value.startswith((b'\xfe\xff',b'\xff\xfe')): textual.append(value.decode('utf-16'))
    textual.extend(value for value in views if '<x:xmpmeta' in value or '<rdf:RDF' in value)
    assert not any(phone.search(value) for value in textual), 'Se encontró celular en texto, enlaces o metadatos'
    assert not any(re.search(r'(?<!\d)\d{8}(?!\d)', value) for value in textual), 'Se encontró un posible DNI de ocho dígitos en texto, enlaces o metadatos'
    parser=BodyText(); parser.feed(SOURCE.read_text(encoding='utf-8'))
    assert canonical(text)==canonical(''.join(parser.parts)), 'El PDF no coincide con toda su fuente HTML'
    if reference:
        _,original,_,_=inspect_pdf(reference)
        field=re.search(r'(?:\|\s*)?Celular:\s*([^|]+)\|\s*',original)
        assert field, 'No se identificó el campo de celular de referencia'
        digits=re.sub(r'\D','',field[1])
        forbidden_digits={digits,digits[-9:]}
        for value in views:
            normalized=re.sub(r'\D','',value)
            assert not any(number in normalized for number in forbidden_digits), 'Se conservó el número privado'
        sanitized=original[:field.start()]+original[field.end():]
        assert canonical(sanitized)==canonical(text), 'El contenido profesional difiere de la referencia sin celular'
        print('PASS: contenido fiel al PDF privado excluyendo solo el campo celular; número ausente de las vistas inspeccionadas.')
    print('PASS: PDF público de 1 página, texto Unicode seleccionable, correo y GitHub autorizados; campos privados ausentes, sin celular ni posibles DNI de ocho dígitos en texto, enlaces y metadatos.')
    return pages

if __name__=='__main__':
    args=sys.argv[1:]
    assert not args or (len(args)==2 and args[0]=='--reference')
    verify(args[1] if args else None)
