import type { PublicMapQuery } from "../../apps/client/miniprogram/platform/public-map-contract.js";
import type { MapLocationState as SyntheticMapLocationState } from "../../apps/client/miniprogram/platform/public-map-discovery.js";

export const createSyntheticUserViewportQuery = (
  query: PublicMapQuery,
): PublicMapQuery => ({
  ...query,
  bbox: {
    west: 121.45,
    south: 31.2,
    east: 121.52,
    north: 31.27,
  },
  zoom: 14,
});

export class SyntheticMapLocationAdapter {
  #nextState: Exclude<SyntheticMapLocationState, "LOADING"> = "READY";

  setNextState(state: Exclude<SyntheticMapLocationState, "LOADING">): void {
    this.#nextState = state;
  }

  async recenter(query: PublicMapQuery): Promise<{
    readonly state: Exclude<SyntheticMapLocationState, "LOADING">;
    readonly query: PublicMapQuery | null;
  }> {
    const state = this.#nextState;
    this.#nextState = "READY";
    await Promise.resolve();
    return {
      state,
      query: state === "READY" ? createSyntheticUserViewportQuery(query) : null,
    };
  }
}
