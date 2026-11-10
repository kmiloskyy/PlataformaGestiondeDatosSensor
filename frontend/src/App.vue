<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/navbar.vue'
</script>

<template>
  <Navbar />
  <RouterView />
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: #f4f6fb;
  color: #111;
}
</style>
