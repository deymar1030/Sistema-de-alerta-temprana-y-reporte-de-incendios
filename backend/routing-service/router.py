from math import cos, radians
from pathlib import Path

import folium
import networkx as nx
import osmnx as ox


def _validate_coordinate(latitude, longitude, label):
    latitude = float(latitude)
    longitude = float(longitude)
    if not -90 <= latitude <= 90:
        raise ValueError(f"{label}: latitud fuera del rango [-90, 90]")
    if not -180 <= longitude <= 180:
        raise ValueError(f"{label}: longitud fuera del rango [-180, 180]")
    return latitude, longitude


def _route_bbox(origin, destination, margin_m=1000):
    midpoint_latitude = (origin[0] + destination[0]) / 2
    latitude_margin = margin_m / 111_320
    longitude_scale = max(cos(radians(midpoint_latitude)), 0.01)
    longitude_margin = margin_m / (111_320 * longitude_scale)

    return (
        min(origin[1], destination[1]) - longitude_margin,
        min(origin[0], destination[0]) - latitude_margin,
        max(origin[1], destination[1]) + longitude_margin,
        max(origin[0], destination[0]) + latitude_margin,
    )


def calculate_shortest_route(
    origin_latitude,
    origin_longitude,
    destination_latitude,
    destination_longitude,
    network_type="drive",
    margin_m=1000,
):
    """Calcula con Dijkstra la ruta de menor longitud entre dos coordenadas.

    Las coordenadas se reciben como (latitud, longitud). La geometría devuelta
    usa pares [latitud, longitud], listos para Folium.
    """
    origin = _validate_coordinate(origin_latitude, origin_longitude, "Origen")
    destination = _validate_coordinate(
        destination_latitude, destination_longitude, "Destino"
    )

    graph = ox.graph_from_bbox(
        _route_bbox(origin, destination, margin_m),
        network_type=network_type,
        simplify=True,
    )
    if graph.number_of_nodes() == 0:
        raise ValueError("OpenStreetMap no devolvió calles para esta zona")

    origin_node = ox.distance.nearest_nodes(
        graph, X=origin[1], Y=origin[0]
    )
    destination_node = ox.distance.nearest_nodes(
        graph, X=destination[1], Y=destination[0]
    )

    try:
        route_nodes = nx.shortest_path(
            graph,
            source=origin_node,
            target=destination_node,
            weight="length",
            method="dijkstra",
        )
    except nx.NetworkXNoPath as error:
        raise ValueError("No existe una ruta vial entre origen y destino") from error

    if len(route_nodes) == 1:
        route_geometry = [[graph.nodes[route_nodes[0]]["y"], graph.nodes[route_nodes[0]]["x"]]]
        distance_m = 0.0
    else:
        route_edges = ox.routing.route_to_gdf(graph, route_nodes, weight="length")
        distance_m = float(route_edges["length"].sum())
        route_geometry = []

        for geometry in route_edges.geometry:
            if geometry is None:
                continue
            segments = geometry.geoms if geometry.geom_type == "MultiLineString" else [geometry]
            for segment in segments:
                for longitude, latitude in segment.coords:
                    coordinate = [latitude, longitude]
                    if not route_geometry or coordinate != route_geometry[-1]:
                        route_geometry.append(coordinate)

        if not route_geometry:
            route_geometry = [
                [graph.nodes[node]["y"], graph.nodes[node]["x"]]
                for node in route_nodes
            ]

    return {
        "origin": {"latitude": origin[0], "longitude": origin[1]},
        "destination": {"latitude": destination[0], "longitude": destination[1]},
        "origin_node": int(origin_node),
        "destination_node": int(destination_node),
        "route_nodes": [int(node) for node in route_nodes],
        "distance_m": distance_m,
        "geometry": route_geometry,
    }


def save_route_map(route_result, output_path="ruta_mas_corta.html"):
    """Guarda un mapa HTML con el origen, destino y camino calculado."""
    origin = route_result["origin"]
    destination = route_result["destination"]
    center = [
        (origin["latitude"] + destination["latitude"]) / 2,
        (origin["longitude"] + destination["longitude"]) / 2,
    ]
    route_map = folium.Map(location=center, zoom_start=14, tiles="OpenStreetMap")

    folium.PolyLine(
        route_result["geometry"],
        color="#d62828",
        weight=5,
        opacity=0.9,
        tooltip=f"Ruta más corta: {route_result['distance_m']:.0f} m",
    ).add_to(route_map)
    folium.Marker(
        [origin["latitude"], origin["longitude"]],
        tooltip="Institución (origen)",
        icon=folium.Icon(color="green", icon="fire-extinguisher", prefix="fa"),
    ).add_to(route_map)
    folium.Marker(
        [destination["latitude"], destination["longitude"]],
        tooltip="Incendio (destino)",
        icon=folium.Icon(color="red", icon="fire", prefix="fa"),
    ).add_to(route_map)

    output_path = Path(output_path)
    route_map.save(output_path)
    return output_path