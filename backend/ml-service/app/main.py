"""Servicio de inferencia para el modelo de incendios urbanos."""

from __future__ import annotations

import io
import os
from pathlib import Path
from typing import Any

import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from torchvision import models, transforms

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models/cnn_incendios_urbanos_resnet18.pth"))
MAX_IMAGE_SIZE_BYTES = int(os.getenv("MAX_IMAGE_SIZE_MB", "10")) * 1024 * 1024

app = FastAPI(title="Servicio de detección de incendios", version="1.0.0")
model: nn.Module | None = None
model_config: dict[str, Any] = {}


class Prediction(BaseModel):
    label: str
    detected: bool
    fire_probability: float
    no_fire_probability: float
    threshold: float
    warning: str | None = None


def build_model() -> nn.Module:
    """Replica exactamente la última capa usada durante el entrenamiento en Colab."""
    resnet = models.resnet18(weights=None)
    resnet.fc = nn.Sequential(
        nn.Dropout(0.35),
        nn.Linear(resnet.fc.in_features, 1),
    )
    return resnet


def load_model() -> None:
    global model, model_config

    if not MODEL_PATH.is_file():
        model = None
        model_config = {}
        return

    checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
    if not isinstance(checkpoint, dict) or "model_state_dict" not in checkpoint:
        raise RuntimeError("El archivo del modelo no contiene model_state_dict.")

    loaded_model = build_model()
    loaded_model.load_state_dict(checkpoint["model_state_dict"])
    loaded_model.eval()
    model = loaded_model
    model_config = checkpoint


@app.on_event("startup")
def startup() -> None:
    load_model()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok" if model is not None else "model_not_loaded",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH),
    }


@app.post("/predict", response_model=Prediction)
async def predict(image: UploadFile = File(...)) -> Prediction:
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Modelo no encontrado. Descarga el .pth generado por Colab en "
                f"{MODEL_PATH}."
            ),
        )

    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Solo se aceptan imágenes JPG, PNG o WEBP.")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="La imagen está vacía.")
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="La imagen excede el tamaño máximo permitido.")

    try:
        with Image.open(io.BytesIO(contents)) as uploaded_image:
            rgb_image = uploaded_image.convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida.") from exc

    image_size = int(model_config.get("img_size", 224))
    transform = transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225],
            ),
        ]
    )

    batch = transform(rgb_image).unsqueeze(0)
    with torch.no_grad():
        probability = float(torch.sigmoid(model(batch)).item())

    threshold = float(model_config.get("threshold", 0.5))
    detected = probability >= threshold
    warning = (
        "Resultado cercano al umbral; requiere revisión humana."
        if abs(probability - threshold) < 0.10
        else None
    )
    return Prediction(
        label="FIRE" if detected else "NO_FIRE",
        detected=detected,
        fire_probability=round(probability, 6),
        no_fire_probability=round(1 - probability, 6),
        threshold=threshold,
        warning=warning,
    )
