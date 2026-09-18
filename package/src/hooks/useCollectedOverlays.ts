import { Children, isValidElement, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactElement, ReactNode } from 'react';
import type {
  CircleDescriptor,
  MarkerDescriptor,
  PolygonDescriptor,
  PolylineDescriptor,
} from '../native/specs/overlays';
import type { GeojsonProps } from '../types/geojson';
import type {
  CircleProps,
  MarkerProps,
  PolygonProps,
  PolylineProps,
} from '../types/overlays';
import { Circle } from '../components/Circle';
import { Geojson } from '../components/Geojson';
import { Marker } from '../components/Marker';
import { Polygon } from '../components/Polygon';
import { Polyline } from '../components/Polyline';
import { collectGeojsonOverlays } from '../overlays/collectGeojsonOverlays';
import { collectMarkerOverlay } from '../overlays/collectMarkerOverlay';
import {
  resolveOverlayId,
  tappableFromPress,
  type OverlayCallbacks,
  type OverlayCollectorState,
} from '../overlays/overlayCollect';
import type {
  OverlayComponentType,
  OverlayTypeName,
} from '../overlays/overlayType';
import { OverlayType, overlayCallbackKey } from '../overlays/overlayType';
import { resolveMarkerImage } from '../overlays/resolveMarkerImage';

export interface CollectedOverlays {
  markers: MarkerDescriptor[];
  polylines: PolylineDescriptor[];
  polygons: PolygonDescriptor[];
  circles: CircleDescriptor[];
  callbackRegistry: MutableRefObject<Map<string, OverlayCallbacks>>;
  hasMarkerPress: boolean;
  hasMarkerDragEnd: boolean;
  hasPolylinePress: boolean;
  hasPolygonPress: boolean;
  hasCirclePress: boolean;
}

function isOverlayChild(
  child: ReactElement,
  overlayType: OverlayTypeName,
  component: unknown,
): boolean {
  if (typeof child.type === 'function' || typeof child.type === 'object') {
    const childType = child.type as OverlayComponentType;
    if (childType.overlayType === overlayType) {
      return true;
    }
  }

  return child.type === component;
}

interface OverlayCollector {
  overlayType: OverlayTypeName;
  component: unknown;
  collect: (child: ReactElement, state: OverlayCollectorState) => void;
}

const overlayCollectors: OverlayCollector[] = [
  {
    overlayType: OverlayType.Marker,
    component: Marker,
    collect: (child, state) => {
      collectMarkerOverlay(
        child.props as MarkerProps,
        state,
        resolveMarkerImage,
      );
    },
  },
  {
    overlayType: OverlayType.Polyline,
    component: Polyline,
    collect: (child, state) => {
      const props = child.props as PolylineProps;
      const id = resolveOverlayId(props.id, 'polyline', state.polylineIndex);
      state.polylineIndex += 1;

      state.polylines.push({
        id,
        coordinates: props.coordinates,
        strokeColor: props.strokeColor,
        strokeWidth: props.strokeWidth,
        tappable: tappableFromPress(props.onPress, props.tappable),
      });
      state.registry.set(overlayCallbackKey(OverlayType.Polyline, id), {
        onPress: props.onPress,
      });
      if (props.onPress != null) {
        state.hasPolylinePress = true;
      }
    },
  },
  {
    overlayType: OverlayType.Polygon,
    component: Polygon,
    collect: (child, state) => {
      const props = child.props as PolygonProps;
      const id = resolveOverlayId(props.id, 'polygon', state.polygonIndex);
      state.polygonIndex += 1;

      state.polygons.push({
        id,
        coordinates: props.coordinates,
        fillColor: props.fillColor,
        strokeColor: props.strokeColor,
        strokeWidth: props.strokeWidth,
        tappable: tappableFromPress(props.onPress, props.tappable),
      });
      state.registry.set(overlayCallbackKey(OverlayType.Polygon, id), {
        onPress: props.onPress,
      });
      if (props.onPress != null) {
        state.hasPolygonPress = true;
      }
    },
  },
  {
    overlayType: OverlayType.Circle,
    component: Circle,
    collect: (child, state) => {
      const props = child.props as CircleProps;
      const id = resolveOverlayId(props.id, 'circle', state.circleIndex);
      state.circleIndex += 1;

      state.circles.push({
        id,
        center: props.center,
        radius: props.radius,
        fillColor: props.fillColor,
        strokeColor: props.strokeColor,
        strokeWidth: props.strokeWidth,
        tappable: tappableFromPress(props.onPress, props.tappable),
      });
      state.registry.set(overlayCallbackKey(OverlayType.Circle, id), {
        onPress: props.onPress,
      });
      if (props.onPress != null) {
        state.hasCirclePress = true;
      }
    },
  },
  {
    overlayType: OverlayType.Geojson,
    component: Geojson,
    collect: (child, state) => {
      collectGeojsonOverlays(child.props as GeojsonProps, state);
    },
  },
];

export function useCollectedOverlays(children: ReactNode): CollectedOverlays {
  const callbackRegistry = useRef(new Map<string, OverlayCallbacks>());

  const overlays = useMemo(() => {
    const state: OverlayCollectorState = {
      registry: new Map<string, OverlayCallbacks>(),
      markers: [],
      polylines: [],
      polygons: [],
      circles: [],
      markerIndex: 0,
      polylineIndex: 0,
      polygonIndex: 0,
      circleIndex: 0,
      geojsonIndex: 0,
      hasMarkerPress: false,
      hasMarkerDragEnd: false,
      hasPolylinePress: false,
      hasPolygonPress: false,
      hasCirclePress: false,
    };

    Children.forEach(children, (child) => {
      if (!isValidElement(child)) {
        return;
      }

      for (const collector of overlayCollectors) {
        if (
          !isOverlayChild(child, collector.overlayType, collector.component)
        ) {
          continue;
        }

        collector.collect(child, state);
        break;
      }
    });

    callbackRegistry.current = state.registry;

    return {
      markers: state.markers,
      polylines: state.polylines,
      polygons: state.polygons,
      circles: state.circles,
      hasMarkerPress: state.hasMarkerPress,
      hasMarkerDragEnd: state.hasMarkerDragEnd,
      hasPolylinePress: state.hasPolylinePress,
      hasPolygonPress: state.hasPolygonPress,
      hasCirclePress: state.hasCirclePress,
    };
  }, [children]);

  return {
    ...overlays,
    callbackRegistry,
  };
}
