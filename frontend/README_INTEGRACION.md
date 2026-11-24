# Integración con Puente Polar

Empareja el Polar Verity Sense en Windows y ejecuta `puente\bin\puente-polar.exe`. El puente usa por defecto el backend en `http://localhost:3000`. En desarrollo, Vite reenvía las peticiones `/api` al backend.

- **Sensores** muestra el dispositivo que informa el puente y la última vinculación de cada sensor registrado. El backend crea el registro del sensor y lo vincula al sujeto de la sesión cuando guarda el primer paquete.
- **Grabación en vivo** inicia y detiene la sesión mediante `/api/medicion`. Permite seleccionar un sujeto registrado y las señales. El puente consulta esa ruta y envía lecturas a `/api/telemetria`.
- **Sesiones y reportes** consulta los datos guardados, grafica un intervalo de la sesión y descarga las muestras en CSV o JSON.
- **Puente Polar** muestra el estado de la comunicación con el puente y los errores de activación de señales.

El puente actual selecciona un sensor emparejado en Windows y el backend mantiene una grabación activa a la vez. Los binarios compilados antes de este cambio siguen enviando lecturas. Para ver la MAC del sensor desde que el puente lo informa, recompila el ejecutable con las instrucciones de `puente/README.md`.
