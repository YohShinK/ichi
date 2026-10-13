import fs from "node:fs";
import { check } from "./store.mjs";

const definitions = JSON.parse(
  fs.readFileSync(new URL("./schemas.json", import.meta.url)),
).$defs;
// This intentionally supports only the subset used by schemas.json. Unknown
// schema keywords fail closed instead of pretending to validate a full dialect.
const keywords = new Set([
  "type",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "minItems",
  "maxItems",
  "minLength",
  "pattern",
  "format",
  "const",
  "enum",
  "minimum",
  "maximum",
]);
const validate = (value, schema) => {
  check(
    Object.keys(schema).every((k) => keywords.has(k)),
    "UNSUPPORTED_SCHEMA_KEYWORD",
  );
  if (schema.type) {
    const actual =
      value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (
      !types.includes(actual) &&
      !(
        actual === "number" &&
        types.includes("integer") &&
        Number.isSafeInteger(value)
      )
    )
      return false;
  }
  if (Object.hasOwn(schema, "const") && value !== schema.const) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (
    typeof value === "string" &&
    ((schema.minLength && value.trim().length < schema.minLength) ||
      (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) ||
      (schema.format === "date-time" &&
        (!Number.isFinite(Date.parse(value)) ||
          new Date(value).toISOString() !== value)))
  )
    return false;
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) ||
      (schema.minimum !== undefined && value < schema.minimum) ||
      (schema.maximum !== undefined && value > schema.maximum))
  )
    return false;
  if (
    Array.isArray(value) &&
    ((schema.minItems && value.length < schema.minItems) ||
      (schema.maxItems !== undefined && value.length > schema.maxItems) ||
      (schema.items && !value.every((v) => validate(v, schema.items))))
  )
    return false;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (schema.required?.some((k) => !Object.hasOwn(value, k))) return false;
    if (
      schema.additionalProperties === false &&
      Object.keys(value).some((k) => !Object.hasOwn(schema.properties ?? {}, k))
    )
      return false;
    for (const [key, field] of Object.entries(schema.properties ?? {}))
      if (Object.hasOwn(value, key) && !validate(value[key], field))
        return false;
  }
  return true;
};
export const validatePacket = (name, value) => {
  check(
    definitions[name] && validate(value, definitions[name]),
    `INVALID_${name.toUpperCase()}_SCHEMA`,
  );
  return value;
};
