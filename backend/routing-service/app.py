from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from router import calculate_shortest_route

app = FastAPI(title="Servicio de rutas")


class RouteRequest(BaseModel):
    origin_latitude: float = Field(ge=-90, le=90)
    origin_longitude: float = Field(ge=-180, le=180)
    destination_latitude: float = Field(ge=-90, le=90)
    destination_longitude: float = Field(ge=-180, le=180)


@app.post("/routes")
def calculate_route(request: RouteRequest):
    try:
        return calculate_shortest_route(
            origin_latitude=request.origin_latitude,
            origin_longitude=request.origin_longitude,
            destination_latitude=request.destination_latitude,
            destination_longitude=request.destination_longitude,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo obtener la red vial o calcular la ruta",
        ) from error 