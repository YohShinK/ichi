import Link from "next/link";
import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary";
}) {
  return (
    <button
      className={`button button-${variant} ${className}`.trim()}
      {...props}
    />
  );
}

export function StateLink({
  href,
  children,
  className = "",
  ariaCurrent,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  ariaCurrent?: "page" | undefined;
}) {
  return (
    <Link className={className} href={href} aria-current={ariaCurrent}>
      {children}
    </Link>
  );
}

export function TicketSlots({
  total,
  covered,
  className = "ticket-slots",
  ariaLabel,
}: {
  total: number;
  covered: number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <span
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {Array.from({ length: total }, (_, index) => (
        <i
          className={index < covered ? "ticket-slot covered" : "ticket-slot"}
          key={index}
        />
      ))}
    </span>
  );
}

export function PrizeTile({
  tier,
  total,
  covered,
  presentation,
  probability,
  justDrawn = false,
  disabled = false,
  onDraw,
}: {
  tier: string;
  total: number;
  covered: number;
  presentation: "large" | "medium" | "small";
  probability: string;
  justDrawn?: boolean;
  disabled?: boolean;
  onDraw?: () => void;
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isTearing, setIsTearing] = useState(false);
  const dragStart = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const suppressClick = useRef(false);
  const remaining = Math.max(total - covered, 0);
  const slotsPerRow = presentation === "large" ? 5 : 12;
  const ticketRows = Math.max(1, Math.ceil(total / slotsPerRow));

  function resetDrag() {
    dragStart.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
  }

  function completeTear() {
    if (!onDraw || disabled || isTearing) return;
    suppressClick.current = true;
    setIsTearing(true);
    window.setTimeout(() => {
      onDraw();
      setIsTearing(false);
      resetDrag();
    }, 260);
  }

  return (
    <button
      className={`prize-column prize-${presentation}${justDrawn ? " prize-column-torn" : ""}${isTearing ? " prize-column-tearing" : ""}`}
      type="button"
      style={
        {
          "--ticket-height": `${78 + (ticketRows - 1) * 26}px`,
        } as CSSProperties
      }
      disabled={disabled}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onDraw?.();
      }}
      onPointerDown={(event) => {
        if (disabled || !onDraw) return;
        dragStart.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (dragStart.current === null || disabled || !onDraw) return;
        const nextOffset = Math.max(
          0,
          Math.min(event.clientX - dragStart.current, 120),
        );
        dragOffsetRef.current = nextOffset;
        setDragOffset(nextOffset);
      }}
      onPointerUp={(event) => {
        if (dragStart.current === null) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        if (dragOffsetRef.current >= 52) completeTear();
        else resetDrag();
      }}
      onPointerCancel={resetDrag}
      data-prize-presentation={presentation}
    >
      <span className="prize-ticket-body" aria-hidden="true">
        <span className="prize-ticket-count">
          <small>剩余</small>
          <strong>{remaining}</strong>
        </span>
        <TicketSlots total={total} covered={covered} className="ticket-slots" />
      </span>
      <span
        className="prize-ticket-cover"
        style={{ "--tear-offset": `${dragOffset}px` } as CSSProperties}
      >
        <span className="prize-cover-copy">
          <span className="prize-icon" aria-hidden="true">
            {tier}
          </span>
          <strong>{tier} 赏</strong>
          <small className="prize-probability">{probability}%</small>
        </span>
        <span className="prize-tear-handle" aria-hidden="true">
          &gt;&gt;&gt;
        </span>
      </span>
      <TicketSlots
        total={total}
        covered={covered}
        className="sr-only"
        ariaLabel={`${tier} 赏共 ${total} 格，已贴 ${covered} 格`}
      />
      {justDrawn ? <em className="new-ticket">新票已贴</em> : null}
    </button>
  );
}

export function StatusNotice({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "warning" | "error" | "success";
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <strong>{title}</strong>
      <p>{children}</p>
    </section>
  );
}

export function Modal({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`share-modal-backdrop ${className}`.trim()}
      role="dialog"
      aria-label={label}
    >
      <div className="share-modal">{children}</div>
    </section>
  );
}

export function BottomTabbar({
  currentTab,
  items,
}: {
  currentTab: string;
  items: readonly { id: string; label: string; href: string }[];
}) {
  return (
    <nav className="mobile-tabbar" aria-label="主要导航">
      {items.map((item) => (
        <StateLink
          key={item.id}
          className={currentTab === item.id ? "tab-link active" : "tab-link"}
          href={item.href}
          ariaCurrent={currentTab === item.id ? "page" : undefined}
        >
          <span className={`tab-mark tab-mark-${item.id}`} aria-hidden="true" />
          <span className="tab-label">{item.label}</span>
        </StateLink>
      ))}
    </nav>
  );
}
