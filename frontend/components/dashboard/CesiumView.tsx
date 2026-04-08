"use client";

/**
 * CesiumView — CesiumJS-powered 3D globe.
 *
 * Loaded only client-side (dynamic import with ssr:false in DashboardLayout).
 * Imports Cesium dynamically inside a useEffect so CESIUM_BASE_URL is set first.
 *
 * No Ion token required: uses built-in NaturalEarthII imagery (local, no CORS)
 * via the async TileMapServiceImageryProvider.fromUrl() factory.
 */

import { useEffect, useRef } from "react";
import { useViewStore } from "@/hooks/view-store";
import { globeAPI, zoomToHeight, heightToZoom } from "@/lib/globe-api";

export function CesiumView() {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Must be set before any Cesium module code runs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CESIUM_BASE_URL =
      process.env.NEXT_PUBLIC_CESIUM_BASE_URL ?? "/cesium";

    let destroyed = false;

    // Cesium widget CSS — served from our local public/cesium copy (no CORS).
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = "/cesium/Widgets/widgets.css";
    document.head.appendChild(link);

    // Dynamic import keeps Cesium out of the server bundle entirely.
    // @ts-expect-error — cesium is installed in the Docker container; not in local node_modules
    import("cesium").then(async (C: Record<string, any>) => {
      if (destroyed || !containerRef.current) return;

      C.Ion.defaultAccessToken = "";

      if (destroyed || !containerRef.current) return;

      const viewer = new C.Viewer(containerRef.current, {
        // Don't pass imageryProvider here — newer Cesium initialises a default
        // Bing layer first then replaces it, causing a flash and token warning.
        // We remove all default layers and add ours below.
        baseLayerPicker:      false,
        geocoder:             false,
        homeButton:           false,
        sceneModePicker:      false,
        navigationHelpButton: false,
        animation:            false,
        timeline:             false,
        fullscreenButton:     false,
        infoBox:              false,
        selectionIndicator:   false,
        creditContainer:      document.createElement("div"),
      });

      // Remove any default imagery layers (Bing / Ion defaults).
      viewer.imageryLayers.removeAll();

      // Add NaturalEarthII — ships with the Cesium package, served from
      // public/cesium/Assets/Textures/NaturalEarthII, no CORS issues.
      try {
        const imagery = await C.TileMapServiceImageryProvider.fromUrl(
          C.buildModuleUrl("Assets/Textures/NaturalEarthII"),
        );
        if (!destroyed) viewer.imageryLayers.addImageryProvider(imagery);
      } catch (e) {
        console.error("NaturalEarthII imagery failed to load:", e);
      }

      viewer.scene.skyAtmosphere.show   = true;
      viewer.scene.fog.enabled          = false;
      viewer.scene.globe.enableLighting = false;

      // Allow zooming all the way in (100 m) and out (well past the globe).
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 3e7;

      // Force the viewer to fill whatever size the container currently is.
      viewer.resize();

      // Initial camera
      const { lat, lon, zoom } = useViewStore.getState();
      viewer.camera.setView({
        destination: C.Cartesian3.fromDegrees(lon, lat, zoomToHeight(zoom)),
      });

      // ------------------------------------------------------------------ //
      // Markers                                                              //
      // ------------------------------------------------------------------ //

      // Observer marker — always visible at current position.
      viewer.entities.add({
        id: "observer",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        position: new C.CallbackProperty(() => {
          const s = useViewStore.getState();
          return C.Cartesian3.fromDegrees(s.lon, s.lat, 0);
        }, false),
        point: {
          pixelSize:                14,
          color:                    C.Color.fromCssColorString("#6366f1"),
          outlineColor:             C.Color.WHITE,
          outlineWidth:             2,
          // HeightReference.NONE — we have no terrain provider; CLAMP_TO_GROUND
          // can mis-place points when there is no terrain loaded.
          heightReference:          C.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // Target marker — hidden by default. Use point.show (graphics-level) rather
      // than entity.show so the position callback never has to emit (0,0,0) —
      // Cartesian3 world-space origin is the literal centre of the Earth and
      // renders as a phantom dot inside the globe.
      viewer.entities.add({
        id: "target",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        position: new C.CallbackProperty(() => {
          const { targetLat, targetLon } = useViewStore.getState();
          // Only called when show is true; guard anyway.
          if (targetLat === null || targetLon === null) return undefined;
          return C.Cartesian3.fromDegrees(targetLon, targetLat, 0);
        }, false),
        point: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          show: new C.CallbackProperty(() => {
            const { targetLat, targetLon } = useViewStore.getState();
            return targetLat !== null && targetLon !== null;
          }, false),
          pixelSize:                12,
          color:                    C.Color.fromCssColorString("#f43f5e"),
          outlineColor:             C.Color.WHITE,
          outlineWidth:             2,
          heightReference:          C.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // ------------------------------------------------------------------ //
      // globeAPI — keyboard / chord / palette controls                       //
      // ------------------------------------------------------------------ //

      globeAPI.register({
        move: (lat, lon, zoom) => {
          if (viewer.isDestroyed()) return;
          viewer.camera.setView({
            destination: C.Cartesian3.fromDegrees(lon, lat, zoomToHeight(zoom)),
            orientation: {
              heading: viewer.camera.heading,
              pitch:   viewer.camera.pitch,
              roll:    0,
            },
          });
        },

        flyTo: (lat, lon, zoom, durationMs = 800) => {
          if (viewer.isDestroyed()) return;
          viewer.camera.flyTo({
            destination: C.Cartesian3.fromDegrees(lon, lat, zoomToHeight(zoom)),
            duration:    durationMs / 1000,
          });
        },

        rotate: (delta) => {
          if (viewer.isDestroyed()) return;
          viewer.camera.setView({
            destination:  viewer.camera.position.clone(),
            orientation: {
              heading: viewer.camera.heading + C.Math.toRadians(delta),
              pitch:   viewer.camera.pitch,
              roll:    viewer.camera.roll,
            },
          });
        },
      });

      // ------------------------------------------------------------------ //
      // Camera → store sync                                                  //
      // ------------------------------------------------------------------ //

      viewer.camera.percentageChanged = 0.005;
      viewer.camera.changed.addEventListener(() => {
        if (viewer.isDestroyed()) return;
        const carto = viewer.camera.positionCartographic;
        useViewStore.getState().setPosition(
          C.Math.toDegrees(carto.latitude),
          C.Math.toDegrees(carto.longitude),
        );
        useViewStore.getState().setZoom(heightToZoom(carto.height));
      });

      // ------------------------------------------------------------------ //
      // Click → fly + set observer marker                                    //
      // ------------------------------------------------------------------ //

      const handler = new C.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((e: { position: unknown }) => {
        const ray = viewer.camera.getPickRay(e.position);
        if (!ray) return;
        const hit = viewer.scene.globe.pick(ray, viewer.scene);
        if (!hit) return;
        const carto    = C.Cartographic.fromCartesian(hit);
        const clickLat = C.Math.toDegrees(carto.latitude);
        const clickLon = C.Math.toDegrees(carto.longitude);
        const zoom     = useViewStore.getState().zoom;
        globeAPI.flyTo(clickLat, clickLon, zoom);
        useViewStore.getState().setPosition(clickLat, clickLon);
      }, C.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (viewer as any)._inputHandler = handler;
    }).catch((err) => {
      console.error("Failed to load CesiumJS:", err);
    });

    return () => {
      destroyed = true;
      link.remove();
      const v = viewerRef.current;
      if (v && !v.isDestroyed()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (v as any)._inputHandler?.destroy();
        v.destroy();
      }
      viewerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0 bg-black" />;
}
