import { describe, expect, it } from "vitest";

import {
  captureBoardImage,
  calculateVisibleCameraCrop,
  classifyBoardMediaFailure,
  type BoardCameraApi,
} from "./board-media.js";

describe("WeChat board media adapter", () => {
  it("captures through the embedded camera context", async () => {
    let quality = "";
    const api: BoardCameraApi = {
      takePhoto(options) {
        quality = options.quality;
        options.success({ tempImagePath: "/tmp/captured-board.jpg" });
      },
    };

    await expect(captureBoardImage(api)).resolves.toEqual({
      status: "selected",
      file: { tempFilePath: "/tmp/captured-board.jpg", size: 0 },
    });
    expect(quality).toBe("high");
  });

  it("center-crops the captured sensor image to the visible preview", async () => {
    const api: BoardCameraApi = {
      takePhoto(options) {
        options.success({ tempImagePath: "/tmp/sensor.jpg" });
      },
      async cropPhotoToPreview(filePath) {
        expect(filePath).toBe("/tmp/sensor.jpg");
        return "/tmp/visible-frame.jpg";
      },
      async deleteTemporaryFile(filePath) {
        expect(filePath).toBe("/tmp/sensor.jpg");
      },
    };

    await expect(captureBoardImage(api)).resolves.toEqual({
      status: "selected",
      file: { tempFilePath: "/tmp/visible-frame.jpg", size: 0 },
    });
  });

  it("matches aspect-fill camera geometry for portrait and landscape previews", () => {
    expect(calculateVisibleCameraCrop(4032, 3024, 360, 640)).toEqual({
      x: 1165.5,
      y: 0,
      width: 1701,
      height: 3024,
    });
    expect(calculateVisibleCameraCrop(3024, 4032, 640, 360)).toEqual({
      x: 0,
      y: 1165.5,
      width: 3024,
      height: 1701,
    });
  });

  it("fails closed when the visible-frame crop cannot be produced", async () => {
    const api: BoardCameraApi = {
      takePhoto(options) {
        options.success({ tempImagePath: "/tmp/sensor.jpg" });
      },
      async cropPhotoToPreview() {
        throw new Error("camera-crop:missing-preview-or-canvas");
      },
    };

    await expect(captureBoardImage(api)).resolves.toEqual({
      status: "failed",
      detail: "camera-crop:missing-preview-or-canvas",
    });
  });

  it("keeps embedded-camera permission denial distinct", async () => {
    const api: BoardCameraApi = {
      takePhoto(options) {
        options.fail({ errMsg: "takePhoto:fail auth deny" });
      },
    };

    await expect(captureBoardImage(api)).resolves.toEqual({
      status: "denied",
    });
  });

  it("keeps cancellation, permission denial and generic failures distinct", () => {
    expect(
      classifyBoardMediaFailure({ errMsg: "takePhoto:fail cancel" }),
    ).toEqual({ status: "cancelled" });
    expect(
      classifyBoardMediaFailure({ errMsg: "takePhoto:fail auth deny" }),
    ).toEqual({ status: "denied" });
    expect(
      classifyBoardMediaFailure({ errMsg: "takePhoto:fail system error" }),
    ).toEqual({
      status: "failed",
      detail: "takePhoto:fail system error",
    });
  });
});
