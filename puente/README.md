# Puente Bluetooth → API

Programa de consola (.NET, solo Windows) que lee el Polar Verity Sense **ya emparejado en Windows** y envía los datos **en bruto** a la API de `backend/`.
No promedia, no estima y no corrige nada: eso se hace en el backend. Explicación completa en [`../docs/DOCUMENTACION_SISTEMA.md`](../docs/DOCUMENTACION_SISTEMA.md).

```
dotnet build -c Release -o bin
.\bin\puente-polar.exe [url] [nombre]      # por defecto http://localhost:3000 y "Polar"
```

El puente no mide nada hasta que se inicia una sesión desde la web; entonces activa en el sensor solo los datos elegidos.
Si Windows todavía tiene tomado el sensor, el puente reintenta hasta 60 s antes de rendirse.
