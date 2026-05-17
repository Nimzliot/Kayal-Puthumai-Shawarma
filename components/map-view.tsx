"use client";

import { useEffect, useRef } from "react";
import { calculateDistanceKm, calculateTravelMinutes } from "@/lib/utils";

type MapViewProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  label?: string;
  className?: string;
  origin?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  animateRoute?: boolean;
};

type RouteCoordinate = [number, number];

function buildStraightRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): RouteCoordinate[] {
  return [
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude]
  ];
}

function sliceRoute(coordinates: RouteCoordinate[], progress: number) {
  if (coordinates.length <= 1) {
    return coordinates;
  }

  const boundedProgress = Math.max(0, Math.min(progress, 1));
  const targetIndex = boundedProgress * (coordinates.length - 1);
  const wholeIndex = Math.floor(targetIndex);
  const fraction = targetIndex - wholeIndex;
  const sliced = coordinates.slice(0, wholeIndex + 1);

  if (wholeIndex < coordinates.length - 1) {
    const current = coordinates[wholeIndex];
    const next = coordinates[wholeIndex + 1];
    sliced.push([
      current[0] + (next[0] - current[0]) * fraction,
      current[1] + (next[1] - current[1]) * fraction
    ]);
  }

  return sliced;
}

function coordinateAtProgress(coordinates: RouteCoordinate[], progress: number): RouteCoordinate {
  const sliced = sliceRoute(coordinates, progress);
  return sliced[sliced.length - 1] ?? coordinates[0];
}

export function MapView({
  latitude,
  longitude,
  zoom = 14,
  label = "Kayal Puthumai Shawarma delivery zone",
  className = "",
  origin,
  animateRoute = false
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: import("maplibre-gl").Map | undefined;
    let animationFrameId: number | undefined;

    async function initMap() {
      const maplibregl = await import("maplibre-gl");

      if (!mapRef.current) {
        return;
      }

      map = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 19,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm"
            }
          ]
        },
        center: [longitude, latitude],
        zoom,
        maxZoom: 19,
        attributionControl: {}
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const destinationMarker = new maplibregl.Marker({ color: "#f7c942" })
        .setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(label))
        .addTo(map);

      if (!origin) {
        return;
      }

      new maplibregl.Marker({ color: "#ffffff" })
        .setLngLat([origin.longitude, origin.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText(origin.label ?? "Shop location"))
        .addTo(map);

      const bikeElement = document.createElement("div");
      bikeElement.className = "delivery-bike-marker";
      bikeElement.innerHTML =
        '<div style="display:flex;height:34px;width:34px;align-items:center;justify-content:center;border-radius:999px;background:#2b1568;border:2px solid #ffffff;color:#ffffff;font-size:16px;box-shadow:0 10px 30px rgba(43,21,104,0.35);">●</div>';

      const movingMarker = new maplibregl.Marker({ element: bikeElement, anchor: "center" })
        .setLngLat([origin.longitude, origin.latitude])
        .addTo(map);

      let routeCoordinates = buildStraightRoute(origin, { latitude, longitude });
      let routeDistanceKm = calculateDistanceKm(origin, { latitude, longitude });
      let routeDurationMinutes = calculateTravelMinutes(routeDistanceKm);

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${longitude},${latitude}?overview=full&geometries=geojson`
        );

        if (response.ok) {
          const result = (await response.json()) as {
            routes?: Array<{
              distance: number;
              duration: number;
              geometry?: {
                coordinates?: RouteCoordinate[];
              };
            }>;
          };

          const primaryRoute = result.routes?.[0];
          if (primaryRoute?.geometry?.coordinates && primaryRoute.geometry.coordinates.length > 1) {
            routeCoordinates = primaryRoute.geometry.coordinates;
            routeDistanceKm = primaryRoute.distance / 1000;
            routeDurationMinutes = Math.max(1, Math.round(primaryRoute.duration / 60));
          }
        }
      } catch {
        // Fallback to the straight-line preview when the routing service is unavailable.
      }

      const addRoute = () => {
        if (!map || map.getSource("delivery-route")) {
          return;
        }

        const initialRoute = animateRoute
          ? [routeCoordinates[0], routeCoordinates[0]]
          : routeCoordinates;

        map.addSource("delivery-route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: initialRoute
            },
            properties: {}
          }
        });

        map.addLayer({
          id: "delivery-route-glow",
          type: "line",
          source: "delivery-route",
          paint: {
            "line-color": "#4c1dff",
            "line-width": 14,
            "line-opacity": 0.28
          }
        });

        map.addLayer({
          id: "delivery-route-line",
          type: "line",
          source: "delivery-route",
          paint: {
            "line-color": "#5317ff",
            "line-width": 9,
            "line-opacity": 0.98
          }
        });

        map.addLayer({
          id: "delivery-route-outline",
          type: "line",
          source: "delivery-route",
          paint: {
            "line-color": "#140637",
            "line-width": 3,
            "line-opacity": 0.9
          }
        });

        if (animateRoute) {
          let frame = 0;
          const steps = Math.max(80, routeCoordinates.length);

          const animate = () => {
            if (!map) {
              return;
            }

            frame += 1;
            const progress = Math.min(frame / steps, 1);
            const source = map.getSource("delivery-route") as import("maplibre-gl").GeoJSONSource | undefined;
            const nextCoordinates = sliceRoute(routeCoordinates, progress);

            source?.setData({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: nextCoordinates
              },
              properties: {}
            });

            const markerPosition = coordinateAtProgress(routeCoordinates, progress);
            movingMarker.setLngLat(markerPosition);

            if (progress < 1) {
              animationFrameId = window.requestAnimationFrame(animate);
            } else {
              destinationMarker.setLngLat([longitude, latitude]);
            }
          };

          animationFrameId = window.requestAnimationFrame(animate);
        } else {
          movingMarker.setLngLat([longitude, latitude]);
        }
      };

      if (map.isStyleLoaded()) {
        addRoute();
      } else {
        map.once("load", addRoute);
      }

      const bounds = new maplibregl.LngLatBounds();
      routeCoordinates.forEach((coordinate) => bounds.extend(coordinate));
      map.fitBounds(bounds, {
        padding: 70,
        duration: animateRoute ? 1800 : 0,
        maxZoom: 17
      });

      const midpoint = routeCoordinates[Math.floor(routeCoordinates.length / 2)] ?? [
        (origin.longitude + longitude) / 2,
        (origin.latitude + latitude) / 2
      ];

      new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12
      })
        .setLngLat(midpoint)
        .setHTML(
          `<div style="display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:16px;background:#ffffff;color:#171717;border:1px solid rgba(23,23,23,0.08);font-size:12px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,0.18);"><span>${routeDurationMinutes} min</span><span style="color:#707070;">${routeDistanceKm.toFixed(1)} km</span></div>`
        )
        .addTo(map);
    }

    initMap();

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      map?.remove();
    };
  }, [
    animateRoute,
    label,
    latitude,
    longitude,
    origin?.label,
    origin?.latitude,
    origin?.longitude,
    zoom
  ]);

  return (
    <div
      ref={mapRef}
      className={`h-full min-h-[280px] w-full overflow-hidden rounded-[24px] border border-brand/20 ${className}`}
    />
  );
}
