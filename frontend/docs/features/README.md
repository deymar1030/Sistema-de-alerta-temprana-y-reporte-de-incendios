# Features backend nuevas/cambiadas (27-oct-2026)

Un archivo por feature: qué endpoint(s) consumir, qué mandar, qué esperar de vuelta, y
una sugerencia de vista. Contrato real del backend en esta rama; no son los tipos demo
de `src/types/index.ts` ni los contratos normalizados de `../frontend-data-contracts.md`.

- [Disponibilidad de institución](./disponibilidad-institucion.md) — `PATCH /instituciones/:id/disponibilidad`.
- [Asignación de operativos a una alerta](./asignacion-operativos.md) — `GET /usuarios/operativos`, `POST /notificaciones/asignaciones`.
- [Cierre de alerta por informe de atención](./cierre-alerta-informe-atencion.md) — `POST`/`PUT /informes-atencion` (restringido a instituciones BOMBEROS).
- [Corroboración de reportes ciudadanos](./corroboracion-reportes-ciudadanos.md) — sin endpoint nuevo, cambia el comportamiento de `POST /reportes-usuario`.
- [Auditoría (solo lectura, rol AUDITOR)](./auditoria.md) — `GET /auditoria`, `GET /auditoria/usuarios`.

Más contexto y estado de despliegue (qué se aplicó a qué base de datos) en
`../../../docs/IntegracionOperativa.md`.
