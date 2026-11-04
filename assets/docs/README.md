# CV ATS público

Archivo: CV_Paul_Pascual_Conde_Llacta_Publico.pdf. Una página, una columna, texto seleccionable y títulos claros. Correo, GitHub, nombre y ubicación autorizados; sin celular, DNI ni dirección domiciliaria. El original privado no se modificó ni se copió a esta carpeta.

La fuente independiente está en CV_Paul_Pascual_Conde_Llacta_Publico.html. Para generar el PDF con un navegador instalado: node assets/build-public-cv.cjs desde la raíz (CV_BROWSER_PATH permite seleccionar Brave). No se instalan dependencias ni se cargan recursos externos.

Verificación independiente: python -B assets/verify-public-cv.py. Inspecciona texto Unicode, enlaces, anotaciones, metadatos y streams. La opción --reference permite comparar, en modo de solo lectura, con el original privado sin copiar ni imprimir su teléfono. No se conserva ese número en las pruebas. Las comprobaciones realizadas no garantizan compatibilidad con todos los sistemas ATS existentes.

Descargar CV en index.html apunta al PDF público mediante ruta relativa y atributo download. No publicar hasta resolver los demás pendientes de PREPUBLICACION.md.
