# Sistema Inteligente de Detección y Prevención de Incendios

## Descripción

Frontend prototipo para un sistema universitario de ingeniería de software orientado a la vigilancia, análisis y prevención de incendios. La interfaz está diseñada para simular un centro de monitoreo operativo con sensores, lecturas, alertas y motor de detección.

## Tecnologías

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Tailwind CSS
- Chart.js
- Leaflet
- Lucide Vue

## Objetivo

Presentar una maqueta funcional del sistema para el docente, demostrando cómo se visualizarían lecturas, riesgos, alertas y la lógica del motor de detección en un entorno profesional.

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm run dev
```

## Estructura principal

```text
src/
├── assets/
├── components/
├── composables/
├── layouts/
├── mocks/
├── router/
├── services/
├── stores/
├── types/
├── views/
├── App.vue
├── main.ts
└── style.css
```

## Arquitectura

La aplicación separa claramente:

- UI: vistas y componentes reutilizables
- Estado global: stores de Pinia
- Datos: mocks centralizados y coherentes
- Servicios: capa de abstracción para integración futura con backend
- Lógica: análisis simulado y composable de tiempo real

## Datos mock

Los datos de sensores, lecturas, alertas, ubicaciones y detección se encuentran en `src/mocks` y están diseñados para ser consistentes entre sí. Esto permite reemplazarlos por llamadas HTTP reales sin rehacer la interfaz.

## Modo demostración

El prototipo incluye una lógica simulada orientada a escenarios para visualizar el comportamiento del sistema bajo condiciones normales, temperatura elevada, humo detectado y riesgo crítico.

## Integración futura

La estructura está preparada para conectar servicios REST y WebSockets con mínimo cambio en la capa de UI. La capa de servicios actúa como adaptador para sustituir los mocks por llamadas reales en el futuro.
