<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../src/auth.js'

const router = useRouter()
const route = useRoute()
const correo = ref('')
const clave = ref('')
const error = ref('')
const cargando = ref(false)

async function entrar() {
  error.value = ''
  cargando.value = true
  try {
    await login(correo.value, clave.value)
    router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="entrar">
      <h1 class="logo">Polar<span class="punto">Sense</span></h1>
      <p class="sub">Inicia sesión para continuar</p>

      <label for="correo">Correo</label>
      <input id="correo" v-model="correo" type="email" autocomplete="username" placeholder="correo@ejemplo.com" required autofocus />

      <label for="clave">Clave</label>
      <input id="clave" v-model="clave" type="password" autocomplete="current-password" placeholder="••••••••" required />

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <button type="submit" :disabled="cargando">{{ cargando ? 'Ingresando…' : 'Ingresar' }}</button>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
.logo { font-size: 1.8rem; font-weight: 800; color: #1a1a2e; text-align: center; }
.logo .punto { color: #e94560; }
.sub { text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 0.8rem; }
label { font-size: 0.82rem; font-weight: 600; color: #334155; margin-top: 0.4rem; }
input {
  padding: 0.7rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
}
input:focus { outline: 2px solid #e94560; border-color: transparent; }
.error { color: #b91c1c; background: #fee2e2; border-radius: 6px; padding: 0.5rem 0.7rem; font-size: 0.85rem; margin-top: 0.4rem; }
button {
  margin-top: 1rem;
  padding: 0.8rem;
  border: 0;
  border-radius: 8px;
  background: #e94560;
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}
button:disabled { opacity: 0.6; cursor: wait; }
</style>
