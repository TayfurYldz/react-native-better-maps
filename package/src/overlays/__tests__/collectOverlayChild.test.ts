import { createElement } from 'react';
import { describe, expect, test } from 'bun:test';
import { Polygon } from '../../components/Polygon';
import type { OverlayCollectorState } from '../overlayCollect';

import { collectOverlayChild } from '../collectOverlayChild';

const dependencies = { resolveMarkerImage: () => undefined };

function createState(): OverlayCollectorState {
  return {
    registry: new Map(),
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
}

describe('collectOverlayChild', () => {
  test('skips an invalid polygon without dropping a valid sibling', () => {
    const state = createState();
    const validCoordinates = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 1, longitude: 1 },
    ];

    collectOverlayChild(
      createElement(Polygon, { id: 'bad', coordinates: [] }),
      state,
      dependencies,
    );
    collectOverlayChild(
      createElement(Polygon, { id: 'good', coordinates: validCoordinates }),
      state,
      dependencies,
    );

    expect(state.polygons).toHaveLength(1);
    expect(state.polygons[0]?.id).toBe('good');
    expect(state.registry.has('polygon:bad')).toBe(false);
  });
});
