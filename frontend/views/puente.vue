<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { detenerSondeo, iniciarSondeo } from '../src/store.js'
import PanelSesion from '../src/components/PanelSesion.vue'
import UltimoPaquete from '../src/components/UltimoPaquete.vue'
import GraficoSesion from '../src/components/GraficoSesion.vue'
import TablaSesiones from '../src/components/TablaSesiones.vue'

const grafico = ref(null)
onMounted(iniciarSondeo)
onBeforeUnmount(detenerSondeo)
</script>

<template>
  <div class="polar-view">
    <h1>Polar Verity Sense → Plataforma de gestión de datos</h1>
    <div class="grid">
      <PanelSesion />
      <UltimoPaquete />
      <GraficoSesion ref="grafico" />
      <TablaSesiones @ver="grafico?.ver($event)" />
    </div>
  </div>
</template>

<style>
/* Estilos del panel del puente, acotados a .polar-view para no afectar al resto de la app */
.polar-view { --bg:#0f172a; --card:#1e293b; --txt:#e2e8f0; --mut:#94a3b8; --ok:#34d399; --err:#f87171; --acc:#38bdf8; --warn:#fbbf24;
  font-family: system-ui, sans-serif; background:var(--bg); color:var(--txt); padding:16px; min-height:100vh; }
.polar-view, .polar-view * { box-sizing: border-box; }
.polar-view h1 { font-size:1.2rem; margin:0 0 12px; }
.polar-view .grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); max-width:1200px; margin:auto; }
.polar-view .card { background:var(--card); border-radius:12px; padding:16px; min-width:0; }
.polar-view .card h2 { margin:0 0 10px; font-size:.95rem; color:var(--mut); font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
.polar-view .derecha { float:right; text-transform:none; letter-spacing:0; }
.polar-view label { display:block; font-size:.85rem; color:var(--mut); margin-bottom:4px; }
.polar-view select { padding:8px; border-radius:8px; border:1px solid #334155; background:#0f172a; color:var(--txt); }
.polar-view .card > select { width:100%; margin-bottom:10px; }
.polar-view button { padding:10px 16px; border:0; border-radius:8px; color:#0f172a; font-weight:700; cursor:pointer; }
.polar-view button.iniciar { background:var(--ok); }
.polar-view button.detener { background:var(--err); }
.polar-view .bpm { font-size:4rem; font-weight:800; line-height:1; color:var(--ok); }
.polar-view .bpm small { font-size:1rem; color:var(--mut); font-weight:400; }
.polar-view .estado { font-size:.9rem; margin:8px 0; }
.polar-view .ok { color:var(--ok); }
.polar-view .err { color:var(--err); }
.polar-view .warn { color:var(--warn); }
.polar-view pre { background:#0f172a; padding:10px; border-radius:8px; font-size:.78rem; overflow:auto; max-height:230px; margin:8px 0 0; white-space:pre-wrap; word-break:break-all; }
.polar-view table { width:100%; border-collapse:collapse; font-size:.82rem; }
.polar-view th, .polar-view td { text-align:left; padding:5px 6px; border-bottom:1px solid #334155; }
.polar-view th { color:var(--mut); font-weight:600; }
.polar-view a { color:var(--acc); }
.polar-view .full { grid-column: 1 / -1; }
.polar-view .checks { display:grid; grid-template-columns: 1fr 1fr; gap:6px 12px; margin-bottom:12px; }
.polar-view .checks label { display:flex; gap:8px; align-items:flex-start; color:var(--txt); margin:0; cursor:pointer; line-height:1.25; }
.polar-view .checks input { margin-top:3px; }
.polar-view .checks small { display:block; color:var(--mut); font-size:.75rem; }
.polar-view .controles { display:flex; gap:14px; flex-wrap:wrap; align-items:center; margin-bottom:10px; font-size:.85rem; color:var(--mut); }
.polar-view .controles input[type=range] { flex:1; min-width:220px; }
.polar-view .en-linea { display:flex; gap:6px; margin:0; align-items:center; }
.polar-view .grafico { height:210px; margin-bottom:6px; }
.polar-view .tabla-scroll { overflow-x:auto; }
</style>
