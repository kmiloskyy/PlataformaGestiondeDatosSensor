# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Desarrollo local

Instala también las dependencias del backend desde `frontend/`:

```sh
npm --prefix ../backend install
```

Con PostgreSQL en marcha, inicia Vite y NestJS en una sola terminal:

```sh
npm run dev
```

Vite muestra la URL de la web en la terminal. Presiona Ctrl+C para detener ambos procesos. Si ya tienes una API en ejecución, usa `npm run dev:frontend`.

### Compile and Minify for Production

```sh
npm run build
```
