# Verificación local — 4 de noviembre de 2026

Sin instalación de dependencias, commits, remotos ni publicación. Repositorio Git local inicializado en `main` para la preparación del primer commit.

- `node assets/verify-local.cjs`: aprobado. Cinco tarjetas, dos capturas y tres ilustraciones conceptuales propias con texto alternativo y leyenda; SVG sin recursos externos ni código ejecutable; originales reservados ausentes del árbol público, rutas y recursos válidos, navegación y visor en DOM simulado.
- `node --check assets/js/main.js`: aprobado.
- `python -B assets/verify-public-cv.py`: aprobado. PDF público de una página, texto seleccionable y contactos autorizados, sin campos privados, celular ni posibles DNI de ocho dígitos en texto, enlaces y metadatos. Los SHA-256 del PDF y su fuente HTML coinciden con los anteriores a las correcciones.
- `node assets/verify-pages.cjs` con `CV_BROWSER_PATH` apuntando al Brave instalado: aprobado por HTTP en 127.0.0.1 bajo `/portafolio-web-publico/`, con `.git` presente. Ocho recursos responden 200, incluidos los tres SVG con MIME correcto; los cuatro originales retirados responden 404. `.git/HEAD`, `.git/config`, `.git/objects/` y la variante codificada `%2egit/config` responden 404. Descarga nativa del CV completada y bytes idénticos al PDF público.
- Brave en modo headless: sin desbordamiento horizontal en 320, 375, 768, 960, 1024 y 1440 píxeles; cinco marcos uniformes 16:10, ilustraciones cargadas, leyendas sin solapamientos y etiquetas de estado de al menos 14 px sin recortes. Los tres nombres de las ilustraciones se comprobaron en el árbol de accesibilidad del navegador. Menú móvil, teclado, dos visores, Escape, retorno del foco, navegación activa, anclas, recarga y marcadores ante errores aprobados. Capturas de los tres dibujos en escritorio y de las tarjetas en móvil inspeccionadas visualmente.
- Apertura directa con `file://`: en la revisión anterior pasaron diseño, menú, visores y navegación; la prueba completa terminó con error porque no recibió un evento de descarga del CV (0 descargas detectadas). No se repitió en esta edición; la descarga se verifica por HTTP local.

Las dos evidencias PNG, el PDF y la fuente HTML del CV mantienen sus SHA-256 previos a esta edición. Las cinco descripciones se conservaron. Los SVG son figuras geométricas originales, no reproducen interfaces reales ni acreditan funcionalidades terminadas. Las capturas retiradas no se recuperaron.

Límites reales: el zoom nativo y una sesión manual con ventana visible no se comprobaron. La emulación de escala de píxel no equivale a zoom nativo. Las pruebas no ejecutan los proyectos descritos ni certifican sus funciones o permisos de publicación.

Pendientes de autorización y procedencia: ver PREPUBLICACION.md.

## Auditoría del primer commit

Se revisaron los 27 archivos de [PREPARACION-GIT.md](PREPARACION-GIT.md), incluidos documentación, scripts, HTML, CSS, SVG, PNG y PDF. Antes de prepararlos, el inventario coincidía con `git ls-files --others --exclude-standard`. Por autorización posterior se añadieron únicamente esas 27 rutas explícitas al staging. Se comprueban `git diff --cached --name-status`, `git diff --cached --check` y `git status`, sin archivos adicionales. Rama inicial `main`, sin commits ni remotos. El aviso de propiedad de Git quedó resuelto para el usuario titular, únicamente sobre `.git`, sin cambios globales.

Se comprobaron 39 rutas ficticias con `git check-ignore --no-index --stdin -z`: temporales, perfiles y descargas del navegador, cachés, dependencias, compilaciones, configuraciones privadas, credenciales, claves, capturas retiradas y PDF privado. Ningún candidato del inventario está ignorado. No se crearon archivos privados de prueba. Se revisó la ausencia física de material privado y de archivos inesperados en los candidatos; los textos no contienen tokens reconocibles ni rutas personales de Windows. Esta revisión no equivale a una garantía general sobre cualquier archivo que se añada en el futuro.

Las dos evidencias PNG solo contienen chunks de imagen y parámetros gráficos. La portada conserva metadatos de procedencia `caBX` con referencias legibles a ChatGPT/OpenAI; no se observaron rutas personales ni campos GPS. No se validó su cadena criptográfica ni se deduce de ella un modelo exacto o una licencia. Las tres imágenes se revisaron visualmente. No se alteró ningún recurso gráfico ni el CV.

Pasaron las comprobaciones de sintaxis de `assets/js/main.js`, `assets/verify-pages.cjs`, `assets/verify-browser.cjs` y `assets/build-public-cv.cjs`. Este último solo se revisó y comprobó sintácticamente: no se ejecutó su generación de PDF para conservar intacto el CV. Las pruebas de Brave fueron por HTTP local; no se repitió la descarga mediante `file://`, que conserva la limitación descrita anteriormente. Perfiles y capturas temporales de esta ejecución eliminados al finalizar las pruebas.
