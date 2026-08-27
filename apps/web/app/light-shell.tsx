"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { derivePrizeClassification } from "@ichi/board-layout";
import { buildBoardOutlook } from "./board-outlook";
import {
  createBoardId,
  loadDrawBoardCache,
  saveDrawBoardCache,
  type DrawBoardContribution,
} from "./draw-cache";
import { analyzeSituation } from "./situation-reminder";

type View =
  | "start"
  | "resume"
  | "camera-capture"
  | "recognizing"
  | "draft"
  | "draw"
  | "storage"
  | "local-records"
  | "contributions"
  | "deleted"
  | "method"
  | "map-preview"
  | "my"
  | "cannot-build-pool"
  | "undo-protected"
  | "storage-fallback"
  | "schema-incompatible"
  | "storage-warning";

type Tier = { tier: string; total: number; covered: number };
type RecordItem = {
  id: string;
  tier: string;
  remaining: number;
  cumulativeCost: string;
  totalSlots: number;
  tierRemaining: number;
  timestamp: number;
};

const initialTiers: Tier[] = [
  { tier: "A", total: 2, covered: 0 },
  { tier: "B", total: 3, covered: 0 },
  { tier: "C", total: 5, covered: 0 },
  { tier: "D", total: 12, covered: 1 },
  { tier: "E", total: 18, covered: 1 },
  { tier: "F", total: 25, covered: 0 },
];
const drawCost = 650;
const undoLimit = 50;
const targets: string[] = [];

function resolveView(raw: string | null): View {
  if (raw === "source") return "camera-capture";
  if (raw === "confirm") return "draft";
  if (raw === "target") return "draw";
  if (
    [
      "recognition-failed",
      "layout-incomplete",
      "no-solution",
      "last-insufficient",
    ].includes(raw ?? "")
  )
    return "cannot-build-pool";
  const known: readonly View[] = [
    "start",
    "resume",
    "camera-capture",
    "recognizing",
    "draft",
    "draw",
    "storage",
    "local-records",
    "contributions",
    "deleted",
    "method",
    "map-preview",
    "my",
    "cannot-build-pool",
    "undo-protected",
    "storage-fallback",
    "schema-incompatible",
    "storage-warning",
  ];
  return known.includes(raw as View) ? (raw as View) : "start";
}

function yen(value: number): string {
  return `¥${new Intl.NumberFormat("en-US").format(value)}`;
}

function probability(remaining: number, all: number): string {
  return all ? ((remaining / all) * 100).toFixed(3) : "0.000";
}

function Icon({ children }: { children: string }) {
  return (
    <span className="light-icon" aria-hidden="true">
      {children}
    </span>
  );
}

function PageButton({
  children,
  onClick,
  ghost = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <div className={ghost ? "light-button-wrap ghost" : "light-button-wrap"}>
      <button type={type} className="light-action" onClick={onClick}>
        {children}
      </button>
    </div>
  );
}

function Nav({
  view,
  navigate,
}: {
  view: View;
  navigate: (view: View) => void;
}) {
  const active =
    view === "map-preview"
      ? "map"
      : [
            "my",
            "storage",
            "local-records",
            "contributions",
            "method",
            "deleted",
          ].includes(view)
        ? "my"
        : "camera";
  return (
    <nav className="light-bottom-nav" aria-label="主导航">
      <button
        className={active === "camera" ? "active" : ""}
        onClick={() => navigate("camera-capture")}
      >
        <Icon>⌁</Icon>
        <span>识别</span>
      </button>
      <button
        className={active === "map" ? "active" : ""}
        onClick={() => navigate("map-preview")}
      >
        <Icon>◉</Icon>
        <span>地图</span>
      </button>
      <button
        className={active === "my" ? "active" : ""}
        onClick={() => navigate("my")}
      >
        <Icon>⌂</Icon>
        <span>我的</span>
      </button>
    </nav>
  );
}

function BoardCard({
  item,
  remainingTotal,
  justDrawn,
  onDraw,
}: {
  item: Tier;
  remainingTotal: number;
  justDrawn: boolean;
  onDraw: () => void;
}) {
  const remaining = item.total - item.covered;
  const [dragging, setDragging] = useState(false);
  const start = useRef(0);
  const offset = useRef(0);
  const classification = derivePrizeClassification({
    label: item.tier,
    totalSlots: item.total,
  });
  const isGrand = classification?.presentation === "large";
  function up() {
    if (offset.current > 52 && remaining > 0) onDraw();
    setDragging(false);
    offset.current = 0;
  }
  return (
    <article
      className={`source-ticket ${isGrand ? "grand" : "normal"} ${remaining === 0 ? "empty" : ""} ${justDrawn ? "drawn" : ""}`}
    >
      <div className="source-ticket-base">
        <div className="source-ticket-top">
          <span>引きかえ券</span>
          <b>{probability(remaining, remainingTotal)}%</b>
        </div>
        <div className="source-ticket-body">OPENED</div>
        <div className="source-ticket-slots">
          <span>
            LEFT <b>{remaining}</b>
          </span>
          <div>
            {Array.from({ length: item.total }, (_, index) => (
              <i className={index < item.covered ? "used" : ""} key={index} />
            ))}
          </div>
        </div>
      </div>
      {remaining > 0 ? (
        <button
          className="source-ticket-cover"
          style={{
            transform: dragging
              ? `translateX(${Math.max(0, offset.current * 0.3)}px) rotateY(${Math.min(60, offset.current * 0.35)}deg)`
              : undefined,
          }}
          onPointerDown={(event) => {
            start.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (dragging) {
              offset.current = Math.max(0, event.clientX - start.current);
              event.currentTarget.style.opacity = String(
                Math.max(0.7, 1 - offset.current / 350),
              );
            }
          }}
          onPointerUp={up}
          onPointerCancel={up}
          aria-label={`撕开 ${item.tier} 赏`}
        >
          <span>
            <b>{item.tier}</b>赏
          </span>
          <Icon>»</Icon>
        </button>
      ) : null}
    </article>
  );
}

function DrawPage({ navigate }: { navigate: (view: View) => void }) {
  const cached = loadDrawBoardCache();
  const [tiers, setTiers] = useState<Tier[]>(() =>
    cached?.tiers.length ? [...cached.tiers] : initialTiers,
  );
  const [records, setRecords] = useState<RecordItem[]>(() =>
    cached?.records ? [...cached.records] : [],
  );
  const [undoStack, setUndoStack] = useState<RecordItem[]>(() =>
    cached?.undoStack ? [...cached.undoStack] : [],
  );
  const [boardId] = useState(() => cached?.boardId ?? createBoardId());
  const [contribution, setContribution] =
    useState<DrawBoardContribution | null>(() => cached?.contribution ?? null);
  const [lastDraw, setLastDraw] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const [outlook, setOutlook] = useState(false);
  const [share, setShare] = useState<"" | "confirm" | "capture" | "submitted">(
    "",
  );
  const [note, setNote] = useState("");
  const recordId = useRef(0);
  const total = tiers.reduce((sum, tier) => sum + tier.total, 0);
  const remaining = tiers.reduce(
    (sum, tier) => sum + tier.total - tier.covered,
    0,
  );
  const initialTotal = initialTiers.reduce(
    (sum, tier) => sum + tier.total - tier.covered,
    0,
  );
  const boardOutlook = buildBoardOutlook({
    tiers,
    targetTiers: targets,
    unitPriceMinor: BigInt(drawCost),
  });
  useEffect(() => {
    saveDrawBoardCache({ boardId, tiers, records, undoStack, contribution });
  }, [boardId, contribution, records, tiers, undoStack]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  function draw(tier: string) {
    const current = tiers.find((entry) => entry.tier === tier);
    if (!current || current.covered >= current.total) return;
    const record: RecordItem = {
      id: `draw-${Date.now()}-${recordId.current++}`,
      tier,
      remaining: remaining - 1,
      cumulativeCost: yen((records.length + 1) * drawCost),
      totalSlots: current.total,
      tierRemaining: current.total - current.covered - 1,
      timestamp: Date.now(),
    };
    const allRecords = [...records, record];
    const reminder = analyzeSituation({
      records: allRecords,
      targetTiers: targets,
      initialTicketCount: initialTotal,
      remainingTicketCount: remaining - 1,
    });
    setTiers((currentTiers) =>
      currentTiers.map((entry) =>
        entry.tier === tier ? { ...entry, covered: entry.covered + 1 } : entry,
      ),
    );
    setRecords(allRecords);
    setUndoStack((stack) => [record, ...stack].slice(0, undoLimit));
    setLastDraw(tier);
    setToast(
      `抽到 ${tier} 赏 · 剩余 ${remaining - 1} 张 · 累计 ${record.cumulativeCost}${reminder ? ` · ${reminder.message}` : ""}`,
    );
  }
  function undo() {
    const last = undoStack[0];
    if (!last) {
      setToast(`最近 ${undoLimit} 抽已没有可撤回记录。`);
      return;
    }
    setTiers((currentTiers) =>
      currentTiers.map((entry) =>
        entry.tier === last.tier
          ? { ...entry, covered: Math.max(0, entry.covered - 1) }
          : entry,
      ),
    );
    setRecords((all) => all.filter((entry) => entry.id !== last.id));
    setUndoStack((all) => all.slice(1));
    setToast("已撤销");
    setLastDraw("");
  }
  function submit() {
    setContribution({ boardId, submittedAt: Date.now(), note, tiers, records });
    setShare("submitted");
  }
  const grand = tiers.filter(
    (tier) =>
      derivePrizeClassification({ label: tier.tier, totalSlots: tier.total })
        ?.presentation === "large",
  );
  const normal = tiers.filter((tier) => !grand.includes(tier));
  return (
    <section className="source-draw">
      <div className="source-status">
        <div>
          <small>REMAINING</small>
          <strong>
            {remaining}
            <em>/{total}</em>
          </strong>
        </div>
        <i />
        <div>
          <small>单价: {drawCost}¥</small>
          <b>LAST包套</b>
          <strong>
            {(remaining * drawCost).toLocaleString()}
            <em>¥</em>
          </strong>
        </div>
      </div>
      {toast ? (
        <div className="source-toast" role="status">
          <b>本次抽取记录</b>
          <span>{toast}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      ) : null}
      <section className="source-prize-group">
        <h2>♛ Grand Prizes</h2>
        {grand.map((item) => (
          <BoardCard
            key={item.tier}
            item={item}
            remainingTotal={remaining}
            justDrawn={lastDraw === item.tier}
            onDraw={() => draw(item.tier)}
          />
        ))}
      </section>
      <section className="source-prize-group normal">
        <h2>▱ Normal Prizes</h2>
        {normal.map((item) => (
          <BoardCard
            key={item.tier}
            item={item}
            remainingTotal={remaining}
            justDrawn={lastDraw === item.tier}
            onDraw={() => draw(item.tier)}
          />
        ))}
      </section>
      <div className="source-shortcuts">
        <button aria-label="局面可能性" onClick={() => setOutlook(true)}>
          ◔
        </button>
        <button aria-label="撤销上一抽" onClick={undo}>
          ↶
        </button>
        <button aria-label="查看抽取记录" onClick={() => setHistory(true)}>
          ◷
        </button>
      </div>
      <button className="source-stop" onClick={() => setShare("confirm")}>
        ✋ 决定收手
      </button>
      {outlook ? (
        <Modal title="局面可能性" close={() => setOutlook(false)}>
          <p className="source-note">观察窗口 (接下来 3 抽以内)</p>
          {boardOutlook.status === "available" ? (
            boardOutlook.events.map((event) => (
              <div className="source-stat" key={event.id}>
                <span>{event.label}</span>
                <b>{event.percentage}%</b>
              </div>
            ))
          ) : (
            <p>{boardOutlook.reason}</p>
          )}
          <p className="source-disclaimer">结果不保证；停止仍可选</p>
        </Modal>
      ) : null}
      {history ? (
        <Modal title="抽取记录" close={() => setHistory(false)}>
          {records.length ? (
            [...records].reverse().map((record, index) => (
              <div className="source-history" key={record.id}>
                <span>
                  #{records.length - index} {record.tier}赏
                </span>
                <b>
                  余 {record.remaining}
                  <small>{record.cumulativeCost}</small>
                </b>
              </div>
            ))
          ) : (
            <p className="source-empty">还没有新的抽取记录</p>
          )}
        </Modal>
      ) : null}
      {share === "confirm" ? (
        <Modal title="要把这张版面分享给大家吗？" close={() => setShare("")}>
          <p>提交后会在后台核对，不会立刻公开。</p>
          <PageButton onClick={() => setShare("capture")}>
            愿意并拍摄赏票
          </PageButton>
          <PageButton ghost onClick={() => setShare("")}>
            暂不分享
          </PageButton>
        </Modal>
      ) : null}
      {share === "capture" ? (
        <Modal title="拍摄赏票" close={() => setShare("")}>
          <div className="source-evidence">
            请把抽完的赏票全部放在框内拍摄。
          </div>
          <label className="source-input">
            地点与备注
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：商场几楼哪家店"
            />
          </label>
          <PageButton onClick={submit}>提交核对</PageButton>
        </Modal>
      ) : null}
      {share === "submitted" ? (
        <Modal title="已提交" close={() => setShare("")}>
          <p>后台正在核对本次提交。</p>
          <p>可在我的 ➜「我的贡献」里面查看。</p>
          <PageButton onClick={() => setShare("")}>继续</PageButton>
          <PageButton ghost onClick={() => navigate("start")}>
            退出
          </PageButton>
        </Modal>
      ) : null}
    </section>
  );
}

function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="source-modal-backdrop"
      role="dialog"
      aria-label={title}
      aria-modal="true"
    >
      <section className="source-modal" aria-label={title}>
        <button
          className="source-modal-close"
          aria-label="关闭"
          onClick={close}
        >
          ×
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function ShellContent() {
  const router = useRouter();
  const params = useSearchParams();
  const view = resolveView(params.get("view"));
  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const navigate = (next: View) => router.push(`/?view=${next}`);
  useEffect(() => {
    if (view !== "recognizing") return;
    const timer = window.setTimeout(
      () =>
        navigate(
          params.get("outcome") === "cannot-build-pool"
            ? "cannot-build-pool"
            : "draft",
        ),
      2500,
    );
    return () => window.clearTimeout(timer);
  }, [view]);
  const editable = (
    tier: string,
    field: "total" | "remaining",
    value: string,
  ) =>
    setTiers((all) =>
      all.map((item) => {
        if (item.tier !== tier) return item;
        const parsed = Math.max(0, Number.parseInt(value, 10) || 0);
        return field === "total"
          ? {
              ...item,
              total: Math.max(1, parsed),
              covered: Math.min(item.covered, Math.max(1, parsed)),
            }
          : { ...item, covered: Math.max(0, item.total - parsed) };
      }),
    );
  const headerHidden = view === "camera-capture" || view === "recognizing";
  return (
    <main className={`light-shell light-${view}`}>
      {!headerHidden ? (
        <header className="light-header">
          <button onClick={() => navigate("start")}>
            <small>ICHI</small>
            <strong>ICHI</strong>
          </button>
          <button className="privacy" onClick={() => navigate("method")}>
            计算与隐私
          </button>
        </header>
      ) : null}
      <div className="light-content">
        {view === "start" ? (
          <section className="source-start">
            <span className="source-orb">●</span>
            <h1>导入版面</h1>
            <p>将一番赏兑换进度版面放入镜头，ICHI 会帮你读懂余量。</p>
            <PageButton onClick={() => navigate("camera-capture")}>
              导入版面照片
            </PageButton>
            <button
              className="source-camera-entry"
              onClick={() => navigate("camera-capture")}
            >
              <Icon>◎</Icon>
              <span>拍摄版面</span>
              <em>›</em>
            </button>
            <div className="source-privacy-card">
              <Icon>♙</Icon>
              <div>
                <b>计算与隐私</b>
                <p>照片只用于本次版面识别；在你选择共享前，不会上传。</p>
              </div>
            </div>
          </section>
        ) : null}
        {view === "camera-capture" ? (
          <section className="source-camera">
            <button
              className="source-camera-back"
              onClick={() => navigate("start")}
            >
              ‹
            </button>
            <div className="source-camera-guide">
              <div />
              <span>将完整的兑换进度版面放入框内</span>
            </div>
            <div className="source-camera-controls">
              <button aria-label="相册">▧</button>
              <button
                className="source-shutter"
                aria-label="拍摄版面"
                onClick={() => navigate("recognizing")}
              >
                <i />
              </button>
              <button aria-label="闪光灯">ϟ</button>
            </div>
          </section>
        ) : null}
        {view === "recognizing" ? (
          <section className="source-recognizing">
            <div className="source-scan">⌁</div>
            <h1>正在提取版面</h1>
            <ol>
              <li className="done">● 照片解析完成</li>
              <li>◌ 奖级与余票读取中</li>
              <li>◌ 数据校验构建池</li>
            </ol>
          </section>
        ) : null}
        {view === "draft" ? (
          <section className="source-draft">
            <div className="source-title">
              <div>
                <h1>核对结果</h1>
                <p>请修正识别错误的余量</p>
              </div>
              <button onClick={() => navigate("cannot-build-pool")}>
                识别有误?
              </button>
            </div>
            <div className="source-editor">
              <div className="source-last">
                <b>LAST 赏</b>
                <span>
                  数量
                  <input value="1" readOnly />
                </span>
              </div>
              <div className="source-editor-grid">
                {tiers.map((item) => (
                  <label key={item.tier} className="source-editor-card">
                    <b>{item.tier}</b>
                    <small>总数 剩余</small>
                    <span>
                      <input
                        aria-label={`${item.tier} 赏总票数`}
                        value={item.total}
                        type="number"
                        onChange={(e) =>
                          editable(item.tier, "total", e.target.value)
                        }
                      />
                      <input
                        aria-label={`${item.tier} 赏剩余票数`}
                        value={item.total - item.covered}
                        type="number"
                        onChange={(e) =>
                          editable(item.tier, "remaining", e.target.value)
                        }
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <PageButton
              onClick={() => {
                saveDrawBoardCache({
                  boardId: createBoardId(),
                  tiers,
                  records: [],
                  undoStack: [],
                  contribution: null,
                });
                navigate("draw");
              }}
            >
              确认并生成版面
            </PageButton>
          </section>
        ) : null}
        {view === "draw" ? <DrawPage navigate={navigate} /> : null}
        {view === "my" ? (
          <section className="source-my">
            <div className="source-profile">
              <i>I</i>
              <div>
                <h1>ICHI 玩家</h1>
                <p>ID: ICHI-LOCAL-001</p>
              </div>
              <b>本机模式</b>
            </div>
            <div className="source-menu">
              {[
                ["账号管理", "storage"],
                ["本地记录", "local-records"],
                ["我的贡献", "contributions"],
                ["提醒设置", "method"],
                ["隐私与数据", "method"],
                ["关于 ICHI", "method"],
              ].map(([label, target]) => (
                <button key={label} onClick={() => navigate(target as View)}>
                  {label}
                  <span>›</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {view === "local-records" ? (
          <section className="source-list">
            <h1>本地记录</h1>
            <p>待核对、待审核与本机草稿</p>
            <article>
              <b>待核对的版面</b>
              <span>可继续拍摄赏票或取消提交</span>
            </article>
            <article>
              <b>本机抽取草稿</b>
              <span>当前浏览器内的版面记录</span>
            </article>
            <PageButton ghost onClick={() => navigate("my")}>
              返回我的
            </PageButton>
          </section>
        ) : null}
        {view === "contributions" ? (
          <section className="source-list">
            <h1>我的贡献</h1>
            <p>查看已经提交的版面和后台状态</p>
            <article>
              <b>后台核对中</b>
              <span>提交后可在这里查看；通过后才会保留为贡献。</span>
            </article>
            <PageButton ghost onClick={() => navigate("my")}>
              返回我的
            </PageButton>
          </section>
        ) : null}
        {view === "storage" ? (
          <section className="source-list">
            <h1>账号管理</h1>
            <p>登录与账号设置 · V2 预留</p>
            <article>
              <b>账号与登录</b>
              <span>V1 仅保留界面框架，不连接真实账号。</span>
            </article>
            <PageButton ghost onClick={() => navigate("my")}>
              返回我的
            </PageButton>
          </section>
        ) : null}
        {view === "method" ? (
          <section className="source-list">
            <h1>计算与隐私</h1>
            <p>概率依当前余票精确计算；停止始终可选。</p>
            <article>
              <b>照片与记录</b>
              <span>网页原型只保存在当前浏览器，不调用真实上传。</span>
            </article>
            <PageButton ghost onClick={() => navigate("my")}>
              返回我的
            </PageButton>
          </section>
        ) : null}
        {view === "map-preview" ? (
          <section className="source-list">
            <h1>好版地图</h1>
            <p>V2 预留</p>
            <article>
              <b>地图还在准备中</b>
              <span>现在不展示门店线索或实时库存。</span>
            </article>
            <PageButton onClick={() => navigate("camera-capture")}>
              去拍摄版面
            </PageButton>
          </section>
        ) : null}
        {view === "cannot-build-pool" ? (
          <section className="source-list">
            <h1>无法建立票池</h1>
            <p>可能是没有识别成功，或者信息不完整。</p>
            <PageButton onClick={() => navigate("camera-capture")}>
              重新拍摄版面
            </PageButton>
            <PageButton ghost onClick={() => navigate("start")}>
              返回首页
            </PageButton>
          </section>
        ) : null}
        {[
          "resume",
          "deleted",
          "undo-protected",
          "storage-fallback",
          "schema-incompatible",
          "storage-warning",
        ].includes(view) ? (
          <section className="source-list">
            <h1>{view === "resume" ? "继续上次记录" : "提示"}</h1>
            <p>当前页面状态已保留在本机演示框架中。</p>
            <PageButton onClick={() => navigate("draw")}>
              回到一番赏版面
            </PageButton>
            <PageButton ghost onClick={() => navigate("start")}>
              返回首页
            </PageButton>
          </section>
        ) : null}
      </div>
      {!headerHidden && <Nav view={view} navigate={navigate} />}
    </main>
  );
}

export default function LightShell() {
  return (
    <Suspense fallback={<main className="light-shell">正在加载页面流…</main>}>
      <ShellContent />
    </Suspense>
  );
}
