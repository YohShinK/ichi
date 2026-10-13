import { describe, expect, it } from "vitest";
import {
  createMarkerRenderKey,
  drawMarkerCanvas,
  type MarkerCanvasRenderInput,
} from "./marker-canvas-renderer.js";

const input: MarkerCanvasRenderInput = {
  kind: "LEAD",
  countLabel: "8",
  title: "雪未来",
  statusLabel: "仅上传",
  statusTone: "default",
  selected: false,
  clusterCount: 1,
};
const render = (value: MarkerCanvasRenderInput) => {
  const text: { label: string; x: number; y: number; maxWidth: number }[] = [];
  const boxes: { color: string; left: number; right: number; top: number }[] =
    [];
  let left = 0,
    right = 0,
    top = 0;
  const target = {
    font: "",
    fillStyle: "",
    measureText(s: string) {
      return {
        width:
          [...s].reduce(
            (w, ch) => w + ((ch.codePointAt(0) ?? 0) <= 127 ? 4.5 : 9),
            0,
          ) *
          (parseFloat(this.font.match(/([\d.]+)px/)?.[1] ?? "9") / 9),
      };
    },
    beginPath() {
      left = Infinity;
      right = -Infinity;
    },
    moveTo(x: number, y: number) {
      left = x - 4;
      top = y;
    },
    lineTo(x: number) {
      right = Math.max(right, x);
    },
    quadraticCurveTo(x: number) {
      right = Math.max(right, x);
    },
    fill() {
      if (
        ["#f1f3f5", "#fffbeb", "#ffeaf4", "#f0fdf4", "#eff6ff"].includes(
          this.fillStyle,
        )
      )
        boxes.push({ color: this.fillStyle, left, right, top });
    },
    fillText(label: string, x: number, y: number, maxWidth: number) {
      text.push({ label, x, y, maxWidth });
    },
  };
  const c = new Proxy(target, {
    get: (t, p) => Reflect.get(t, p) ?? (() => undefined),
  });
  drawMarkerCanvas(
    c as unknown as Parameters<typeof drawMarkerCanvas>[0],
    value,
  );
  return { text, boxes };
};

describe("content-sized status tags and picker information", () => {
  it.each(["LEAD", "CLUSTER"] as const)(
    "fits %s map tags to the rendered text instead of full title width",
    (kind) => {
      const short = render({ ...input, kind, clusterCount: 3 }).boxes[0]!;
      const long = render({
        ...input,
        kind,
        statusLabel: "低机会信息",
        statusTone: "low",
        clusterCount: 3,
      }).boxes[0]!;
      expect(short.right - short.left).toBe(35);
      expect(long.right - long.left).toBe(53);
      expect(short.right - short.left).toBeLessThan(long.right - long.left);
    },
  );

  it("places every fitting tag after the title at its baseline, with note and upload time on the second line", () => {
    const r = render({
      ...input,
      surface: "PICKER",
      pickerWidth: 308,
      statusTags: [
        { label: "仅上传", tone: "default" },
        { label: "低机会信息", tone: "low" },
      ],
      pickerNotePreview: "测试备注",
      pickerUploadedAtLabel: "上传 10/03 17:55",
    });
    const title = r.text.find((t) => t.label === "雪未来")!;
    const tags = r.text.filter((t) =>
      ["仅上传", "低机会信息"].includes(t.label),
    );
    expect(tags).toHaveLength(2);
    expect(tags.every((t) => t.y === title.y && t.x > title.x)).toBe(true);
    expect(r.boxes.map((b) => b.right - b.left)).toEqual([35, 53]);
    expect(
      r.text
        .filter((t) => t.y === 48)
        .map((t) => t.label)
        .sort(),
    ).toEqual(["上传 10/03 17:55", "测试备注"].sort());
  });

  it("shows overflow explicitly and stays within a narrow row, including adaptive picker input", () => {
    const r = render({
      ...input,
      surface: "PICKER",
      pickerWidth: 210,
      detailLevel: 0,
      title: "雪未来主题非常长的版面名称",
      statusTags: [
        { label: "LAST 机会大赏存量足", tone: "last" },
        { label: "大赏占比高", tone: "grand" },
      ],
      pickerNotePreview: "很长的安全备注需要在此处截断",
      pickerUploadedAtLabel: "上传 10/03 17:55",
    });
    expect(r.text.some((t) => t.label.endsWith("…"))).toBe(true);
    expect(r.text.every((t) => t.x >= 52 && t.x + t.maxWidth <= 196.1)).toBe(
      true,
    );
    expect(r.boxes.every((b) => b.right <= 196.1)).toBe(true);
  });

  it("invalidates only picker artwork when public note or upload time changes", () => {
    const base = {
      ...input,
      surface: "PICKER" as const,
      pickerNotePreview: "测试",
      pickerUploadedAtLabel: "上传 10/03 17:55",
    };
    expect(
      createMarkerRenderKey({ ...base, pickerNotePreview: "更新备注" }),
    ).not.toBe(createMarkerRenderKey(base));
    expect(
      createMarkerRenderKey({
        ...base,
        pickerUploadedAtLabel: "上传 10/04 17:55",
      }),
    ).not.toBe(createMarkerRenderKey(base));
    expect(createMarkerRenderKey({ ...input, pickerNotePreview: "测试" })).toBe(
      createMarkerRenderKey(input),
    );
  });
});
