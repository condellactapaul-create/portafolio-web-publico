# Preparación del primer commit — 4 de noviembre de 2026

Se confirmó la carpeta `portafolio-web-publico` antes de actuar: no contenía `.git` y Git no detectó un repositorio en ella ni en sus directorios superiores. Se inicializó únicamente este proyecto con `git init --initial-branch=main .`.

Estado de esta entrega: rama inicial `main` (aún sin primer commit), 27 archivos aprobados preparados en staging, cero remotos y ningún archivo publicado. Se ejecutó `git add` únicamente sobre las rutas explícitas del inventario siguiente; no se usó `git add .` ni se incluyeron archivos adicionales.

## Inventario completo

```text
.gitignore
.nojekyll
PREPARACION-GIT.md
PREPUBLICACION.md
PROCEDENCIA.md
README.md
VERIFICACION.md
assets/LEEME.md
assets/build-public-cv.cjs
assets/css/style.css
assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.html
assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf
assets/docs/README.md
assets/img/README.md
assets/img/evidencias/README.md
assets/img/evidencias/concepto-educacion.svg
assets/img/evidencias/concepto-fibra.svg
assets/img/evidencias/concepto-tv.svg
assets/img/evidencias/pcondell-publico.png
assets/img/evidencias/sistema-preguntas-respuestas.png
assets/img/perfil-tecnologico.png
assets/js/main.js
assets/verify-browser.cjs
assets/verify-local.cjs
assets/verify-pages.cjs
assets/verify-public-cv.py
index.html
```

El inventario incluye el sitio, recursos públicos, documentación de procedencia, fuente pública del CV y herramientas locales de verificación. Los scripts no se ejecutan al visitar la página. No se añadieron servicios, dependencias ni automatizaciones de despliegue.

## Privacidad y exclusiones

El CV conserva únicamente los contactos públicos autorizados: nombre, correo, GitHub y ubicación general. Se revisaron fuente HTML, texto del PDF, enlaces, anotaciones, metadatos y streams: no se encontraron teléfono, DNI, domicilio ni credenciales. Las dos capturas públicas se inspeccionaron visualmente; no muestran registros escolares ni rutas de Windows. Las tres ilustraciones SVG son conceptuales, sin logos de terceros, datos de estudiantes ni ubicaciones reales. Las capturas retiradas y el PDF privado no están en el árbol de trabajo, tampoco como archivos ignorados.

`.gitignore` cubre perfiles y descargas de pruebas `.cv-preview-*`, dependencias, compilaciones, cachés Python, logs, temporales y respaldos; `.env` y variantes (salvo `.env.example`, que no existe y requeriría revisión); credenciales JSON/YAML, claves y certificados privados, `.git-credentials`, `.netrc`, `.npmrc`, `.ssh`, `.aws`, `.codex`, `.agents`, `.vscode` y `.idea`. Excluye expresamente las capturas retiradas, PCONDELL sin recortar y el PDF privado. Se verifican estas reglas con rutas ficticias mediante `git check-ignore --no-index`; no se crean credenciales de prueba.

Git no incluye sus propios metadatos `.git` en los candidatos. El servidor de prueba bloquea sus rutas con HTTP 404. `.gitignore` evita la incorporación normal a Git; no elimina archivos ni impide un `git add -f`. Por eso también se revisó el inventario real y la ausencia física de material privado.

La diferencia de propietarios entre el entorno aislado y el usuario de Windows se resolvió asignando al usuario titular exclusivamente la propiedad de `.git` recién creado. No se cambió `safe.directory` ni la configuración global de Git, ni se configuró identidad de commits.

## Pruebas y pendientes

Resultados en [VERIFICACION.md](VERIFICACION.md). Se comprueban `git diff --cached --name-status`, `git diff --cached --check` y `git status`: exactamente las 27 altas del inventario, sin archivos inesperados. No se regenera el CV durante las pruebas; su PDF y fuente permanecen intactos. Los permisos y atribuciones de [PROCEDENCIA.md](PROCEDENCIA.md) y [PREPUBLICACION.md](PREPUBLICACION.md) siguen vigentes. Quedan pendientes aclarar el permiso del material de partida, revisar las condiciones aplicables a la imagen de ChatGPT y autorizar expresamente la publicación. Preparar estos archivos localmente no afirma permiso de publicación. Las capturas reservadas no son necesarias para la versión con ilustraciones, y solo podrían reincorporarse tras autorización y nueva revisión.

Todavía no existe un enlace público para compartir por WhatsApp. No se creó repositorio en GitHub, remoto, commit, push ni configuración de GitHub Pages. La creación del primer commit y la publicación requieren instrucciones posteriores.
