# Archivos y módulos relevantes

## Web (Vue/Pinia)

- `src/services/http.ts`, `auth.service.ts`, `backend-alerts.service.ts`, `reading.service.ts`, `institution.service.ts`, `user.service.ts`, `citizen-report.service.ts`.
- `src/stores/auth.store.ts`, `institution.store.ts`, `reading.store.ts`, `user.store.ts`, `citizen-report.store.ts`, `notification.store.ts`.
- `src/views/SuperAdminInstitutionsView.vue`: formulario nuevo y botón Crear institución ahora funcional.
- `src/components/common/LocationPicker.vue`: selector de coordenadas Leaflet con GPS opcional y entrada manual.
- `src/views/SuperAdminUsersView.vue`: CRUD de usuarios con datos y roles adecuados.
- `src/views/SuperAdminAlertsView.vue`, `InstitutionAlertsView.vue`, `InstitutionAlertDetailView.vue`.
- `src/views/SuperAdminDashboardView.vue`, `SuperAdminIncidentsView.vue`, `InstitutionAdminDashboardView.vue`, `InstitutionHistoryView.vue`, `ReadingsView.vue`.
- `src/views/CitizenHomeView.vue`, `CitizenReportsView.vue`, `CitizenReportDetailView.vue`, `CitizenNotificationsView.vue`, `CitizenReportView.vue`.
- `src/views/Central*View.vue`: rutas antiguas sin falsas acciones de despacho; se reutilizan pantallas que leen del backend.
- `src/views/InstitutionReportsView.vue`: se desactiva temporalmente un guardado ficticio no respaldado por el contrato recibido.
- `src/layouts/MonitoringLayout.vue`, `src/components/dashboard/MonitoringMap.vue`, `src/style.css`: menú móvil, accesibilidad, contraste, overflow, seguridad de popups y presentación.

## Móvil (Ionic/Vue)

- `src/services/http.ts`, `auth.service.ts`, `notification.service.ts`, `alert.service.ts`, `citizen-report.service.ts`.
- `src/stores/*` implicados: limpieza de sesión, reportes y alertas.
- `src/views/InstitutionEmergencyDetailView.vue`, `InstitutionHomeView.vue`, `NotificationsView.vue`, `CitizenHomeView.vue`, `CitizenReportView.vue`, `CitizenReportsView.vue`, `CitizenReportDetailView.vue`.
- `src/router/index.ts`, `src/types/contracts.ts`, `src/theme/variables.css`: rutas y estados consistentes, estilos responsive.

## Puesta en marcha

- `vite.config.ts` web/móvil: proxy `/api` y preparación `/socket.io`.
- `.env.example` web/móvil: parámetros documentados sin secretos.
- `INICIAR_WEB.bat`, `INICIAR_MOVIL.bat`, `INICIAR_AMBAS.bat`, `iniciar-web.sh`, `iniciar-movil.sh`.
- `tests/test_integracion.cjs`, `RESULTADOS_VALIDACION.md`, `README_EJECUTAR.md`.

## Aclaración

Se aplicaron las 27 modificaciones de la fase 1 sobre la nueva entrega y se ampliaron con formularios, rutas, vistas, seguridad y estilos. No se agregaron endpoints no documentados ni se afirma que el backend real esté probado.
