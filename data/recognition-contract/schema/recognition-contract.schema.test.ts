import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

type Validator = (value: unknown) => boolean;
type AjvConstructor = new (options?: Record<string, unknown>) => {
  compile(schema: unknown): Validator;
};

const requireFromRecognitionFunction = createRequire(
  new URL(
    "../../../services/cloudbase/functions/recognize-board/index.js",
    import.meta.url,
  ),
);
const Ajv2020 = requireFromRecognitionFunction(
  "ajv/dist/2020",
).default as AjvConstructor;
const contractSchema = JSON.parse(
  readFileSync(new URL("./recognition-contract.schema.json", import.meta.url), "utf8"),
) as {
  readonly $schema?: string;
  readonly $id?: string;
  readonly $defs?: {
    readonly request?: Record<string, unknown>;
  };
};

describe("recognition contract request schema", () => {
  it("accepts camera input and rejects album input", () => {
    const requestDefinition = contractSchema.$defs?.request;
    expect(requestDefinition).toBeDefined();
    const validate = new Ajv2020({ strict: true }).compile({
      $schema: contractSchema.$schema,
      $id: "https://ichi.example/schema/recognition-contract-request/1.0.0",
      ...requestDefinition,
    });
    const request = {
      requestId: "request-camera-only",
      imageRef: "ephemeral:recognition-camera-only",
      image: {
        mediaType: "image/jpeg",
        width: 1080,
        height: 1440,
        acquisition: "camera",
      },
      localeHints: ["zh-CN"],
    };

    expect(validate(request)).toBe(true);
    expect(
      validate({
        ...request,
        image: { ...request.image, acquisition: "album" },
      }),
    ).toBe(false);
  });
});
