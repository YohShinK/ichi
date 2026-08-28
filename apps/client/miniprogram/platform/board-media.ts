export interface BoardMediaFile {
  readonly tempFilePath: string;
  readonly size: number;
}

export interface BoardCameraFailure {
  readonly errMsg?: string;
}

export interface BoardCameraApi {
  takePhoto(options: {
    readonly quality: "high";
    readonly success: (result: { readonly tempImagePath: string }) => void;
    readonly fail: (error: BoardCameraFailure) => void;
  }): void;
  cropPhotoToPreview?(filePath: string): Promise<string>;
  deleteTemporaryFile?(filePath: string): Promise<void>;
}

export interface CameraCropRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface CameraQueryScope {
  createSelectorQuery(): {
    select(selector: string): {
      boundingClientRect(): unknown;
      fields(options: { readonly node: true }): unknown;
    };
    exec(
      callback: (
        results: readonly ({
          readonly width?: number;
          readonly height?: number;
          readonly node?: unknown;
        } | null)[],
      ) => void,
    ): void;
  };
}

const MAX_CAMERA_OUTPUT_LONG_EDGE = 2400;

export const calculateVisibleCameraCrop = (
  sourceWidth: number,
  sourceHeight: number,
  previewWidth: number,
  previewHeight: number,
): CameraCropRect => {
  if (
    ![sourceWidth, sourceHeight, previewWidth, previewHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    throw new Error("camera-crop:invalid-dimensions");
  }
  const sourceAspect = sourceWidth / sourceHeight;
  const previewAspect = previewWidth / previewHeight;
  if (sourceAspect > previewAspect) {
    const width = sourceHeight * previewAspect;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }
  const height = sourceWidth / previewAspect;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
};

const destinationSize = (crop: CameraCropRect) => {
  const scale = Math.min(
    1,
    MAX_CAMERA_OUTPUT_LONG_EDGE / Math.max(crop.width, crop.height),
  );
  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
};

const cropPhotoWithCanvas = async (
  scope: CameraQueryScope,
  previewSelector: string,
  filePath: string,
): Promise<string> => {
  const [preview, canvasResult] = await new Promise<
    readonly [
      { readonly width?: number; readonly height?: number } | null,
      { readonly node?: unknown } | null,
    ]
  >((resolve, reject) => {
    const query = scope.createSelectorQuery();
    query.select(previewSelector).boundingClientRect();
    query.select("#camera-output-canvas").fields({ node: true });
    query.exec((results) => {
      const previewResult = results[0] ?? null;
      const canvasNodeResult = results[1] ?? null;
      if (!previewResult || !canvasNodeResult) {
        reject(new Error("camera-crop:missing-preview-or-canvas"));
        return;
      }
      resolve([previewResult, canvasNodeResult]);
    });
  });
  const previewWidth = Number(preview?.width);
  const previewHeight = Number(preview?.height);
  const canvas = canvasResult?.node as
    | {
        width: number;
        height: number;
        createImage(): {
          src: string;
          onload: (() => void) | null;
          onerror: ((error: unknown) => void) | null;
        };
        getContext(type: "2d"): {
          clearRect(x: number, y: number, width: number, height: number): void;
          drawImage(
            image: unknown,
            sx: number,
            sy: number,
            sourceWidth: number,
            sourceHeight: number,
            dx: number,
            dy: number,
            destinationWidth: number,
            destinationHeight: number,
          ): void;
        };
      }
    | undefined;
  if (!canvas) throw new Error("camera-crop:missing-canvas-node");
  const imageInfo = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success(result) {
          resolve({ width: result.width, height: result.height });
        },
        fail: reject,
      });
    },
  );
  const crop = calculateVisibleCameraCrop(
    imageInfo.width,
    imageInfo.height,
    previewWidth,
    previewHeight,
  );
  const output = destinationSize(crop);
  canvas.width = output.width;
  canvas.height = output.height;
  const context = canvas.getContext("2d");
  const image = canvas.createImage();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      context.clearRect(0, 0, output.width, output.height);
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        output.width,
        output.height,
      );
      resolve();
    };
    image.onerror = reject;
    image.src = filePath;
  });
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({
      canvas: canvas as never,
      fileType: "jpg",
      quality: 0.92,
      destWidth: output.width,
      destHeight: output.height,
      success(result) {
        resolve(result.tempFilePath);
      },
      fail: reject,
    });
  });
};

export type BoardMediaSelection =
  | { readonly status: "selected"; readonly file: BoardMediaFile }
  | { readonly status: "cancelled" }
  | { readonly status: "denied" }
  | { readonly status: "failed"; readonly detail: string };

const includesAny = (value: string, needles: readonly string[]): boolean =>
  needles.some((needle) => value.includes(needle));

export const classifyBoardMediaFailure = (
  error: BoardCameraFailure,
): Exclude<BoardMediaSelection, { readonly status: "selected" }> => {
  const detail = error.errMsg ?? "camera:fail unknown";
  const normalized = detail.toLowerCase();

  if (normalized.includes("cancel")) return { status: "cancelled" };
  if (
    includesAny(normalized, [
      "deny",
      "denied",
      "auth",
      "permission",
      "authorize",
    ])
  ) {
    return { status: "denied" };
  }

  return { status: "failed", detail };
};

export const captureBoardImage = (
  api: BoardCameraApi,
): Promise<BoardMediaSelection> =>
  new Promise((resolve) => {
    api.takePhoto({
      quality: "high",
      success(result) {
        void (async () => {
          try {
            const visiblePath = api.cropPhotoToPreview
              ? await api.cropPhotoToPreview(result.tempImagePath)
              : result.tempImagePath;
            if (
              visiblePath !== result.tempImagePath &&
              api.deleteTemporaryFile
            ) {
              try {
                await api.deleteTemporaryFile(result.tempImagePath);
              } catch {
                // 微信最终仍会回收临时文件，原图清理失败不覆盖裁切结果。
              }
            }
            resolve({
              status: "selected",
              file: { tempFilePath: visiblePath, size: 0 },
            });
          } catch (error) {
            resolve({
              status: "failed",
              detail:
                error instanceof Error
                  ? error.message
                  : "camera-crop:fail unknown",
            });
          }
        })();
      },
      fail(error) {
        resolve(classifyBoardMediaFailure(error));
      },
    });
  });

export const getWxBoardCameraApi = (
  scope?: CameraQueryScope,
  previewSelector = ".camera-preview",
): BoardCameraApi => {
  const context = wx.createCameraContext();
  return {
    takePhoto(options) {
      context.takePhoto({
        quality: options.quality,
        success(result) {
          options.success({ tempImagePath: result.tempImagePath });
        },
        fail(error) {
          options.fail({ errMsg: error.errMsg });
        },
      });
    },
    ...(scope && typeof scope.createSelectorQuery === "function"
      ? {
          cropPhotoToPreview(filePath: string) {
            return cropPhotoWithCanvas(scope, previewSelector, filePath);
          },
          deleteTemporaryFile(filePath: string) {
            return new Promise<void>((resolve, reject) => {
              wx.getFileSystemManager().unlink({
                filePath,
                success: () => resolve(),
                fail: reject,
              });
            });
          },
        }
      : {}),
  };
};
