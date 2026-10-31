TRAINRADAR ESPAÑA — versión conectada a datos reales

ARCHIVOS
- index.html: estructura de la web
- style.css: diseño adaptable a ordenador y móvil
- app.js: mapa, lista, filtros y conexión de datos

CÓMO ABRIR
1. Descomprime TrainRadar_Espana.zip.
2. Abre index.html con conexión a Internet.
3. Para publicar la web, sube los tres archivos a un alojamiento estático (por ejemplo GitHub Pages, Netlify o Cloudflare Pages).

DATOS EN DIRECTO
La web consulta https://radardetrenes.com/api/v1/fleet?type=all y su flujo SSE /fleet/stream?type=all.
La API documenta posiciones GPS de trenes de fuentes públicas Renfe/ADIF, con actualizaciones aproximadas de 20 segundos. Se muestra la información que devuelve el proveedor; no se inventan posiciones.

LIMITACIONES IMPORTANTES
No representa literalmente todos los trenes de todos los operadores de España. La cobertura depende de los feeds públicos disponibles. No se debe interpretar la ausencia de un tren como cancelación. Ouigo, Iryo, mercancías y ciertos servicios pueden no estar incluidos o tener datos incompletos. La posición, retraso y próxima parada pueden sufrir desfases.
No es una web oficial de Renfe ni de ADIF.

ATRIBUCIÓN
Datos: Renfe / ADIF a través de RadarDeTrenes (https://radardetrenes.com).
Mapa: © OpenStreetMap.
Consulta las condiciones y atribución indicadas por el proveedor antes de redistribuir o explotar comercialmente los datos.
