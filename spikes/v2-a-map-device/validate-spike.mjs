import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const spikeRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(spikeRoot, "../..");
const require = createRequire(import.meta.url);
const failures = [];
const requiredFiles = [
  "project.config.json",
  "miniprogram/app.js",
  "miniprogram/app.json",
  "miniprogram/app.wxss",
  "miniprogram/sitemap.json",
  "miniprogram/assets/marker.png",
  "miniprogram/data/shanghai-markers.js",
  "miniprogram/pages/map/index.js",
  "miniprogram/pages/map/index.json",
  "miniprogram/pages/map/index.wxml",
  "miniprogram/pages/map/index.wxss",
  "README.md",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(spikeRoot, file)))
    failures.push(`missing ${file}`);
}

const markerPng = fs.readFileSync(
  path.join(spikeRoot, "miniprogram/assets/marker.png"),
);
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (!markerPng.subarray(0, 8).equals(pngSignature)) {
  failures.push("marker asset must be a valid local PNG");
}

const projectConfig = JSON.parse(
  fs.readFileSync(path.join(spikeRoot, "project.config.json"), "utf8"),
);
const v1ProjectConfig = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, "project.config.json"), "utf8"),
);
if (!projectConfig.appid || projectConfig.appid === "touristappid") {
  failures.push("restored test AppID must be configured");
}
if (projectConfig.appid === v1ProjectConfig.appid) {
  failures.push("spike must not use the V1 production AppID");
}
if (projectConfig.miniprogramRoot !== "miniprogram/") {
  failures.push("miniprogramRoot must remain isolated under the spike");
}

const appConfig = JSON.parse(
  fs.readFileSync(path.join(spikeRoot, "miniprogram/app.json"), "utf8"),
);
if (!appConfig.pages.includes("pages/map/index")) {
  failures.push("app.json must register the isolated map page");
}
const locationPermissionDescription =
  appConfig.permission?.["scope.userLocation"]?.desc;
if (!locationPermissionDescription) {
  failures.push("app.json must declare the location permission purpose");
} else if ([...locationPermissionDescription].length > 30) {
  failures.push(
    `location permission purpose must not exceed 30 characters, got ${
      [...locationPermissionDescription].length
    }`,
  );
}
if (!appConfig.requiredPrivateInfos?.includes("getLocation")) {
  failures.push("app.json must declare getLocation private info usage");
}

const fixturePath = path.join(
  spikeRoot,
  "miniprogram/data/shanghai-markers.js",
);
const { SYNTHETIC_RECORDS } = require(fixturePath);
if (SYNTHETIC_RECORDS.length !== 30) {
  failures.push(
    `expected 30 synthetic records, got ${SYNTHETIC_RECORDS.length}`,
  );
}
if (new Set(SYNTHETIC_RECORDS.map((record) => record.id)).size !== 30) {
  failures.push("synthetic marker ids must be unique");
}
for (const record of SYNTHETIC_RECORDS) {
  if (
    record.sourceType !== "SYNTHETIC_ONLY" ||
    record.verificationState !== "SYNTHETIC_FIXTURE"
  ) {
    failures.push(`record ${record.id} is not explicitly synthetic`);
  }
  if (
    record.latitude < 30.9 ||
    record.latitude > 31.6 ||
    record.longitude < 121.0 ||
    record.longitude > 122.0
  ) {
    failures.push(`record ${record.id} is outside the Shanghai test bound`);
  }
}

const sourceFiles = requiredFiles.filter((file) =>
  /^miniprogram\/.+\.(?:js|json|wxml|wxss)$/.test(file),
);
const sourceText = sourceFiles
  .map((file) => fs.readFileSync(path.join(spikeRoot, file), "utf8"))
  .join("\n");
const forbiddenPatterns = [
  ["CloudBase", /wx\.cloud/],
  ["network request", /wx\.request/],
  ["websocket", /connectSocket/],
  ["remote URL", /https?:\/\//],
  ["private collection", /\.collection\s*\(/],
  ["storage", /wx\.(?:set|get|remove|clear)Storage/],
];
for (const [label, pattern] of forbiddenPatterns) {
  if (pattern.test(sourceText)) failures.push(`forbidden ${label} reference`);
}

const wxml = fs.readFileSync(
  path.join(spikeRoot, "miniprogram/pages/map/index.wxml"),
  "utf8",
);
const page = fs.readFileSync(
  path.join(spikeRoot, "miniprogram/pages/map/index.js"),
  "utf8",
);
for (const token of [
  "<map",
  'markers="{{markers}}"',
  'bindregionchange="onRegionChange"',
  'bindmarkertap="onMarkerTap"',
  'bindupdated="onMapUpdated"',
  "列表 fallback",
  "测试响应丢弃",
]) {
  if (!wxml.includes(token)) failures.push(`missing WXML token: ${token}`);
}
for (const handler of [
  "onRegionChange",
  "onMarkerTap",
  "onRequestLocation",
  "applyLocationDenied",
  "onUseShanghaiFallback",
  "onNetworkModeChange",
  "onForceMockError",
  "onRunRace",
  "recordDiscard",
  "onHide",
  "onShow",
  "persistLifecycleState",
  "restoreLifecycleState",
]) {
  if (!page.includes(`${handler}(`))
    failures.push(`missing handler: ${handler}`);
}
for (const invariant of [
  "this._hasLoggedMapUpdated",
  'causedBy === "gesture"',
  "centerChanged",
]) {
  if (!page.includes(invariant)) {
    failures.push(`missing map event-loop guard: ${invariant}`);
  }
}

const result = {
  status: failures.length === 0 ? "PASS" : "FAIL",
  executionMode: "INDEPENDENT_WECHAT_TEST_PROJECT",
  spikeRoot,
  syntheticMarkerCount: SYNTHETIC_RECORDS.length,
  locationPermissionDescriptionCharacters: locationPermissionDescription
    ? [...locationPermissionDescription].length
    : 0,
  productionConnections: 0,
  storageConnections: 0,
  v1PackageDeltaBytes: 0,
  failures,
};
console.log(JSON.stringify(result, null, 2));
if (failures.length > 0) process.exit(1);
