# ALERTA Móvil

Aplicación móvil de demostración para prevención y atención de incendios, construida con Ionic Vue y Capacitor. Es un proyecto independiente del frontend web de ALERTA.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm
- Para Android: Android Studio y Android SDK

## Ejecutar en navegador

```bash
npm install
npx --yes @ionic/cli serve
```

También puede iniciarse con `npm run dev`.

## Verificar y compilar

```bash
npm run lint
npm run build
```

## Android

La configuración de Capacitor usa `dist` como salida web. Después de compilar:

```bash
npx cap add android
npx cap sync android
npx cap open android
```

`npx cap add android` se ejecuta una sola vez. Para actualizar los recursos web nativos en adelante, ejecuta `npm run build` y `npx cap sync android`.

## Flujos disponibles

- **Usuario de institución:** panel de emergencias, alertas, detalle con actualización de estado e historial.
- **Ciudadano:** inicio, envío de reporte con fotografía, seguimiento de reportes, notificaciones e instrucciones.

Los datos y servicios actuales son demostrativos y se mantienen localmente en mocks. No se conecta a un backend; Cámara y Geolocalización de Capacitor están instaladas para una futura integración nativa.
