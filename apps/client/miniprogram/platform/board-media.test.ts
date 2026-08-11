import { describe, expect, it } from "vitest";

import {
  chooseBoardImage,
  classifyBoardMediaFailure,
  type BoardMediaApi,
} from "./board-media.js";

describe("WeChat board media adapter", () => {
  it("requests one original image from camera or album", async () => {
    let receivedOptions:
      Parameters<BoardMediaApi["chooseMedia"]>[0] | undefined;
    const api: BoardMediaApi = {
      chooseMedia(options) {
        receivedOptions = options;
        options.success({
          tempFiles: [{ tempFilePath: "/tmp/board.jpg", size: 1234 }],
        });
      },
    };

    await expect(chooseBoardImage(api)).resolves.toEqual({
      status: "selected",
      file: { tempFilePath: "/tmp/board.jpg", size: 1234 },
    });
    expect(receivedOptions).toMatchObject({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      sizeType: ["original"],
    });
  });

  it("keeps cancellation, permission denial and generic failures distinct", () => {
    expect(
      classifyBoardMediaFailure({ errMsg: "chooseMedia:fail cancel" }),
    ).toEqual({ status: "cancelled" });
    expect(
      classifyBoardMediaFailure({ errMsg: "chooseMedia:fail auth deny" }),
    ).toEqual({ status: "denied" });
    expect(
      classifyBoardMediaFailure({ errMsg: "chooseMedia:fail system error" }),
    ).toEqual({
      status: "failed",
      detail: "chooseMedia:fail system error",
    });
  });

  it("fails safely when WeChat returns no selected file", async () => {
    const api: BoardMediaApi = {
      chooseMedia(options) {
        options.success({ tempFiles: [] });
      },
    };

    await expect(chooseBoardImage(api)).resolves.toEqual({
      status: "failed",
      detail: "chooseMedia:fail empty tempFiles",
    });
  });
});
