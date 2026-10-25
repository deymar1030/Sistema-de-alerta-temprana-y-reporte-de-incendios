# Verificaciones de esta entrega

## Comprobaciones ejecutadas

1. `node node_modules/vue-tsc/bin/vue-tsc.js -b` desde el proyecto web: **exit 0**, sin diagnósticos.
2. `cd ALERTA_Movil && node node_modules/vue-tsc/bin/vue-tsc.js --noEmit`: **exit 0**, sin diagnósticos.
3. `node tests/test_integracion.cjs`: **19/19 pruebas aprobadas**. Incluyen GET/POST/PUT de instituciones con API simulada y errores, alertas, lecturas, contrato de cookies y manejo de respuestas, prevención de IDs falsos y comprobaciones estáticas de interfaces.
4. El test anterior analizó **65 componentes `.vue`** sin errores de estructura del archivo mediante `@vue/compiler-sfc`.
5. CSS corregido para no sobreescribir estilos de botones blancos ni fondos de modales. Mapa móvil solo crea marcadores con geolocalización real, y su popup utiliza `textContent` en lugar de concatenar HTML.

## Bloqueos comprobados

- `npm run build` no puede ejecutarse aquí sobre los `node_modules` del ZIP porque sus ejecutables y binarios se instalaron para Windows. En Linux aparece «Permission denied» al invocar los wrappers binarios. La validación TypeScript se ejecutó directamente con `node .../vue-tsc.js`.
- Tras ejecutar TypeScript mediante `node`, Vite/Rolldown falla por ausencia del binding nativo **`@rolldown/binding-linux-x64-gnu`**; el ZIP solo incluía **`@rolldown/binding-win32-x64-msvc`**. Se intentó reinstalar dependencias pero el entorno no puede acceder al registro npm. Por esa razón **no se afirma que el build de producción esté aprobado**.
- El dominio del VPS compartido no respondió/resolvió desde este entorno. **No hubo pruebas con servidor real ni validación de cookies de sesión**.
- No fue posible levantar Vite y comprobar visualmente con Chromium los tamaños de pantalla en este entorno; las mejoras de responsive se revisaron en el código pero requieren las pruebas manuales enumeradas en `README_EJECUTAR.md`.
- El servidor backend, Socket.IO real, subida de fotografías y distribución individual de personal no forman parte del código de este ZIP.

## Alcance

Todas las pruebas son locales, de código o API simulada. Si `npm install` funciona en el dispositivo receptor, ejecutar **`npm run build` en ambos proyectos** y completar pruebas de aceptación con el backend. El programa no ofrece garantías de seguridad o fiabilidad operativa para emergencias reales sin esa etapa.
