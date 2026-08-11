export type DrawBoardCacheTier = {
  readonly tier: string;
  readonly total: number;
  readonly covered: number;
};

export type DrawBoardCacheRecord = {
  readonly id: string;
  readonly tier: string;
  readonly remaining: number;
  readonly cumulativeCost: string;
  readonly totalSlots: number;
  readonly tierRemaining: number;
  readonly timestamp: number;
};

export type DrawBoardContribution = {
  readonly boardId: string;
  readonly submittedAt: number;
  readonly note: string;
  readonly tiers: readonly DrawBoardCacheTier[];
  readonly records: readonly DrawBoardCacheRecord[];
};

export type DrawBoardCache = {
  readonly boardId?: string;
  readonly tiers: readonly DrawBoardCacheTier[];
  readonly records: readonly DrawBoardCacheRecord[];
  readonly undoStack: readonly DrawBoardCacheRecord[];
  readonly contribution?: DrawBoardContribution | null;
};

const DRAW_BOARD_CACHE_KEY = "ichi:draw-board-cache:v1";

function isCache(value: unknown): value is DrawBoardCache {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DrawBoardCache>;
  return (
    Array.isArray(candidate.tiers) &&
    Array.isArray(candidate.records) &&
    Array.isArray(candidate.undoStack)
  );
}

export function createBoardId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `board-${uuid}` : `board-${Date.now()}-${Math.random()}`;
}

export function loadDrawBoardCache(): DrawBoardCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAW_BOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCache(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDrawBoardCache(cache: DrawBoardCache): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAW_BOARD_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full or restricted session store must not interrupt the draw board.
  }
}
