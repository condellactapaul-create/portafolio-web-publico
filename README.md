# Portafolio académico — Paul Pascual Conde Llacta

> Proyecto independiente con Git local en la rama `main`, todavía sin commits, remotos ni publicación.

Estudiante de **Ingeniería de Software con Inteligencia Artificial en SENATI**, quinto semestre.

Este portafolio reúne mi presentación profesional, experiencia práctica, proyectos y evidencias de aprendizaje para una actividad académica de SENATI. Su objetivo es mostrar mis competencias en desarrollo de software, soporte informático y telecomunicaciones, distinguiendo las contribuciones personales, el trabajo colaborativo y los desarrollos aún en evolución.

## Tecnologías del portafolio

- **HTML5:** estructura semántica y organización del contenido.
- **CSS3:** diseño responsive en azul noche, con acentos cian y violeta.
- **JavaScript nativo:** menú accesible, indicador de sección activa y visor ampliado de evidencias.

El sitio no requiere frameworks, instalación de dependencias ni compilación. Las tecnologías de los proyectos documentados se describen por separado y no son dependencias de esta página.

## Proyectos documentados

| Proyecto | Participación y alcance |
| --- | --- |
| **PCONDELL** | Desarrollo personal de un asistente de voz con Python, Vosk, activación por palabra clave, ejecución de comandos y síntesis de voz. En desarrollo. |
| **Sistema de Preguntas y Respuestas** | Desarrollo de una aplicación con React, Vite, Node.js, Express y API REST para responder preguntas, validar respuestas y calcular puntajes. |
| **Fiberplus TV** | Participación colaborativa en desarrollo, pruebas y mejoras de una aplicación IPTV para televisores LG con webOS. No se atribuye autoría exclusiva del código. |
| **Gestión de Infraestructura de Fibra Óptica** | Desarrollo de una aplicación con React, Vite, Node.js y Express para cajas NAP, mufas, cables, clientes y recorridos, con mapas Leaflet y OpenStreetMap. La interfaz funciona en modo demostración con datos ficticios; la integración completa con backend y MySQL requiere configuración y validación. |

El portafolio también documenta una maqueta en Figma de un gestor de desarrollo para televisores LG, identificada como propuesta de interfaces.

## Cinco evidencias académicas

Se conservan cinco tarjetas con sus descripciones:

1. **Preguntas y Respuestas:** captura visible y ampliable.
2. **PCONDELL:** recorte público visible y ampliable, sin ruta local de Windows.
3. **Fiberplus TV:** ilustración SVG propia de un televisor con canales ficticios.
4. **Aurora Inés Tejada / SIAGIE:** ilustración SVG propia de gestión educativa genérica, sin datos de estudiantes.
5. **Infraestructura de fibra óptica:** diagrama SVG propio de cajas NAP y conexiones, sin ubicaciones reales.

Las tres ilustraciones son representaciones conceptuales, no capturas ni demostraciones funcionales. Incluyen texto alternativo y leyenda visible, sin logos de terceros; no tienen controles de ampliación. Las etiquetas de estado usan texto de 14 px y espacio interior para facilitar su lectura.

Los originales reservados no forman parte de la carpeta pública, tampoco como archivos sin enlazar.

Estas evidencias documentan actividades y avances; no se presentan como certificados ni acreditan funciones empresariales completamente terminadas.

## CV público

El botón Descargar CV enlaza al [CV ATS público](assets/docs/CV_Paul_Pascual_Conde_Llacta_Publico.pdf): una página con texto seleccionable y formato de una columna. Conserva formación, experiencia, habilidades y proyectos de la referencia privada. Incluye solo el nombre, correo, GitHub y ubicación autorizados; no contiene celular, DNI ni dirección domiciliaria. El PDF privado no se copió ni modificó.

## Abrir el portafolio localmente

1. Descarga o clona el repositorio con los permisos correspondientes.
2. Conserva la estructura de carpetas.
3. Abre [index.html](index.html) en un navegador, como Brave, Edge o Chrome.

No se necesita servidor para consultar el portafolio. Las imágenes y el PDF utilizan rutas relativas. Activa JavaScript para utilizar el menú desplegable y el visor de evidencias. El visor permite cerrar con Escape y devuelve el foco a la tarjeta.

La imagen `perfil-tecnologico.png` fue generada mediante la herramienta de creación de imágenes de ChatGPT (OpenAI), según confirmación del usuario el 4 de noviembre de 2026. El modelo exacto es desconocido. Es una ilustración, no una fotografía personal. No se han verificado ni se inventan condiciones de uso, licencias o garantías sobre derechos de terceros.

## Verificaciones locales

Con Node.js instalado, desde la raíz:

```sh
node assets/verify-local.cjs
node --check assets/js/main.js
```

Para una comprobación real con un navegador instalado, consulta [la guía de edición y pruebas](assets/LEEME.md). Las pruebas del portafolio no ejecutan ni certifican el código de los otros proyectos documentados.

Consulta los resultados y límites de Brave en [VERIFICACION.md](VERIFICACION.md), incluida la descarga aprobada por HTTP local y la descarga no confirmada al abrir directamente con `file://`.

## Procedencia y uso de recursos

Consulta [PROCEDENCIA.md](PROCEDENCIA.md) para conocer los antecedentes del material de partida, las atribuciones y las observaciones sobre capturas, marcas de terceros e ilustraciones generadas con IA.

No se ha asignado una licencia nueva ni se presume autorización para redistribuir recursos de terceros. Los permisos de publicación indicados en ese documento siguen pendientes de confirmación.

**GitHub del titular:** [condellactapaul-create](https://github.com/condellactapaul-create).

## Preparación de GitHub Pages

Las rutas relativas se prueban bajo /portafolio-web-publico/ con node assets/verify-pages.cjs. No hay enlaces activos a unidades Windows. Consulta [PREPUBLICACION.md](PREPUBLICACION.md) para los pendientes. .nojekyll prepara contenido estático sin activar publicación.

El inventario revisado del primer commit y las exclusiones están en [PREPARACION-GIT.md](PREPARACION-GIT.md). Inicializar Git no autoriza publicar ni resuelve los permisos pendientes.
