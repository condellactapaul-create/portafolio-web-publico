# Preparación local de portafolio-web-publico

Abre index.html. Esta copia conserva tres PNG, tres SVG propios, cinco tarjetas de evidencia, dos capturas con modal y tres ilustraciones conceptuales, menú responsive y navegación activa. Tiene Git local en `main`, sin commits ni remotos, y no contiene el PDF privado. Incluye el PDF público independiente con los datos autorizados, sin celular.

## Pruebas

- node assets/verify-local.cjs: estructura, recursos y enlace activo al CV público.
- node --check assets/js/main.js: sintaxis.
- node assets/verify-browser.cjs: navegador instalado con file://.
- node assets/verify-pages.cjs: servidor efímero en 127.0.0.1 bajo /portafolio-web-publico/, recursos y pruebas reales del navegador. Admite `.git` y verifica que sus metadatos respondan 404. No publica ni modifica GitHub.

Selecciona Brave mediante CV_BROWSER_PATH. No se instalan dependencias. El perfil temporal se crea y elimina dentro de esta carpeta; CV_KEEP_PREVIEW=1 conserva capturas para inspección.

## Pendientes

Resultados actuales y límites: [VERIFICACION.md](../VERIFICACION.md). La prueba completa por HTTP local pasó en Brave. La apertura directa `file://` no produjo el evento esperado de descarga del CV en la prueba automatizada; usar la comprobación HTTP para validar esa descarga. Zoom nativo y ventana visible siguen sin revisión manual.

El CV público ya está preparado. Revisar PROCEDENCIA.md y PREPUBLICACION.md, confirmar los permisos pendientes de otros recursos y autorizar publicación. Mantener las atribuciones de mapas y el carácter colaborativo de Fiberplus TV. El sitio aún no tiene URL GitHub Pages.

## PDF público

python -B assets/verify-public-cv.py verifica una página textual, contactos autorizados y ausencia de celular. node assets/build-public-cv.cjs regenera desde su fuente HTML independiente con un navegador instalado; verificar nuevamente después de cualquier edición. La prueba de navegador completa una descarga nativa y compara los bytes con el archivo público.
