export interface BoardMediaFile {
  readonly tempFilePath: string;
  readonly size: number;
}

export interface ChooseBoardMediaSuccess {
  readonly tempFiles: readonly BoardMediaFile[];
}

export interface ChooseBoardMediaFailure {
  readonly errMsg?: string;
}

export interface BoardMediaApi {
  chooseMedia(options: {
    readonly count: 1;
    readonly mediaType: readonly ["image"];
    readonly sourceType: readonly ["album", "camera"];
    readonly sizeType: readonly ["original"];
    readonly success: (result: ChooseBoardMediaSuccess) => void;
    readonly fail: (error: ChooseBoardMediaFailure) => void;
  }): void;
}

export type BoardMediaSelection =
  | { readonly status: "selected"; readonly file: BoardMediaFile }
  | { readonly status: "cancelled" }
  | { readonly status: "denied" }
  | { readonly status: "failed"; readonly detail: string };

const includesAny = (value: string, needles: readonly string[]): boolean =>
  needles.some((needle) => value.includes(needle));

export const classifyBoardMediaFailure = (
  error: ChooseBoardMediaFailure,
): Exclude<BoardMediaSelection, { readonly status: "selected" }> => {
  const detail = error.errMsg ?? "chooseMedia:fail unknown";
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

export const chooseBoardImage = (
  api: BoardMediaApi,
): Promise<BoardMediaSelection> =>
  new Promise((resolve) => {
    api.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      sizeType: ["original"],
      success(result) {
        const file = result.tempFiles[0];
        resolve(
          file
            ? { status: "selected", file }
            : {
                status: "failed",
                detail: "chooseMedia:fail empty tempFiles",
              },
        );
      },
      fail(error) {
        resolve(classifyBoardMediaFailure(error));
      },
    });
  });

export const getWxBoardMediaApi = (): BoardMediaApi => ({
  chooseMedia(options) {
    wx.chooseMedia({
      count: options.count,
      mediaType: [...options.mediaType],
      sourceType: [...options.sourceType],
      sizeType: [...options.sizeType],
      success(result) {
        options.success({
          tempFiles: result.tempFiles.map((file) => ({
            tempFilePath: file.tempFilePath,
            size: file.size,
          })),
        });
      },
      fail(error) {
        options.fail({ errMsg: error.errMsg });
      },
    });
  },
});
