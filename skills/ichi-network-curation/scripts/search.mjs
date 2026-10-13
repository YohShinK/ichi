// Executed through `ego-browser nodejs`; public search results only.
const fs = await import("node:fs/promises");
const config = JSON.parse(
  await fs.readFile(process.env.ICHI_COLLECTION_CONFIG, "utf8"),
);
if (
  !Number.isInteger(config.taskSpaceId) ||
  !/^p[0-9]+$/.test(config.pageLabel) ||
  !config.root?.startsWith("/")
)
  throw Error("EXPLICIT_CAPTURE_CONFIG_REQUIRED");
const root = config.root;
const preserveControlStop = (error) => {
  if (
    error.executionStopped ||
    error.mayHaveLateEffects ||
    /TaskSpace|TASK_SPACE|delegated|unassigned|inactive|user.*control|control.*user|permission prompt/i.test(
      String(error.message),
    )
  )
    throw error;
};
const task = await taskSpace(config.taskSpaceId);
const page = task.page(config.pageLabel);
const maxScroll = Math.min(6, Math.max(1, config.maxScroll ?? 1));
const queries = config.queries;
if (
  !Array.isArray(queries) ||
  queries.length > 50 ||
  queries.some((q) => !Number.isInteger(q.number) || q.number < 1 || !q.query)
)
  throw Error("INVALID_SEARCH_QUEUE");
await fs.mkdir(root + "/search", { recursive: true });
for (const { number, query, sort = "最新" } of queries) {
  if (!["最新", "综合"].includes(sort))
    throw Error("UNSUPPORTED_PUBLIC_SEARCH_SORT");
  const output =
    root + "/search/search-" + String(number).padStart(3, "0") + ".json";
  try {
    await fs.access(output);
    console.log({ number, status: "EXISTING_CAPTURE_PRESERVED" });
    continue;
  } catch {}
  let navigationRecovery = null;
  const matchesSearch = (url) => {
    const parsed = new URL(url);
    return (
      parsed.origin === "https://www.xiaohongshu.com" &&
      /^\/search_result\/?$/.test(parsed.pathname) &&
      parsed.searchParams.get("keyword") === query
    );
  };
  if (!matchesSearch(await page.url())) {
    try {
      await page.goto(
        "https://www.xiaohongshu.com/search_result?keyword=" +
          encodeURIComponent(query) +
          "&source=web_explore_feed",
        { waitUntil: "domcontentloaded", timeout: 15000 },
      );
    } catch (error) {
      preserveControlStop(error);
      if (
        !/PageNavigationTimeout|page.goto timed out/.test(String(error)) ||
        !matchesSearch(await page.url())
      )
        throw error;
      navigationRecovery = "COMMITTED_URL_WAIT_FOR_PUBLIC_SEARCH_STATE";
    }
  } else navigationRecovery = "RESUMED_EXISTING_MATCHING_SEARCH_PAGE";
  await page.cdp("Emulation.setDeviceMetricsOverride", {
    width: 1100,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await page.waitForFunction(
    () =>
      (window.__INITIAL_STATE__?.search?.state?.value ??
        window.__INITIAL_STATE__?.search?.state) === "success",
    undefined,
    { timeout: 15000 },
  );
  for (const text of [sort, "一周内"]) {
    await page.evaluate(() => {
      if (!document.querySelector(".tags"))
        document.querySelector(".filter")?.click();
    });
    await page.waitForFunction(
      (text) =>
        [...document.querySelectorAll(".tags")].some(
          (x) => x.textContent === text,
        ),
      text,
      { timeout: 3000 },
    );
    const alreadySelected = await page.evaluate(
      (text) =>
        [...document.querySelectorAll(".tags.active")].some(
          (x) => x.textContent === text,
        ),
      text,
    );
    if (alreadySelected) continue;
    const before = await page.evaluate(() =>
      [...document.querySelectorAll(".note-item a.cover")]
        .map((x) => x.href)
        .join("|"),
    );
    await page.evaluate(
      (text) =>
        [...document.querySelectorAll(".tags")]
          .find((x) => x.textContent === text)
          .click(),
      text,
    );
    try {
      await page.waitForFunction(
        (before) =>
          (window.__INITIAL_STATE__?.search?.state?.value ??
            window.__INITIAL_STATE__?.search?.state) === "success" &&
          [...document.querySelectorAll(".note-item a.cover")]
            .map((x) => x.href)
            .join("|") !== before,
        before,
        { timeout: 15000 },
      );
    } catch (error) {
      preserveControlStop(error);
      await page.waitForFunction(
        () =>
          (window.__INITIAL_STATE__?.search?.state?.value ??
            window.__INITIAL_STATE__?.search?.state) === "success",
        undefined,
        { timeout: 15000 },
      );
    }
  }
  const selected = await page.evaluate(() => ({
    labels: [...document.querySelectorAll(".tags.active")].map(
      (x) => x.textContent,
    ),
    vector:
      window.__INITIAL_STATE__.search.activeFilters.value ??
      window.__INITIAL_STATE__.search.activeFilters,
  }));
  if (!selected.labels.includes(sort) || !selected.labels.includes("一周内"))
    throw Error("FILTER_NOT_VERIFIED");
  await page.evaluate(() => {
    if (document.querySelector(".tags"))
      document.querySelector(".filter").click();
  });
  const rows = new Map(),
    coverage = [];
  for (let scroll = 0; scroll < maxScroll; scroll++) {
    const result = await page.evaluate(() => ({
      hasMore:
        window.__INITIAL_STATE__.search.hasMore.value ??
        window.__INITIAL_STATE__.search.hasMore,
      rows: [...document.querySelectorAll(".note-item")]
        .map((x) => ({
          text: x.innerText,
          href: x.querySelector("a.cover")?.href,
          image: x.querySelector("img")?.currentSrc,
          publicAuthorUrl: x.querySelector('a[href*="/user/profile/"]')?.href,
        }))
        .filter((x) => x.href),
    }));
    for (const row of result.rows)
      rows.set(row.href.match(/\/([a-f0-9]{24})/)?.[1], row);
    coverage.push({
      scroll,
      loadedRows: result.rows.length,
      uniqueRows: rows.size,
      hasMore: result.hasMore,
    });
    if (!result.hasMore || scroll === maxScroll - 1) break;
    await page.mouse.move(700, 700, { label: "继续查看版面搜索结果" });
    await page.mouse.wheel(0, 1900, { label: "滚动核对更多版面帖子" });
    try {
      await page.waitForFunction(
        (count) =>
          document.querySelectorAll(".note-item").length > count ||
          (window.__INITIAL_STATE__.search.hasMore.value ??
            window.__INITIAL_STATE__.search.hasMore) === false,
        result.rows.length,
        { timeout: 12000 },
      );
    } catch (error) {
      preserveControlStop(error);
    }
  }
  const data = {
    query,
    navigationRecovery,
    capturedAt: new Date().toISOString(),
    url: await page.url(),
    filters: selected,
    coverage,
    coverageStatus: coverage.at(-1).hasMore
      ? "PARTIAL_SCROLL_COVERAGE"
      : "PLATFORM_HAS_MORE_FALSE",
    rows: [...rows.values()],
  };
  await fs.writeFile(output, JSON.stringify(data, null, 2));
  console.log({
    number,
    query,
    rows: rows.size,
    filters: selected.labels,
    coverage: data.coverageStatus,
    leads: data.rows
      .filter((x) => /版面|余量|残票|赏况|现板|新开|补板/.test(x.text))
      .map((x) => ({ id: x.href.match(/\/([a-f0-9]{24})/)?.[1], text: x.text }))
      .slice(0, 10),
  });
}
