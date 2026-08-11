"use client";

import { useEffect, useState } from "react";

const SOURCE_SHELL_REVISION = "20260810-4";

export default function PrototypeFrame({
  initialView,
}: {
  initialView: string;
}) {
  const [sourceUrl] = useState(
    () =>
      `/api/v1-29-source?revision=${SOURCE_SHELL_REVISION}&initialView=${encodeURIComponent(initialView)}#${encodeURIComponent(initialView)}`,
  );
  useEffect(() => {
    function syncRoute(event: MessageEvent<unknown>) {
      if (event.origin !== window.location.origin) return;
      const frame = document.querySelector<HTMLIFrameElement>(
        "iframe.v1-29-source-frame",
      );
      if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
      if (!event.data || typeof event.data !== "object") return;
      const message = event.data as { type?: string; view?: string };
      if (message.type !== "ichi:v1-29-route" || !message.view) return;
      const nativeReplaceState = frame?.contentWindow
        ? (Object.getPrototypeOf(frame.contentWindow.history) as History)
            .replaceState
        : undefined;
      if (nativeReplaceState) {
        nativeReplaceState.call(
          window.history,
          window.history.state,
          "",
          `/?view=${encodeURIComponent(message.view)}`,
        );
      }
    }
    window.addEventListener("message", syncRoute);
    return () => window.removeEventListener("message", syncRoute);
  }, []);
  return (
    <iframe
      title="ICHI V1-29 网页 UI"
      className="v1-29-source-frame"
      key={SOURCE_SHELL_REVISION}
      src={sourceUrl}
    />
  );
}
