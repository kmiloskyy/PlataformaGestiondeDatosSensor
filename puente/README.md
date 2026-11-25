# Puente Bluetooth → API

Programa de consola (.NET, solo Windows) que lee los Polar Verity Sense **ya emparejados en Windows** y envía los datos **en bruto** a la API de `backend/`.
No promedia, no estima y no corrige nada: eso se hace en el backend. Explicación completa en [`../docs/DOCUMENTACION_SISTEMA.md`](../docs/DOCUMENTACION_SISTEMA.md).

```
dotnet build -c Release -o bin
.\bin\puente-polar.exe [url] [nombre]      # por defecto http://localhost:3000 y "Polar"
```

Al arrancar, una instancia abre una conexión por cada dispositivo emparejado cuyo nombre contiene el filtro indicado. El filtro por defecto es `Polar`. Reinicia el puente después de emparejar sensores adicionales.

En la web, asigna cada sensor a un sujeto de estudio y, si corresponde, indica su ubicación en **Sensores**. Selecciona los equipos y las señales en **Grabación en vivo**. Cada Polar recibe la sesión de su MAC y el puente reintenta la conexión de forma independiente si un dispositivo se desconecta.

Si Windows bloquea el acceso a las señales avanzadas (PMD), el puente conserva la frecuencia cardíaca y reintenta abrir ese servicio. Los avisos se muestran por sensor en **Puente Polar** y **Grabación en vivo**.
