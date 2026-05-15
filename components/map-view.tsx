"use client";

import { useEffect, useRef } from "react";
import { calculateDistanceKm } from "@/lib/utils";

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

      new maplibregl.Marker({ color: "#f7c942" })
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

      const routeCoordinates: [number, number][] = [
        [origin.longitude, origin.latitude],
        [longitude, latitude]
      ];

      const addRoute = () => {
        if (!map || map.getSource("delivery-route")) {
          return;
        }

        map.addSource("delivery-route", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: animateRoute
                ? [routeCoordinates[0], routeCoordinates[0]]
                : routeCoordinates
            },
            properties: {}
          }
        });

        map.addLayer({
          id: "delivery-route-glow",
          type: "line",
          source: "delivery-route",
          paint: {
            "line-color": "#f7c942",
            "line-width": 8,
            "line-opacity": 0.18
          }
        });

        map.addLayer({
          id: "delivery-route-line",
          type: "line",
          source: "delivery-route",
          paint: {
            "line-color": "#f7c942",
            "line-width": 4,
            "line-opacity": 0.95
          }
        });

        if (animateRoute) {
          let frame = 0;
          const steps = 45;

          const animate = () => {
            if (!map) {
              return;
            }

            frame += 1;
            const progress = Math.min(frame / steps, 1);
            const nextLng = origin.longitude + (longitude - origin.longitude) * progress;
            const nextLat = origin.latitude + (latitude - origin.latitude) * progress;

            const source = map.getSource("delivery-route") as import("maplibre-gl").GeoJSONSource | undefined;
            source?.setData({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [origin.longitude, origin.latitude],
                  [nextLng, nextLat]
                ]
              },
              properties: {}
            });

            if (progress < 1) {
              animationFrameId = window.requestAnimationFrame(animate);
            }
          };

          animationFrameId = window.requestAnimationFrame(animate);
        }
      };

      if (map.isStyleLoaded()) {
        addRoute();
      } else {
        map.once("load", addRoute);
      }

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([origin.longitude, origin.latitude]);
      bounds.extend([longitude, latitude]);
      map.fitBounds(bounds, {
        padding: 70,
        duration: animateRoute ? 1600 : 0,
        maxZoom: 17
      });

      const distanceKm = calculateDistanceKm(origin, { latitude, longitude });
      new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12
      })
        .setLngLat([(origin.longitude + longitude) / 2, (origin.latitude + latitude) / 2])
        .setHTML(
          `<div style="padding:6px 10px;border-radius:999px;background:#0f0f0f;color:#f7c942;border:1px solid rgba(247,201,66,0.25);font-size:12px;font-weight:600;">${distanceKm.toFixed(1)} km away</div>`
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
    className,
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
