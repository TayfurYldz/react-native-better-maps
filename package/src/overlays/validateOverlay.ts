import type { Coordinate } from '../types/coordinate';

export function isValidCoordinate(value: Coordinate | undefined): boolean {
  return (
    value != null &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  );
}

export function isValidCoordinateList(
  value: Coordinate[] | undefined,
  minimumLength: number,
): boolean {
  return (
    value != null &&
    value.length >= minimumLength &&
    value.every(isValidCoordinate)
  );
}

export function isValidRadius(value: number | undefined): boolean {
  return value != null && Number.isFinite(value) && value >= 0;
}
