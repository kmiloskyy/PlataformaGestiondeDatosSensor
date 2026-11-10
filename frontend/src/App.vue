<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/navbar.vue'
import Footer from './components/footer.vue'
</script>

<template>
  <div class="app-wrapper">
    <Navbar />
    <div class="page-content">
      <RouterView />
    </div>
    <Footer />
  </div>
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
  min-height: 100vh;
}
#app {
  min-height: 100vh;
}
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.page-content {
  flex: 1;
}
</style>
