# Simuladores originales

El generador consulta la API para descubrir predios y sensores activos y publica lecturas MQTT, con una conexión por predio. El frontend puede crear predios y sensores; no hace falta cambiar un manifiesto local, porque el generador vuelve a consultarlos al iniciar.

## Preparación

1. Necesitas un usuario de simulación ya registrado en el sistema para consultar `/api/predios` y `/api/sensores`. Regístralo con `POST /api/auth/register` o pide que te creen uno. Usa una cuenta de simulación propia, no una cuenta administradora.
2. Instala dependencias:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

3. Copia `.env.example` a `.env` y completa los valores (`.env` está en `.gitignore`, nunca se sube):

```
SIMULADOR_BACKEND_URL=http://TU-BACKEND
SIMULADOR_CORREO=simulador@sistema.local
SIMULADOR_CONTRASENA=TU_CONTRASENA
MQTT_BROKER_URL=mqtts://TU-BROKER:8883
MQTT_CA_FILE=ruta/al/server.crt
```

4. Corre el simulador (lee todo de `.env` automáticamente):

```powershell
.venv\Scripts\python.exe main.py --intervalo 7 --escenario normal
```

En Linux/macOS usar `.venv/bin/python`. Ctrl+C detiene la interfaz local y todos los clientes MQTT.

La interfaz Flask se inicia junto con el simulador en `http://127.0.0.1:5000`. Desde allí se puede seleccionar un sensor activo y encolar una lectura manual, validada contra el rango configurado. Se publica en el siguiente ciclo normal; no abre una conexión MQTT adicional. Solo escucha en el equipo local: no la expongas a Internet. Cambia el puerto con `--web-port` o desactívala con `--sin-interfaz`.

Cualquier valor del `.env` se puede sobrescribir puntualmente por línea de comandos, ej. `--broker` o `--escenario`; ver `--help` para la lista completa.

### Credenciales MQTT por predio

El generador no crea ni cambia credenciales MQTT. El responsable del backend debe provisionar en Mosquitto el usuario `predio-{id}` y su ACL y entregarte la contraseña por un canal seguro. La API de predios no administra las cuentas del broker.

Guarda las contraseñas provisionadas en `runtime/credenciales_predios.json` (ignorado por Git), usando el ID de predio como clave:

```json
{
  "8": "CONTRASENA_MQTT_ENTREGADA_PARA_ESE_PREDIO"
}
```

No subas este archivo ni compartas su contenido. Si falta la contraseña de un predio con sensores activos, el generador se detiene e indica qué IDs solicitar; nunca reemplaza credenciales. Los sensores activos nuevos de predios con credencial configurada se descubren automáticamente al reiniciar.

## Escenarios

```powershell
.venv\Scripts\python.exe main.py --escenario gas --duracion 900
.venv\Scripts\python.exe main.py --escenario calor --duracion 900
.venv\Scripts\python.exe main.py --escenario pico --duracion 600
```

- `normal`: ruido alrededor de la base de cada sensor.
- `gas`: aumento sintético de CO₂ y %LEL.
- `calor`: incremento gradual de temperatura en los predios.
- `pico`: pico breve del primer sensor TEMPERATURA del primer predio, manteniendo los demás en su variación normal.

El evento empieza a los **420 segundos** por defecto. `--inicio-evento` lo cambia; un calentamiento corto puede dejar R desconocido. `--semilla` hace reproducible el ruido.

Son escenarios para probar software, no modelos físicos de combustión ni validación de umbrales. Con la política conservadora pueden abrir `EN_EVALUACION`, pero no confirmar automáticamente `INCENDIO`. No sustituir CO₂/%LEL por humo/CO para forzarlo.

## Transporte

Broker predeterminado: `mqtt://127.0.0.1:1883`. Cambiar con `--broker` o `MQTT_BROKER_URL`. Con TLS (recomendado si el broker es remoto):

```powershell
.venv\Scripts\python.exe main.py --broker mqtts://broker.ejemplo:8883 --ca ruta/ca.crt
```

El `--ca` debe ser el certificado CA configurado para el broker si no usa uno público. Verifica certificado/hostname, autentica cada gateway (`predio-{id}` contra Mosquitto), espera confirmación QoS 1 y publica sin retain. Fecha UTC y únicamente `valor`/`fecha_hora`; IDs en el tópico. Reconexión automática, cola acotada y cierre compatible con Windows.

No iniciar dos copias con la misma identidad: una conexión nueva desplaza a la anterior.

Las lecturas manuales modifican únicamente el dato enviado; no crean por sí solas reportes ni garantizan una alerta de incendio. Los escenarios son datos sintéticos para pruebas, no mediciones físicas. Antes de publicar en un VPS compartido, acuerda una prueba y su duración con quien administra el backend.
