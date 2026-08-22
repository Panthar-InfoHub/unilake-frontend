import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession, triggerGeneration, regeneratePage } from "@/app/actions/session";
import { SessionSnapshot, SessionStatus, Variant, WSEvent } from "@/app/types/session";
import { SessionWebSocket } from "@/app/lib/websocket";

/**
 * Applies `updateVariants` to the one page matching `pageNumber`, leaving every other
 * page untouched and returning a new snapshot object (TanStack Query needs a new
 * reference to re-render). A no-op if the cache is empty or the page isn't found.
 */
function patchPage(
  snapshot: SessionSnapshot | undefined,
  pageNumber: number,
  updateVariants: (variants: Variant[]) => Variant[]
): SessionSnapshot | undefined {
  if (!snapshot) return snapshot;

  return {
    ...snapshot,
    pages: snapshot.pages.map((page) =>
      page.pageNumber === pageNumber
        ? { ...page, variants: updateVariants(page.variants) }
        : page
    ),
  };
}

export function useSessionPreview(sessionId: string | null) {
  const queryClient = useQueryClient();
  
  const [jobsEnqueued, setJobsEnqueued] = useState<number>(0);
  const [generateEnqueuedNothing, setGenerateEnqueuedNothing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<SessionWebSocket | null>(null);

  // The socket is bound once, but the event handler below is re-created whenever its
  // deps change. Routing through a ref keeps the binding stable while always invoking
  // the current handler — and lets the socket effect run before the handler is declared
  // without reaching forward into an uninitialised binding.
  const handleWsEventRef = useRef<(event: WSEvent) => void>(() => {});

  // Which session we have already fired /generate for. Generation is a one-way door
  // (§13.10) and a second call 409s, so this must be a ref, not state — it has to be
  // readable and writable synchronously, before any await, or two calls in the same
  // tick both get through.
  const generationRequestedRef = useRef<string | null>(null);

  // 1. Fetch Session Snapshot (The truth)
  const {
    data: snapshot,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => (sessionId ? getSession(sessionId) : Promise.reject("No session ID")),
    enabled: !!sessionId,
    refetchOnWindowFocus: true, // As per API doc: refetch on tab focus
    // Fallback channel (§6.2). The socket is an optimization, not a dependency: the
    // browser API cannot tell us *why* a handshake failed, so rather than guessing we
    // just poll the GET — which always works and contains everything — whenever the
    // socket is down and there is still something left to stream.
    refetchInterval: (query) => {
      const polledStatus = query.state.data?.status;
      
      // Payment polling: 2s, regardless of WS state (§12.2)
      if (polledStatus === "AWAITING_PAYMENT" || polledStatus === "PAID") {
        return 2_000;
      }

      if (wsConnected) return false;
      return polledStatus === "PHOTO_UPLOADED" || polledStatus === "GENERATING_PREVIEW" || polledStatus === "GENERATING_PAID"
        ? 10_000
        : false;
    },
  });

  // 2. WebSocket setup
  //
  // Kept alive for the whole visit rather than torn down at PREVIEW_READY: regeneration
  // streams over this same socket, and the user can regenerate at any point after the
  // preview lands. Reconnects are already capped, so an unused socket costs nothing.
  useEffect(() => {
    if (!snapshot || !sessionId) return;

    if (!wsRef.current) {
      const ws = new SessionWebSocket(sessionId, snapshot.wsRoomToken);
      wsRef.current = ws;

      const unbindMessage = ws.onMessage((event: WSEvent) => {
        handleWsEventRef.current(event);
      });

      const unbindReconnect = ws.onReconnect(() => {
        // On reconnect, always fetch truth
        refetch();
      });

      // Drives the polling fallback above: while this is false, the GET is the only
      // channel we have, so the query polls instead of sitting idle.
      const unbindConnection = ws.onConnectionChange(setWsConnected);

      ws.connect();

      return () => {
        unbindMessage();
        unbindReconnect();
        unbindConnection();
        ws.close();
        wsRef.current = null;
        setWsConnected(false);
      };
    }
  }, [snapshot?.id]); // Only run when snapshot ID is first available

  // 3. WebSocket Event Handlers
  const handleWsEvent = useCallback((event: WSEvent) => {
    if (!sessionId) return;

    if (event.type === "session:preview-ready" || event.type === "session:paid-ready") {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    } else if (event.type === "page:ready") {
      // Optimistic update for page:ready
      queryClient.setQueryData(["session", sessionId], (oldData: SessionSnapshot | undefined) =>
        patchPage(oldData, event.pageNumber, (variants) => {
          // Match on pageVersionId — the variant's stable identity. Do NOT match on
          // variantIndex alone: a regenerated variant is a brand-new pageVersionId.
          const existing = variants.find((v) => v.pageVersionId === event.pageVersionId);

          if (existing) {
            return variants.map((v) =>
              v.pageVersionId === event.pageVersionId
                ? {
                    ...v,
                    status: "SD_READY" as const,
                    // The event field is `imageUrl` — it maps onto `finalImageUrl` here.
                    finalImageUrl: event.imageUrl,
                    displayImageUrl: event.displayImageUrl,
                    // A ready page clears any error from an earlier failed attempt:
                    // page:error is not final, the backend retries (§8.1).
                    errorMessage: null,
                  }
                : v
            );
          }

          // Never seen this variant before. Two ways we get here (§8.2):
          //   1. the user regenerated — this variant didn't exist at our last GET
          //   2. the event beat the initial GET back
          // Either way, append it rather than dropping the event on the floor.
          const added: Variant = {
            pageVersionId: event.pageVersionId,
            variantIndex: event.variantIndex,
            status: "SD_READY",
            finalImageUrl: event.imageUrl,
            displayImageUrl: event.displayImageUrl,
            isSelected: false,
            errorMessage: null,
          };

          // Keep ascending by variantIndex — the snapshot guarantees that order and
          // the variant strip / "latest variant" logic reads it positionally.
          return [...variants, added].sort((a, b) => a.variantIndex - b.variantIndex);
        })
      );
    } else if (event.type === "page:error") {
      // Optimistic update for page:error (mark as FAILED, though it might retry)
      queryClient.setQueryData(["session", sessionId], (oldData: SessionSnapshot | undefined) =>
        patchPage(oldData, event.pageNumber, (variants) =>
          // This event carries no pageVersionId, so variantIndex is all we can match on.
          // If the variant isn't known yet we leave it alone — the failure isn't final
          // (§8.1) and the next GET reconciles it.
          variants.map((v) =>
            v.variantIndex === event.variantIndex
              ? { ...v, status: "FAILED" as const, errorMessage: event.errorMessage }
              : v
          )
        )
      );
    }
  }, [sessionId, queryClient]);

  // Keep the socket's view of the handler current.
  useEffect(() => {
    handleWsEventRef.current = handleWsEvent;
  }, [handleWsEvent]);

  // 4. Action triggers
  const handleTriggerGeneration = useCallback(async () => {
    if (!sessionId) return;

    // Latch BEFORE the await. Callers re-run on every snapshot refresh and React
    // StrictMode double-invokes effects in dev, so without a synchronous claim here
    // two calls reach the network and the second one 409s.
    if (generationRequestedRef.current === sessionId) return;
    generationRequestedRef.current = sessionId;

    // Wait for the socket before starting (§13.8). Generation begins the instant the
    // POST returns and pages without a face can finish in 1–2 seconds — events fired
    // before the socket is open are lost forever, with no replay.
    //
    // Bounded, and the result is deliberately ignored: a socket that will not open must
    // never prevent the user's book from being generated. If it timed out we generate
    // anyway and the polling fallback picks the pages up.
    const socketReady = await wsRef.current?.waitUntilOpen(3000);
    if (!socketReady) {
      console.warn(
        "Generating without an open WebSocket — falling back to polling for page updates."
      );
    }

    try {
      const res = await triggerGeneration(sessionId);
      setJobsEnqueued(res.jobsEnqueued);

      // §7: the session flips to GENERATING_PREVIEW even when nothing was queued.
      // Nothing will ever arrive and preview-ready will never fire, so record it —
      // the alternative is an infinite progress bar.
      if (res.jobsEnqueued === 0) {
        console.error("Generation enqueued 0 jobs — this comic has no preview pages flagged.");
        setGenerateEnqueuedNothing(true);
      }

      // Immediately refetch to update status
      refetch();
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;

      // 409 means generation is already running — another tab started it, or this
      // session was resumed after a refresh. That is the state we wanted, not a
      // failure: keep the latch closed and just reconcile against the truth.
      if (code === "CONFLICT") {
        refetch();
        return;
      }

      // Anything else (network blip, 500) may be transient. Release the latch so a
      // retry is possible, then let the caller decide how to surface it.
      generationRequestedRef.current = null;
      console.error("Failed to trigger generation:", e);
      throw e;
    }
  }, [sessionId, refetch]);

  const handleRegeneratePage = useCallback(async (pageNumber: number) => {
    if (!sessionId) return;
    try {
      const res = await regeneratePage(sessionId, pageNumber);
      // It queued a regeneration. Refetch to get the new QUEUED variant.
      refetch();
      return res;
    } catch (e) {
      console.error("Failed to regenerate page:", e);
      throw e;
    }
  }, [sessionId, refetch]);

  // 5. Computed properties
  const status: SessionStatus = snapshot?.status || "CREATED";

  const previewPages = snapshot?.pages.filter((p) => p.isPreviewPage) ?? [];

  // Count of preview pages with at least one finished variant.
  const pagesReady = previewPages.filter((page) =>
    page.variants.some((v) => v.status === "SD_READY")
  ).length;

  // Denominator for the progress bar. `jobsEnqueued` only exists in memory, from the
  // /generate response — a refresh mid-generation loses it and the bar would read
  // "0 of ?" forever. The snapshot's own preview-page count is always available and
  // always agrees with what the backend actually queued, so it's the fallback.
  // (Never `comic.freePreviewPages` — that's admin-typed and can disagree, §13.7.)
  const totalPreviewPages = jobsEnqueued > 0 ? jobsEnqueued : previewPages.length;

  // No page on this comic is flagged as a free preview, so nothing will ever generate
  // and `session:preview-ready` will never fire (§7). An admin data problem, but the UI
  // has to surface it rather than spinning forever.
  //
  // Two independent signals, because either can be true alone: the snapshot shows no
  // preview pages (catches it before we ever trigger, and survives a refresh), or
  // /generate itself reported queuing nothing.
  const hasNoPreviewPages =
    (!!snapshot && previewPages.length === 0) || generateEnqueuedNothing;

  // Sessions die after 24h. REST keeps working, but the WebSocket refuses the upgrade
  // (§1.2) — so an expired session looks fine and then silently never updates.
  const isExpired = !!snapshot?.isExpired;

  const allPages = snapshot?.pages ?? [];
  const paidPages = allPages.filter((p) => !p.isPreviewPage);
  const paidPagesReady = paidPages.filter((p) =>
    p.variants.some((v) => v.status === "SD_READY")
  ).length;
  const totalPaidPages = paidPages.length;
  const isPaid = [
    "AWAITING_PAYMENT",
    "PAID",
    "GENERATING_PAID",
    "PAID_PAGES_READY",
    "CONFIRMED",
    "COMPILING_PDF",
    "SHIPMENT_QUEUED",
    "SHIPMENT_FAILED",
    "COMPLETED",
  ].includes(status);

  return {
    snapshot,
    isLoading,
    error,
    status,
    jobsEnqueued,
    pagesReady,
    totalPreviewPages,
    hasNoPreviewPages,
    isExpired,
    paidPages,
    paidPagesReady,
    totalPaidPages,
    isPaid,
    triggerGeneration: handleTriggerGeneration,
    regeneratePage: handleRegeneratePage,
  };
}
