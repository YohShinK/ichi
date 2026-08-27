import { describe, expect, it } from "vitest";

import {
  toR2MapBoardProjection,
  toR2PublicAuthorProjection,
} from "./board-record-r2.js";

describe("R2 formal board record projection", () => {
  it("feeds a future map from confirmed structured fields only", () => {
    const snapshot = {
      schemaVersion: "board-record-r2-1.0.0" as const,
      recognitionVersion: "R2" as const,
      ipName: "世界之外",
      themeName: "此间即无间",
      pricePerDraw: 65,
      currency: "CNY" as const,
      tiers: [
        {
          tierCode: "A",
          rawLabel: "A賞",
          remainingTickets: 2,
          isGrandPrize: true,
        },
      ],
    };
    const projection = toR2MapBoardProjection({
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      boardId: "board-r2",
      recordId: "record-r2",
      ownerAccountId: "account-stable-owner",
      location: {
        latitude: 31.23,
        longitude: 121.47,
        accuracy: 12,
        coordinateSystem: "gcj02",
      },
      createdAt: "2026-08-27T03:32:00.000Z",
      updatedAt: "2026-08-27T03:33:00.000Z",
      verificationStatus: "APPROVED",
      userNote: "入口右侧，A赏刚抽走一张",
      initialSnapshot: snapshot,
    });

    expect(projection).toMatchObject({
      ipName: "世界之外",
      themeName: "此间即无间",
      pricePerDraw: 65,
      tiers: [{ tierCode: "A", remainingTickets: 2, isGrandPrize: true }],
      userNote: "入口右侧，A赏刚抽走一张",
      ownerAccountId: "account-stable-owner",
    });
    expect(JSON.stringify(projection)).not.toMatch(
      /visibleNumberRuns|provider|totalTickets|pastedTickets/u,
    );
  });

  it("projects only nickname and avatar from the separate profile document", () => {
    expect(
      toR2PublicAuthorProjection({
        nickname: "  ICHI 玩家  ",
        avatarUrl: "https://example.test/avatar.jpg",
        accountEmail: "must-not-leak",
      } as unknown as Parameters<typeof toR2PublicAuthorProjection>[0]),
    ).toEqual({
      nickname: "ICHI 玩家",
      avatarUrl: "https://example.test/avatar.jpg",
    });
  });
});
