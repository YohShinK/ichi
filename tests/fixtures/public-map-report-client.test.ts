import { describe, expect, it } from "vitest";

import {
  PublicMapReportClient,
  SYNTHETIC_PUBLIC_MAP_REPORT_CLASSIFICATION,
  SyntheticPublicMapReportService,
  type PublicMapReportCategory,
} from "./public-map-report-client.js";

const createClient = () => {
  const service = new SyntheticPublicMapReportService();
  const client = new PublicMapReportClient(service);
  return { client, service };
};

describe("TASK-V2-16A basic synthetic report flow", () => {
  it("classifies the adapter as non-production evidence", () => {
    expect(SYNTHETIC_PUBLIC_MAP_REPORT_CLASSIFICATION).toBe(
      "NOT_PRODUCTION_EVIDENCE",
    );
  });

  it("starts closed without a selected public lead", () => {
    const { client } = createClient();
    expect(client.state).toMatchObject({ phase: "CLOSED", publicLeadId: null });
  });

  it("opens with a stable default category", () => {
    const { client } = createClient();
    client.open("lead-1");
    expect(client.state).toMatchObject({
      phase: "OPEN",
      publicLeadId: "lead-1",
      category: "STALE_OR_SOLD",
    });
  });

  it.each([
    "STALE_OR_SOLD",
    "WRONG_LOCATION",
    "INAPPROPRIATE_NOTE",
    "OTHER",
  ] as const)("supports the public report category %s", (category) => {
    const { client } = createClient();
    client.open("lead-1");
    client.selectCategory(category);
    expect(client.state.category).toBe(category);
  });

  it("ignores open without a publicLeadId", () => {
    const { client } = createClient();
    client.open("");
    expect(client.state.phase).toBe("CLOSED");
  });

  it("submits a public reason successfully", async () => {
    const { client } = createClient();
    client.open("lead-1");
    client.selectCategory("WRONG_LOCATION");
    await client.submit();
    expect(client.state.phase).toBe("SUCCEEDED");
  });

  it.each([
    ["UNAUTHORIZED", "账号状态需要恢复"],
    ["SERVICE_UNAVAILABLE", "反馈服务暂时不可用"],
    ["INVALID_REQUEST", "有效的反馈原因"],
  ] as const)("presents stable %s recovery copy", async (code, copy) => {
    const { client, service } = createClient();
    service.failNext(code);
    client.open("lead-1");
    await client.submit();
    expect(client.state.phase).toBe("ERROR");
    expect(client.state.errorMessage).toContain(copy);
  });

  it("allows retry after a transient submit failure", async () => {
    const { client, service } = createClient();
    service.failNext("SERVICE_UNAVAILABLE");
    client.open("lead-1");
    await client.submit();
    await client.submit();
    expect(client.state.phase).toBe("SUCCEEDED");
  });

  it("does not close while a submission is in flight", async () => {
    let resolve!: () => void;
    const client = new PublicMapReportClient({
      async submit() {
        await new Promise<void>((done) => {
          resolve = done;
        });
        return { ok: true, duplicate: false };
      },
    });
    client.open("lead-1");
    const pending = client.submit();
    client.close();
    expect(client.state.phase).toBe("SUBMITTING");
    resolve();
    await pending;
  });

  it("closes cleanly after success", async () => {
    const { client } = createClient();
    client.open("lead-1");
    await client.submit();
    client.close();
    expect(client.state).toMatchObject({ phase: "CLOSED", publicLeadId: null });
  });

  it("notifies subscribers across the report lifecycle", async () => {
    const { client } = createClient();
    const phases: string[] = [];
    const unsubscribe = client.subscribe((state) => phases.push(state.phase));
    client.open("lead-1");
    await client.submit();
    unsubscribe();
    expect(phases).toEqual(["CLOSED", "OPEN", "SUBMITTING", "SUCCEEDED"]);
  });

  it("keeps its request surface free of trusted moderation flags", () => {
    const source = SyntheticPublicMapReportService.prototype.submit.toString();
    const forbidden = ["trustState", "moderationStatus", "ownerAccountId"];
    for (const field of forbidden) expect(source).not.toContain(field);
  });

  it("does not allow category changes after success", async () => {
    const { client } = createClient();
    client.open("lead-1");
    await client.submit();
    client.selectCategory("OTHER" as PublicMapReportCategory);
    expect(client.state.category).toBe("STALE_OR_SOLD");
  });
});
