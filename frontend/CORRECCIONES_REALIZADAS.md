# Correcciones realizadas — ALERTA

Esta versión fue refactorizada a partir del proyecto recibido.

## Cambios principales

1. **Mapa recuperado como elemento principal** del Dashboard del Operador Central.
   - Sensores.
   - Incidentes/puntos de peligro.
   - Reportes ciudadanos.
   - Instituciones.
   - Filtros por capa.

2. **Se eliminaron rutas repetitivas** que mostraban la misma vista con nombres diferentes.
   - Despacho se integró como acción dentro de Alertas.
   - Incidentes tiene vista propia.
   - Historial tiene vista propia.
   - Instituciones tiene vista propia.

3. **Operador Central reorganizado** con flujo claro:
   - Dashboard → Alertas → Incidentes → Instituciones → Historial.

4. **Admin Institución separado del Operador Central**.
   - Ya no utiliza la pantalla de despacho central.
   - Ve únicamente alertas dirigidas a su institución.
   - Conserva vistas técnicas y añade gestión de personal e informes.

5. **Usuario Institución simplificado**.
   - Inicio.
   - Emergencias.
   - Historial.
   - Diseño más orientado a uso móvil/operativo.

6. **Ciudadano corregido**.
   - Inicio propio.
   - Mis reportes y Notificaciones ya no reutilizan la misma pantalla.
   - Instrucciones ya no está vacía.

7. **Estados por institución separados del estado general**.
   - `Dispatch.status` gestiona la respuesta de cada institución.
   - `Incident.status` representa el estado general.

8. **Timeline real agregado**.
   - Guarda eventos con fecha/hora, actor y detalle.

9. **Bitácora/auditoría integrada**.
   - Validación.
   - Despacho.
   - Actualizaciones operativas.
   - Creación de informes.

10. **Informes de Atención mejorados**.
    - Lista de informes existentes.
    - Formulario separado.
    - Tiempos.
    - Personal y vehículos.
    - Afectados, evacuados, heridos y fallecidos.
    - Daños, causa, acciones, observaciones y recomendaciones.
    - PDF como respaldo.

11. **Login demo mejorado**.
    - Cuatro cuentas de rol.
    - Redirección correcta según rol.
    - Guards de rutas.

12. **Diseño visual conservado**.
    - Paleta clara de ALERTA.
    - Naranja, beige, verde salvia, amarillo y rojo crítico.

13. **Limpieza de código**.
    - Eliminación de componentes starter no usados.
    - Eliminación de `RoleDashboardView` repetitivo.
    - Corrección de actualización de stores para evitar duplicados al crear elementos demo.

## Validación

Se ejecutó el chequeo de tipos con `vue-tsc` sobre la versión corregida sin errores.

Para el usuario final se recomienda ejecutar en Windows:

```bash
npm install
npm run dev
```

El archivo comprimido no incluye `node_modules` ni `dist` para evitar peso innecesario y problemas entre sistemas operativos.
