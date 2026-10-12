# ALERTA Móvil

Aplicación móvil Ionic/Vue para los roles Usuario de Institución y Ciudadano.

## Desarrollo y build

```bash
npm install
npm run dev
npm run build
```

## Contratos de datos

Los contratos esperados para la futura API están en `src/types/contracts.ts`. Son equivalentes a los del frontend web (`../src/types/contracts.ts`) pero se mantienen duplicados para no crear una dependencia entre proyectos.

Actualmente la app móvil no tiene carpetas propias de mocks, services o stores; las vistas no consumen todavía estos DTO mediante una capa de datos. No se han agregado endpoints ni llamadas de red. Los ejemplos, enums, fechas ISO, relaciones y diferencias legacy están documentados en [`../docs/frontend-data-contracts.md`](../docs/frontend-data-contracts.md).

Flujo futuro esperado:

```text
Vue View -> Pinia Store -> Service -> API Backend
```
