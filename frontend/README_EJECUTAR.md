# ALERTA - Proyecto integrado (web y móvil)

Esta entrega incluye las fuentes web Vue, la aplicación Ionic/Vue, dependencias declaradas y archivos de arranque. **No** incluye `node_modules` ni claves privadas: se descargan las dependencias al instalar. Requiere acceso a internet, Node.js compatible y acceso autorizado al VPS. El backend y la base de datos **no** forman parte de este ZIP.

## Inicio rápido en Windows

1. **Instalar Node.js 22 LTS** (o una versión compatible con Vite 8) desde el sitio oficial; verificar `node -v` y `npm -v` en la terminal.
2. Descomprimir todo el ZIP en una ruta sencilla, por ejemplo `C:\ALERTA`.
3. Hacer doble clic en **`INICIAR_WEB.bat`** dentro de `ALERTA_Proyecto`. El script instala dependencias (`npm install`) e inicia Vite. Abrir **http://localhost:5173**.
4. Para probar la interfaz Ionic en el navegador, ejecutar **`INICIAR_MOVIL.bat`** (http://localhost:5174). `INICIAR_AMBAS.bat` inicia las dos ventanas a la vez.
5. **Iniciar sesión con usuarios válidos en el backend del VPS.** No se adjuntan cuentas reales ni credenciales. Los datos simulados no se habilitan por defecto.

El doble clic solo instala/inicia la app **si** tienes Node y acceso a npm. No proporciona una aplicación nativa Android compilada ni arranca el backend remoto. `ALERTA_Movil` también incluye configuración de Capacitor, pero desplegarla como APK requiere el proceso nativo y revisar cookies/CORS.

## Inicio en macOS / Linux

Dentro de la carpeta descomprimida, desde terminal:

```bash
sh iniciar-web.sh
sh iniciar-movil.sh
```

Alternativamente, en el directorio principal `npm install && npm run dev`; desde `ALERTA_Movil` repetir. Para compilar, después de instalar dependencias, ejecutar `npm run build` en cada directorio.

## Configuración del backend

Por defecto, ambas aplicaciones utilizan **`/api`** y un proxy local de Vite hacia el servidor indicado originalmente por tu compañero. Este destino se configura en `vite.config.ts` de cada proyecto. Si cambia el servidor, copiar `.env.example` a `.env.local` en cada proyecto y añadir una línea **`API_PROXY_TARGET=https://SERVIDOR_REAL`** (sin ruta `/api`). Reiniciar Vite.

No copiar contraseñas, tokens, cookies o credenciales al archivo `.env.local`. La sesión se autentica mediante cookie HTTP `sid`; el frontend no inventa tokens Bearer. La ruta `/socket.io` también está preparada en el proxy para el futuro cliente Socket.IO, pero **el cliente de eventos aún no se ha implementado en esta entrega**.

Si el sitio se publica en un dominio real o como APK, el proxy de desarrollo deja de ser suficiente: hay que configurar proxy de producción y políticas CORS, HTTPS y cookies con el responsable de backend.

## Qué fue modificado

- **Crear/editar institución**: formulario accesible con nombre, categoría, dirección, teléfono, razón social, detalle y mapa Leaflet; validación de coordenadas y llamadas POST/PUT reales. La ubicación inicial del mapa no se guarda automáticamente.
- **Usuarios**: operaciones CRUD web con edición funcional y conservación de nombres/apellidos, `nombre_rol`, teléfono, institución y contraseñas solo cuando corresponda.
- **Alertas**: listado y detalle administrativos desde `/api/alertas`, instituciones notificadas y estados reales; vistas institucionales web, y acciones institucionales móviles para recibir, atender y cerrar por API.
- **Lecturas**: `data.items` paginado, conservación de estado (`VALIDA`, `ANOMALA`, `INVALIDA`) y unidades CO/CO2/GAS_LEL.
- **Sesiones web/móvil**: cookie `sid`, restauración mediante `/auth/me`, roles por nombre, limpieza de datos privados al salir y control HTTP de errores sin confirmar éxitos ficticios.
- **Reportes y notificaciones**: consulta de listas y detalles con identificadores del backend, rechazo de respuestas sin ID y corrección de notificaciones móviles.
- **Visual**: encabezados/tarjetas/tablas/formularios adaptables, prevención de desbordamientos, contrastes y foco, diseño Ionic mejorado, mapas que no inyectan HTML no confiable.
- **Rutas Central antiguas**: reutilizan pantallas REST del administrador, sin despachos simulados. Los informes web no documentados muestran explícitamente la integración pendiente en lugar de guardar ficticiamente.

## Advertencias honestas y pendientes del backend

- **No se verificó una sesión autenticada contra el VPS**, porque no pudo conectarse desde el entorno de desarrollo. La última validación es por código y respuestas simuladas, no de extremo a extremo.
- **No se verificó la compilación Vite de producción** en este entorno: las dependencias adjuntas eran nativas de Windows, y Linux necesita reinstalarlas. El ZIP excluye `node_modules` para permitir instalación correcta por cada usuario.
- **Socket.IO en tiempo real aún no está conectado** al estado de las pantallas; el proxy `/socket.io` solo queda preparado.
- **Distribución a personal individual de cada institución**: aún pendiente del backend. Las alertas institucionales disponibles se identifican por `id_alerta + id_institucion`.
- **Subida de fotos en reportes**, **CRUD de informes de atención web y PDF**, y **cambio de contraseña**: falta confirmar/entregar los contratos específicos. No se simula éxito en estos módulos. El POST web de reporte comparte `/reportes-usuario` y su body debe comprobarse con OpenAPI real.
- **Auditoría**: se desactivó la exhibición de registros ficticios en el panel administrativo hasta disponer de una consulta documentada.
- **Instituciones inactivas**: según los documentos de backend se incluyen en envíos automáticos; conviene acordar cómo cerrar alertas cuando una institución no puede atender.

## Verificación técnica disponible

Tras `npm install` en web y móvil:

```bash
# En ALERTA_Proyecto/
npm run build
node tests/test_integracion.cjs

# En ALERTA_Proyecto/ALERTA_Movil/
npm run build
```

Las pruebas offline (`tests/test_integracion.cjs`) no ejecutan operaciones reales contra el servidor; validan contratos simulados, sintaxis y controles esenciales. Ver `RESULTADOS_VALIDACION.md` para resultados y límites precisos.

## Pruebas manuales prioritarias al iniciar

1. En 320px, 375px, 768px, 1024px y escritorio: comprobar el menú, textos de tarjetas, tabla de usuarios, pantalla de lecturas y modal de institución. No debería aparecer desplazamiento horizontal global.
2. Crear una institución con datos válidos y ubicación elegida expresamente; comprobar la petición `POST /api/instituciones` (pestaña Red/Network) y recargar el listado. Repetir para editar (`PUT`).
3. Comprobar con cuentas de roles ADMIN, JEFE_INSTITUCION y OPERATIVO: login, restauración `/auth/me`, acceso por rol, logout.
4. Validar `GET /api/lecturas?page=1&pageSize=100`, alertas y notificaciones con datos reales.
5. En móvil institucional, abrir una alerta asignada y realizar `recibir` / `atender` / `cerrar` con autorización; el detalle debe recargarse después de cada confirmación.
6. Forzar un error HTTP 401, 403 o 500 y verificar que ninguna operación muestra «guardado/enviado» como si hubiese sido aceptada.

**No usar este frontend para coordinación de emergencias reales hasta completar las pruebas integradas y de despliegue con el equipo de backend.**
