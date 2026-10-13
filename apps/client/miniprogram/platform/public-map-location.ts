import type { NativeMapMarkerBinding } from "./public-map-native-presentation.js";

export const HIGH_ACCURACY_LOCATION_OPTIONS = {
  type: "gcj02" as const,
  isHighAccuracy: true as const,
  highAccuracyExpireTime: 8000,
};
export const CURRENT_LOCATION_PRECISE_ACCURACY_METERS = 100;
export const CURRENT_LOCATION_MARKER_ID = 2_000_000_001;
export const CURRENT_LOCATION_REFRESH_MS = 60_000;

export interface CurrentMapLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number | null;
  readonly approximate: boolean;
  readonly obtainedAt: number;
}

export interface MapLocationApi {
  getLocation(
    options: typeof HIGH_ACCURACY_LOCATION_OPTIONS & {
      success(result: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      }): void;
      fail(error: unknown): void;
    },
  ): void;
}

export const requestCurrentMapLocation = (
  api: MapLocationApi,
  options: { readonly reducedAccuracy?: boolean } = {},
): Promise<CurrentMapLocation> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("LOCATION_TIMEOUT")),
      HIGH_ACCURACY_LOCATION_OPTIONS.highAccuracyExpireTime + 4000,
    );
    const fail = (error: unknown) => {
      clearTimeout(timer);
      reject(error);
    };
    try {
      api.getLocation({
        ...HIGH_ACCURACY_LOCATION_OPTIONS,
        success(result) {
          clearTimeout(timer);
          if (
            !Number.isFinite(result.latitude) ||
            Math.abs(result.latitude) > 90 ||
            !Number.isFinite(result.longitude) ||
            Math.abs(result.longitude) > 180
          ) {
            fail(new Error("LOCATION_INVALID"));
            return;
          }
          const accuracy =
            typeof result.accuracy !== "number" ||
            !Number.isFinite(result.accuracy) ||
            result.accuracy <= 0
              ? null
              : result.accuracy;
          resolve({
            latitude: result.latitude,
            longitude: result.longitude,
            accuracy,
            approximate:
              options.reducedAccuracy === true ||
              accuracy === null ||
              accuracy > CURRENT_LOCATION_PRECISE_ACCURACY_METERS,
            obtainedAt: Date.now(),
          });
        },
        fail,
      });
    } catch (error) {
      fail(error);
    }
  });

export interface CurrentMapLocationCircle {
  readonly latitude: number;
  readonly longitude: number;
  readonly radius: number;
  readonly color: string;
  readonly fillColor: string;
  readonly strokeWidth: number;
}

/** Show only the provider's known uncertainty; never invent a precise radius. */
export const currentMapLocationCircles = (
  location: CurrentMapLocation | null,
): readonly CurrentMapLocationCircle[] =>
  location?.approximate && location.accuracy !== null
    ? [
        {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: location.accuracy,
          color: "#358FD766",
          fillColor: "#358FD71A",
          strokeWidth: 1,
        },
      ]
    : [];

/** Personal position never enters the public lead count, clustering or DTOs. */
export const withCurrentMapLocation = (
  publicBindings: readonly NativeMapMarkerBinding[],
  location: CurrentMapLocation | null,
): readonly NativeMapMarkerBinding[] =>
  location
    ? [
        ...publicBindings,
        {
          id: CURRENT_LOCATION_MARKER_ID,
          latitude: location.latitude,
          longitude: location.longitude,
          iconPath: "/assets/icons/current-location.png",
          alpha: 1,
          width: 24,
          height: 24,
          anchor: { x: 0.5, y: 0.5 },
          zIndex: 0,
        },
      ]
    : publicBindings;
