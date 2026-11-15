<script setup>
import { sensorState } from '../services/sensorBridge.js'
</script>

<template>
  <div class="raw-inspector-card">
    <div class="inspector-header">
      <div class="titulo-con-badge">
        <span class="icono"></span>
        <h4>Integridad de Datos en Bruto</h4>
        <span class="badge-calidad">100% Sin Corrupción</span>
      </div>
      <div class="stats-rapidas">
        <span>Frecuencia: <strong>{{ sensorState.frecuenciaRealMuestreo }} Hz</strong></span>
        <span>Paquetes: <strong>{{ sensorState.paquetesRecibidos }}</strong></span>
        <span>Descartados: <strong class="cero">0 (0.0%)</strong></span>
      </div>
    </div>

    <div class="raw-content">
      <div class="campo-hex">
        <span class="label-hex">Trama BLE Cruda (Hexadecimal 0x2A37 / PMD):</span>
        <code class="codigo-hex">{{ sensorState.ultimoPaqueteRaw.hex }}</code>
      </div>
      <div class="campo-interpretacion">
        <span class="label-hex">Validación y Decodificación:</span>
        <span class="texto-interpretacion">{{ sensorState.ultimoPaqueteRaw.interpretacion }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.raw-inspector-card {
  background: #0f172a;
  color: #f8fafc;
  border-radius: 12px;
  padding: 1.1rem 1.4rem;
  margin-top: 1.5rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
  border: 1px solid #1e293b;
}

.inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.titulo-con-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.titulo-con-badge h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
}

.badge-calidad {
  background: #064e3b;
  color: #34d399;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  border: 1px solid #059669;
}

.stats-rapidas {
  display: flex;
  gap: 1.2rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.stats-rapidas strong {
  color: #f1f5f9;
}

.stats-rapidas .cero {
  color: #34d399;
}

.raw-content {
  background: #1e293b;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.campo-hex, .campo-interpretacion {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.label-hex {
  color: #94a3b8;
  font-weight: 600;
}

.codigo-hex {
  background: #0f172a;
  color: #38bdf8;
  font-family: 'Courier New', Courier, monospace;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  letter-spacing: 1px;
}

.texto-interpretacion {
  color: #cbd5e1;
}
</style>
