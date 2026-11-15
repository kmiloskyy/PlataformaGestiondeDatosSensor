<script setup>
import { sensorState } from '../services/sensorBridge.js'

defineEmits(['seleccionar-sensor'])

function getColorPorBPM(bpm) {
  if (bpm < 85) return '#10b981' // Reposo / Suave (verde)
  if (bpm < 120) return '#3b82f6' // Aeróbico moderado (azul)
  if (bpm < 145) return '#f59e0b' // Umbral anaeróbico (amarillo)
  return '#ef4444' // Zona máxima (rojo)
}
</script>

<template>
  <div class="multidevice-section">
    <div class="section-top">
      <div>
        <h3>Matriz de Clase en Vivo</h3>
        <p class="desc">
          Monitoreo simultáneo de múltiples dispositivos. Haz clic en una tarjeta para ver sus señales en detalle.
        </p>
      </div>
      <div class="badge-conectados">
        <span class="punto-verde"></span>
        {{ sensorState.sensores.filter(s => s.conectado).length }} / 12 Dispositivos Sincronizados
      </div>
    </div>

    <div class="grid-dispositivos">
      <div
        v-for="s in sensorState.sensores"
        :key="s.id"
        class="card-sensor"
        :class="{
          'seleccionado': sensorState.sensorSeleccionadoId === s.id,
          'grabando': sensorState.grabando
        }"
        @click="$emit('seleccionar-sensor', s.id)"
      >
        <div class="card-header">
          <div class="sensor-info">
            <span class="sensor-id">#{{ s.id.toString().padStart(2, '0') }}</span>
            <span class="sensor-mac">{{ s.mac }}</span>
          </div>
          <div class="bateria" :title="'Batería: ' + s.bateria + '%'">
             {{ s.bateria }}%
          </div>
        </div>

        <div class="sujeto-nombre">{{ s.sujeto }}</div>

        <div class="metricas-live">
          <div class="bpm-valor" :style="{ color: getColorPorBPM(s.fc) }">
            {{ s.fc }}
            <span class="unidad">BPM</span>
          </div>
          <div class="rr-valor">
            <span>RR: {{ s.rr }} ms</span>
            <span class="movimiento">Acel: {{ Math.abs(s.acel.x) + Math.abs(s.acel.y) }} mG</span>
          </div>
        </div>

        <div class="card-footer">
          <span class="status-pill conectado">
            ● Transmitiendo
          </span>
          <span class="btn-focus">
            {{ sensorState.sensorSeleccionadoId === s.id ? '★ Enfocado' : 'Ver detalle' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.multidevice-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.section-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.section-top h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #1e293b;
  font-weight: 700;
}

.desc {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.badge-conectados {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ecfdf5;
  color: #065f46;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  border: 1px solid #a7f3d0;
}

.punto-verde {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 6px #10b981;
}

.grid-dispositivos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1rem;
}

.card-sensor {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-sensor:hover {
  transform: translateY(-2px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.card-sensor.seleccionado {
  border-color: #e94560;
  background: #fff8f8;
  box-shadow: 0 0 0 1px #e94560;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.sensor-id {
  font-weight: 800;
  color: #1e293b;
  margin-right: 0.3rem;
}

.sensor-mac {
  color: #64748b;
  font-family: monospace;
}

.bateria {
  font-size: 0.75rem;
  color: #475569;
}

.sujeto-nombre {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metricas-live {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  background: #ffffff;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

.bpm-valor {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.bpm-valor .unidad {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
}

.rr-valor {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: #64748b;
  text-align: right;
}

.movimiento {
  font-size: 0.7rem;
  color: #94a3b8;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.4rem;
}

.status-pill {
  font-weight: 600;
  color: #166534;
}

.btn-focus {
  color: #e94560;
  font-weight: 700;
}
</style>
