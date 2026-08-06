import {
  runStorageSmoke,
  type StorageSmokeAction,
} from "../../platform/storage-smoke.js";

const isSmokeAction = (value: unknown): value is StorageSmokeAction =>
  value === "seed" ||
  value === "restore" ||
  value === "delete" ||
  value === "status";

Page({
  data: {
    storageState: "not_run",
    storageDetail: "使用编译条件参数 action 运行 V1-C Storage 验证",
    capacityState: "unknown",
  },
  onLoad(query: Record<string, string | undefined>) {
    const action = isSmokeAction(query.action) ? query.action : "status";
    const result = runStorageSmoke(action, new Date().toISOString());
    this.setData({
      storageState: result.state,
      storageDetail: result.detail,
      capacityState: result.capacityState,
    });
  },
});
