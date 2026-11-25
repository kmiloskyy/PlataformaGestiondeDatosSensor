# Integración con Puente Polar

Empareja los Polar Verity Sense en Windows y ejecuta una instancia de `puente\bin\puente-polar.exe`. El puente usa por defecto el backend en `http://localhost:3000`. En desarrollo, Vite reenvía las peticiones `/api` al backend.

- **Sensores** permite asignar a cada MAC un sujeto y una ubicación opcional. Puedes asignar más de un Polar al mismo sujeto, por ejemplo uno al brazo izquierdo y otro a la pierna derecha. Las asignaciones previas se recuerdan en el navegador.
- **Grabación en vivo** permite seleccionar los Polar asignados y las señales comunes. El backend inicia una sesión por sensor como parte de la misma operación. El puente consulta la sesión que corresponde a cada MAC y envía sus lecturas a `/api/telemetria`.
- **Sesiones y reportes** muestra el sujeto, el Polar y la ubicación guardados al iniciar. Puedes consultar y exportar en CSV o JSON las muestras de cada sesión.
- **Puente Polar** muestra las conexiones y los errores de activación de cada dispositivo.

Recompila el ejecutable según `puente/README.md` para usar la grabación simultánea.
