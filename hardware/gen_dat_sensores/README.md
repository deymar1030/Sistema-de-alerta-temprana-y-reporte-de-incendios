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
.venv\Scripts\python.exe main.py --intervalo 15 --escenario normal
```

En Linux/macOS usar `.venv/bin/python`. Ctrl+C detiene la interfaz local y todos los clientes MQTT.

La interfaz Flask se inicia junto con el simulador en `http://127.0.0.1:5000`. Selecciona un predio para ver su conexión MQTT, escenario, lecturas recientes y estado de publicación por sensor; el panel se actualiza cada 2.5 segundos. Puedes pausar/reanudar el envío de un sensor individual o usar los controles para pausar/reanudar todos los sensores del predio seleccionado. Esto solo detiene las publicaciones futuras de este simulador; no cambia el estado ni la configuración de sensores en el backend. Una publicación MQTT que ya estaba en curso puede terminar. La pausa es temporal y al reiniciar el simulador todos los sensores vuelven a estar habilitados. Los botones de escenario actualizan el estado sin recargar la página y muestran si la operación inició o falló. Solo se puede activar un escenario a la vez por predio: detén el actual antes de iniciar otro. `gas` eleva CO₂ y %LEL; `calor` e `incendio` suben directamente la temperatura simulada a 80 °C en la primera lectura publicada. Los valores de CO₂ y %LEL en `incendio` conservan su rampa de 10 segundos. En modo manual, las lecturas nuevas se publican de acuerdo con `--intervalo` (15 segundos por defecto; configurable entre 5 y 60 segundos). El backend recibe lecturas MQTT y decide si corresponde generar una alerta; el simulador no crea alertas directamente ni garantiza que el motor confirme un incendio. También permite encolar una lectura manual individual. Solo escucha en el equipo local: no la expongas a Internet. Acuerda las pruebas antes de publicar en un broker compartido, detén los escenarios al terminar, cambia el puerto con `--web-port` o desactívala con `--sin-interfaz`.

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
.venv\Scripts\python.exe main.py --escenario co --duracion 900
.venv\Scripts\python.exe main.py --escenario humo --duracion 900
.venv\Scripts\python.exe main.py --escenario humedad --duracion 900
.venv\Scripts\python.exe main.py --escenario pico --duracion 600
.venv\Scripts\python.exe main.py --escenario incendio --duracion 900
```

- `normal`: ruido alrededor de la base de cada sensor.
- `gas`: aumento sintético de CO₂ y %LEL, con rampa de 15 segundos.
- `calor`: incremento de temperatura a 80 °C desde la primera lectura del evento.
- `co`: aumento sintético de CO desde la primera lectura, con rampa de 10 segundos.
- `humo`: supera 500 ppm desde la primera lectura del evento si el rango del sensor lo permite.
- `humedad`: baja a 19 % desde la primera lectura del evento si el rango del sensor lo permite.
- `pico`: pico breve del primer sensor TEMPERATURA del primer predio, manteniendo los demás en su variación normal.
- `incendio`: combina temperatura, CO₂, %LEL, CO, humo y humedad. Respeta los límites configurados de cada sensor, así que algunos objetivos pueden quedar recortados por esos rangos.

En modo automático, el escenario empieza después de **3 segundos** de línea base por defecto (`--inicio-evento`). En `calor` e `incendio`, la primera lectura de temperatura del evento pasa a **80 °C**. El generador amplía solo su límite local de simulación a 80 °C; no modifica el rango guardado del sensor. CO₂, %LEL y CO de `incendio` completan una rampa sintética de **10 segundos**; la humedad baja a **19 %** y el humo sube a **501 ppm** desde la primera lectura del evento, cuando los rangos configurados lo permiten. `gas` completa su rampa en **15 segundos**. La interfaz local ofrece un selector para `gas`, `calor`, `co`, `humo`, `humedad` e `incendio combinado`; cada escenario individual modifica solo su tipo de sensor y deja las demás variables en su variación normal. Las lecturas se publican cada 15 segundos por defecto; ajusta el intervalo con `--intervalo` (entre 5 y 60 segundos) según la frecuencia requerida por el motor de detección. Puedes aumentar el tiempo de línea base, por ejemplo `--inicio-evento 420`, para obtener más lecturas previas al evento. `--semilla` hace reproducible el ruido.

Los rangos `rango_min`/`rango_max` son límites configurados del sensor, no sus valores normales ni umbrales de alerta. La temperatura sintética de prueba alcanza 80 °C aunque el máximo configurado sea menor; esto no modifica el registro del sensor. Son escenarios para probar software, no modelos físicos de combustión ni validación de umbrales. El backend puede evaluar estas lecturas conforme a su propia configuración y no necesariamente generar una alerta. No sustituir CO₂/%LEL por humo/CO para forzarlo.

## Transporte

Broker predeterminado: `mqtt://127.0.0.1:1883`. Cambiar con `--broker` o `MQTT_BROKER_URL`. Con TLS (recomendado si el broker es remoto):

```powershell
.venv\Scripts\python.exe main.py --broker mqtts://broker.ejemplo:8883 --ca ruta/ca.crt
```

El `--ca` debe ser el certificado CA configurado para el broker si no usa uno público. Verifica certificado/hostname, autentica cada gateway (`predio-{id}` contra Mosquitto), espera confirmación QoS 1 y publica sin retain. Fecha UTC y únicamente `valor`/`fecha_hora`; IDs en el tópico. Reconexión automática, cola acotada y cierre compatible con Windows.

No iniciar dos copias con la misma identidad: una conexión nueva desplaza a la anterior.

Las lecturas manuales modifican únicamente el dato enviado; no crean por sí solas reportes ni garantizan una alerta de incendio. Los escenarios son datos sintéticos para pruebas, no mediciones físicas. Antes de publicar en un VPS compartido, acuerda una prueba y su duración con quien administra el backend.
