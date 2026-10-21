# Assets del Frontend (AllPets)

Coloca aquí las imágenes estáticas, logotipos, iconos o archivos locales del proyecto (por ejemplo, `logo.png`, `logo.svg`, fotos de fondo, etc.).

## ¿Cómo importar los assets en los componentes de Vue?

Puedes importar imágenes directamente en tus scripts o en el template utilizando la ruta relativa o el alias `@`:

### En el `<script setup>`:
```ts
import logoAllPets from '../assets/logo.png'
// o con alias (si está configurado):
// import logoAllPets from '@/assets/logo.png'
```

### En el `<template>`:
```html
<img :src="logoAllPets" alt="Logo AllPets" class="w-10 h-10" />
```

> **Tip**: Si colocas archivos directamente en la carpeta `/public` (fuera de `/src`), puedes acceder a ellos en el navegador usando la raíz `/`, por ejemplo `<img src="/logo.png" />`.
