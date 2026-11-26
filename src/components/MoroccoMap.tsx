"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type GeoJSONSource,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers, LocateFixed, Maximize2 } from "lucide-react";
import { useApp } from "./AppProvider";
import type { PropertyItem } from "./PropertyCard";

export interface MapProperty extends PropertyItem {
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export interface ExactCoords {
  lat: number;
  lng: number;
  accuracy?: number;
}

const OPENFREEMAP_LIGHT = "https://tiles.openfreemap.org/styles/liberty";
const OPENFREEMAP_DARK = "https://tiles.openfreemap.org/styles/dark";

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "&copy; Esri &copy; OpenFreeMap",
    },
  },
  layers: [
    {
      id: "esri-satellite",
      type: "raster",
      source: "esri",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function isDarkModeActive(theme: string): boolean {
  return theme === "dark";
}

function createGeoJsonCircle(
  centerLngLat: [number, number],
  radiusKm: number,
  points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = centerLngLat;
  const coords: [number, number][] = [];
  const distanceX = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    coords.push([lng + distanceX * Math.cos(theta), lat + distanceY * Math.sin(theta)]);
  }
  coords.push(coords[0]);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

export function MoroccoMap({
  items,
  selectedId,
  onSelect,
  userCoords,
  radiusKm = 0,
  onRequestGps,
  gpsLoading = false,
  height = 500,
  nightsCount = 1,
}: {
  items: MapProperty[];
  selectedId: number | null;
  onSelect: (item: MapProperty) => void;
  userCoords: ExactCoords | null;
  radiusKm?: number;
  onRequestGps?: () => void;
  gpsLoading?: boolean;
  height?: number | string;
  nightsCount?: number;
}) {
  const { lang, money, tr, theme } = useApp();
  const [mapStyle, setMapStyle] = useState<"vector" | "satellite">("vector");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const markerElsByIdRef = useRef<Map<number, HTMLElement>>(new Map());
  const userMarkerRef = useRef<Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const currentStyleSpec =
    mapStyle === "satellite"
      ? SATELLITE_STYLE
      : isDarkModeActive(theme)
      ? OPENFREEMAP_DARK
      : OPENFREEMAP_LIGHT;

  const drawUserRadiusLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (!map.isStyleLoaded()) return;

      const srcId = "marhaba-gps-radius";
      const fillId = "marhaba-gps-radius-fill";
      const lineId = "marhaba-gps-radius-line";

      if (!userCoords) {
        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        return;
      }

      const rKm = radiusKm > 0 ? radiusKm : Math.max((userCoords.accuracy || 180) / 1000, 0.25);
      const geojson = createGeoJsonCircle([userCoords.lng, userCoords.lat], rKm);

      const existing = map.getSource(srcId) as GeoJSONSource | undefined;
      if (existing) {
        existing.setData(geojson);
      } else {
        map.addSource(srcId, { type: "geojson", data: geojson });
        map.addLayer({
          id: fillId,
          type: "fill",
          source: srcId,
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.14,
          },
        });
        map.addLayer({
          id: lineId,
          type: "line",
          source: srcId,
          paint: {
            "line-color": "#1f40c5",
            "line-width": 2,
            "line-dasharray": radiusKm > 0 ? [3, 2] : [1, 0],
          },
        });
      }
    } catch {
      // ignore style transition errors
    }
  }, [userCoords, radiusKm]);

  const appliedStyleRef = useRef<StyleSpecification | string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = new MapLibreMap({
        container: containerRef.current,
        style: currentStyleSpec,
        center: [-7.2, 31.5],
        zoom: 5.2,
        attributionControl: false,
      });
      appliedStyleRef.current = currentStyleSpec;

      map.addControl(new NavigationControl({ showCompass: true }), "top-left");
      map.addControl(new AttributionControl({ compact: true }), "bottom-right");

      mapRef.current = map;

      return () => {
        try {
          markersRef.current.forEach((m) => m.remove());
          markersRef.current = [];
          userMarkerRef.current?.remove();
          userMarkerRef.current = null;
          map.remove();
        } catch {
          // ignore cleanup errors
        }
        mapRef.current = null;
      };
    } catch {
      // ignore if WebGL context unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (appliedStyleRef.current === currentStyleSpec) return;
    appliedStyleRef.current = currentStyleSpec;
    try {
      map.setStyle(currentStyleSpec);
      map.once("styledata", () => {
        drawUserRadiusLayer();
      });
    } catch {
      // ignore
    }
  }, [currentStyleSpec, drawUserRadiusLayer]);

  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const coords: [number, number][] = items
        .filter((i) => Number.isFinite(i.latitude) && Number.isFinite(i.longitude))
        .map((i) => [i.longitude, i.latitude]);
      if (userCoords) coords.push([userCoords.lng, userCoords.lat]);

      if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 12.5, essential: true });
      } else if (coords.length > 1) {
        const bounds = new LngLatBounds(coords[0], coords[0]);
        for (const c of coords) bounds.extend(c);
        map.fitBounds(bounds, { padding: 52, maxZoom: 13, duration: 700 });
      } else {
        map.flyTo({ center: [-7.2, 31.5], zoom: 5.2 });
      }
    } catch {
      // ignore
    }
  }, [items, userCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markerElsByIdRef.current.clear();

    const multiplier = Math.max(1, nightsCount || 1);

    for (const item of items) {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) continue;
      const localizedTitle =
        lang === "ar" && item.title_ar ? item.title_ar : lang === "fr" && item.title_fr ? item.title_fr : item.title;

      const el = document.createElement("button");
      el.type = "button";
      el.className = "leaflet-price-pin";
      el.textContent = money(Math.round(item.base_price_mad * multiplier));
      el.title = localizedTitle;
      el.setAttribute("aria-label", localizedTitle);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(item);
        map.flyTo({
          center: [item.longitude, item.latitude],
          zoom: Math.max(map.getZoom(), 10.5),
          duration: 550,
        });
      });

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map);
      markersRef.current.push(marker);
      markerElsByIdRef.current.set(item.id, marker.getElement());
    }
  }, [items, lang, money, nightsCount]);

  useEffect(() => {
    for (const [id, el] of markerElsByIdRef.current.entries()) {
      const isSelected = selectedId === id;
      el.classList.toggle("active", isSelected);
      el.style.zIndex = isSelected ? "30" : "1";
    }
  }, [selectedId, items]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    if (userCoords) {
      const el = document.createElement("div");
      el.className = "gps-pulse-dot";
      el.title = "GPS";
      el.innerHTML = "<span></span>";
      userMarkerRef.current = new Marker({ element: el, anchor: "center" })
        .setLngLat([userCoords.lng, userCoords.lat])
        .addTo(map);
    }

    if (map.isStyleLoaded()) {
      drawUserRadiusLayer();
    } else {
      map.once("load", drawUserRadiusLayer);
    }
  }, [userCoords, radiusKm, drawUserRadiusLayer]);

  useEffect(() => {
    fitBounds();
  }, [items.length, userCoords?.lat, userCoords?.lng, radiusKm, fitBounds]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          background: isDarkModeActive(theme) ? "#0f172a" : "#e5e7eb",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 5,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          maxWidth: "calc(100% - 62px)",
        }}
      >
        {onRequestGps && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={onRequestGps}
            disabled={gpsLoading}
            style={{ boxShadow: "var(--shadow-md)", borderRadius: 999 }}
          >
            <LocateFixed size={14} />
            <span>{gpsLoading ? tr("detectingGps") : tr("exactLocationBtn")}</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={fitBounds}
          style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", borderRadius: 999 }}
          title={tr("fitMapBtn")}
        >
          <Maximize2 size={14} />
          <span>{tr("fitMapBtn")}</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${mapStyle === "satellite" ? "btn-gold" : "btn-outline"}`}
          onClick={() => setMapStyle((s) => (s === "vector" ? "satellite" : "vector"))}
          style={{
            background: mapStyle === "satellite" ? undefined : "var(--surface)",
            boxShadow: "var(--shadow-md)",
            borderRadius: 999,
          }}
          aria-label="Toggle map style"
          title="OpenFreeMap / Satellite"
        >
          <Layers size={14} />
        </button>
      </div>
    </div>
  );
}
