# Servicio de detección de incendios

Este servicio ejecuta el modelo PyTorch entrenado en el notebook de Colab. El
backend de Node.js recibe la carga de la imagen y la reenvía a este servicio;
así, Node no necesita cargar PyTorch ni el archivo `.pth`.

## Preparar el modelo desde Colab

Al final del notebook se genera `cnn_incendios_urbanos_resnet18.pth`. Ejecuta
la siguiente celda después de guardarlo para descargarlo:

```python
from google.colab import files
files.download(MODEL_PATH)
```

Coloca el archivo descargado aquí (no se versiona por su tamaño):

```text
ml-service/models/cnn_incendios_urbanos_resnet18.pth
```

## Ejecutar localmente

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verifica que el modelo se cargó:

```bash
curl http://127.0.0.1:8000/health
```

La respuesta debe indicar `"model_loaded": true`. Si indica `false`, revisa
la ubicación o el nombre del archivo `.pth`.

## Endpoint interno

`POST /predict`, con `multipart/form-data` y el campo `image`. Acepta JPG,
PNG y WEBP y devuelve la clase (`FIRE` o `NO_FIRE`), probabilidades y el umbral
seleccionado durante el entrenamiento.
