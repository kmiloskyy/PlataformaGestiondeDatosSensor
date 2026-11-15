<script setup>
import { ref } from 'vue'
import { sensorState } from '../src/services/sensorBridge.js'

const nuevoSensorModal = ref(false)
const sensorForm = ref({
  nombre: '',
  mac: '',
  sujeto: '',
  dispositivoMovil: 'Smartphone Android (Bluetooth 5.0)'
})

function vincularDispositivo() {
  if (!sensorForm.value.nombre || !sensorForm.value.mac) return
  sensorState.sensores.push({
    id: sensorState.sensores.length + 1,
    nombre: sensorForm.value.nombre,
    mac: sensorForm.value.mac,
    sujeto: sensorForm.value.sujeto || 'Sin asignar',
    bateria: 100,
    conectado: true,
    fc: 80,
    rr: 750,
    acel: { x: 0, y: 0, z: 980 }
  })
  nuevoSensorModal.value = false
  sensorForm.value = { nombre: '', mac: '', sujeto: '', dispositivoMovil: '' }
}
</script>

<template>
  <main class="dispositivos-view">
    <div class="header">
      <div>
        <h1>Gestión de Sensores y Dispositivos</h1>
        <p class="subtitulo">
          Vincula sensores Polar Verity Sense por dirección MAC e identifícalos con el smartphone o tablet del alumno.
        </p>
      </div>
      <button class="btn-nuevo" @click="nuevoSensorModal = true">
         Vincular Nuevo Sensor
      </button>
    </div>

    <div class="tabla-card">
      <table class="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Sensor Polar</th>
            <th>Dirección MAC / UUID </th>
            <th>Sujeto / Alumno Asignado</th>
            <th>Dispositivo Vinculado</th>
            <th>Batería</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sensorState.sensores" :key="s.id">
            <td><strong>#{{ s.id }}</strong></td>
            <td><strong>{{ s.nombre }}</strong></td>
            <td><code class="mac">{{ s.mac }}</code></td>
            <td>{{ s.sujeto }}</td>
            <td> Smartphone Alumno (BLE)</td>
            <td> {{ s.bateria }}%</td>
            <td><span class="badge-on">● Conectado</span></td>
            <td>
              <button class="btn-sm" @click="sensorState.sensorSeleccionadoId = s.id">Probar Señal</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal para vincular nuevo sensor -->
    <div v-if="nuevoSensorModal" class="modal-bg" @click.self="nuevoSensorModal = false">
      <div class="modal">
        <h3>Vincular Sensor Polar Verity Sense</h3>
        <p class="modal-desc">Ingresa los datos del sensor y el alumno asignado.</p>

        <label>Nombre del Dispositivo
          <input type="text" placeholder="Ej: Polar Sense 13" v-model="sensorForm.nombre" />
        </label>

        <label>Dirección MAC / Bluetooth ID
          <input type="text" placeholder="Ej: A0:9E:1A:45:B1:13" v-model="sensorForm.mac" />
        </label>

        <label>Sujeto de Estudio / Alumno
          <input type="text" placeholder="Ej: Camila Rivera" v-model="sensorForm.sujeto" />
        </label>

        <label>Dispositivo Telefónico Vinculado
          <select v-model="sensorForm.dispositivoMovil">
            <option>Smartphone Alumno (Bluetooth LE)</option>
            <option>Tablet del Profesor (Receptor USB)</option>
            <option>PC Laboratorio / Computador Central</option>
          </select>
        </label>

        <div class="modal-btns">
          <button class="btn-cancelar" @click="nuevoSensorModal = false">Cancelar</button>
          <button class="btn-guardar" @click="vincularDispositivo">Guardar y Vincular</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dispositivos-view {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.3rem;
}

.subtitulo {
  color: #64748b;
  font-size: 0.95rem;
}

.btn-nuevo {
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 0.75rem 1.4rem;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-nuevo:hover { background: #e94560; }

.tabla-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.tabla th, .tabla td {
  padding: 0.85rem 1.1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.tabla th {
  background: #f8fafc;
  color: #475569;
  font-weight: 700;
}

.mac {
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  color: #0369a1;
}

.badge-on {
  color: #166534;
  font-weight: 600;
  font-size: 0.8rem;
}

.btn-sm {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-sm:hover { background: #e2e8f0; }

.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal h3 { margin: 0; color: #0f172a; }
.modal-desc { margin: -0.5rem 0 0.5rem; color: #64748b; font-size: 0.88rem; }

label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

input, select {
  padding: 0.6rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1rem;
}

.btn-cancelar {
  background: #f1f5f9;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-guardar {
  background: #e94560;
  color: #fff;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}
</style>
