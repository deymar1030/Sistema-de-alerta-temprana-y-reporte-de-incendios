# Simuladores originales

Una conexión MQTT por predio agrupa sus sensores. **Ya no se usa un manifiesto estático** (`simuladores.json`): en cada corrida, el script inicia sesión como un usuario de simulación y descubre en vivo, vía la API, qué predios y sensores activos existen — así los predios que se creen desde el frontend entran automáticamente en la próxima corrida, sin tocar el código ni archivos de configuración.

## Preparación

1. Necesitas un usuario de simulación ya registrado en el sistema (cualquier rol sirve, `/predios` y `/sensores` no restringen por rol — solo requieren sesión iniciada). Regístralo una vez con `POST /api/auth/register` o pide que te den uno.
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

En Linux/macOS usar `.venv/bin/python`. Ctrl+C detiene todos los clientes.

Cualquier valor del `.env` se puede sobrescribir puntualmente por línea de comandos, ej. `--broker` o `--escenario`; ver `--help` para la lista completa.

### Credenciales MQTT por predio

El backend solo guarda el **hash** de la contraseña MQTT de cada predio (`predio.contrasena_mqtt`); nunca la expone de vuelta por la API. Por eso, cuando el script descubre un predio que **todavía no tiene credencial asignada por este simulador**, genera una contraseña nueva, la manda al backend (`PUT /predios/:id`) y la guarda localmente en `runtime/credenciales_predios.json` (ignorado por Git) para reusarla en corridas futuras — no hace falta volver a generarla cada vez.

Si borras ese archivo de caché, el script vuelve a generar y asignar una contraseña nueva para cada predio la próxima vez que corra (sobrescribiendo la anterior en la BD).

Para sensores recién creados en un predio ya conocido no hace falta nada especial: se detectan solos en la próxima corrida (solo se incluyen los sensores con `estado = ACTIVO`).

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

El `--ca` debe ser el mismo certificado configurado en el broker (ver `backend/mqtt/runtime/certs/server.crt` si usan uno autofirmado propio). Verifica certificado/hostname, autentica cada gateway (`predio-{id}` contra el backend), espera confirmación QoS 1 y publica sin retain. Fecha UTC y únicamente `valor`/`fecha_hora`; IDs en el tópico. Reconexión automática, cola acotada y cierre compatible con Windows.

No iniciar dos copias con la misma identidad: una conexión nueva desplaza a la anterior.

---

# Interfaz web (Flask)

Panel para controlar el simulador e **inyectar incendios manualmente** por predio. Reusa `.env`, `backend_api.py` y `cliente_predio.py`; el CLI (`main.py`) sigue funcionando igual.

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Abrir http://127.0.0.1:5000. Al arrancar descubre los predios/sensores ACTIVOS del backend (botón «Actualizar predios» para volver a consultar).

- **Iniciar simulacion** (por predio o «Iniciar todos»): abre la conexión MQTT del predio y publica sus sensores en `incendios/{id_predio}/{id_sensor}`.
- **Iniciar incendio**: tipo (incendio completo, solo calor, fuga de gas, pico), intensidad (multiplicador) y rampa (segundos hasta el valor máximo). Solo afecta los sensores que el predio realmente tiene (TEMPERATURA, HUMO, CO, CO2, HUMEDAD, GAS_LEL).
- **Apagar**: los valores bajan gradualmente (45 s) a la normalidad.
- **Barra de línea base**: el motor necesita ~7 min de datos normales antes del evento; la web avisa si disparas antes.
- Es una herramienta de prueba, no un modelo físico de combustión.
