import fs from "node:fs";
import path from "node:path";
import { digest, check, json } from "./store.mjs";
import { validatePacket } from "./schema.mjs";
import { correctionPolicy } from "../../packages/v2-map/resources/production/phase3/correction.mjs";
import {
  networkRecordValid,
  networkContentDigest,
  networkLocationDigest,
  networkSourceId,
  networkTime,
  networkPolicyValid,
  buildNetworkObservation,
  NETWORK_WORKFLOW_DELEGATION_VERSION,
  NETWORK_WORKFLOW_LOCATION_VERSION,
  NETWORK_WORKFLOW_LOCATION_RULE,
} from "../../packages/v2-map/resources/production/phase3/network.mjs";

export const binding = (c) =>
  digest({
    record: c.record,
    evidence: c.evidence,
    revision: c.revision,
    firstDiscoveredAt: c.firstDiscoveredAt,
  });
export const boardImageEvidence = (e) =>
  ["PHOTO", "VIDEO_FRAME"].includes(e.kind) ||
  (e.kind === "SCREENSHOT" && e.mediaRole === "FULL_IMAGE_SCREENSHOT");
const instant = (x) =>
  typeof x === "string" &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString() === x;
export const candidateIssues = (c, nowMs = Date.now()) => {
  const issues = [];
  if (!networkRecordValid(c.record)) issues.push("RECORD_NEEDS_FIX");
  const r = c.record;
  if (
    !r.boardFacts?.tiers?.length ||
    r.boardFacts.tiers.some(
      (t) =>
        !Number.isSafeInteger(t.remainingTickets) || t.remainingTickets < 0,
    )
  )
    issues.push("TIER_REMAINING_UNRESOLVED");
  if (
    !instant(c.firstDiscoveredAt) ||
    !instant(r.sourcePublishedAt) ||
    !instant(r.fetchedAt) ||
    Date.parse(c.firstDiscoveredAt) < Date.parse(r.sourcePublishedAt) ||
    Date.parse(c.firstDiscoveredAt) > Date.parse(r.fetchedAt) ||
    Date.parse(r.fetchedAt) > nowMs
  )
    issues.push("SOURCE_TIME_UNPROVEN");
  if (
    Date.parse(c.firstDiscoveredAt) - Date.parse(r.sourcePublishedAt) >
    7 * 86400_000
  )
    issues.push("OUTSIDE_ORIGINAL_SEVEN_DAY_WINDOW");
  const time = networkTime(r);
  if (time && Date.parse(time.publicUntil) <= nowMs)
    issues.push("OBSERVATION_EXPIRED");
  if (!c.evidence.some(boardImageEvidence)) issues.push("BOARD_IMAGE_MISSING");
  if (!c.evidence.some((e) => e.kind === "CAPTURE"))
    issues.push("PUBLIC_CAPTURE_MISSING");
  if (!c.evidence.some((e) => e.kind === "LOCATION"))
    issues.push("LOCATION_EVIDENCE_MISSING");
  return issues;
};
const verifyCapture = (store, candidate) => {
  store.verify(candidate);
  const captureEvidence = candidate.evidence.find((e) => e.kind === "CAPTURE");
  if (captureEvidence) {
    const cap = json(store.inside(captureEvidence.path));
    check(
      cap.canonicalUrl === candidate.record.sourceUrl &&
        cap.sourcePublishedAt === candidate.record.sourcePublishedAt &&
        cap.fetchedAt === candidate.record.fetchedAt,
      "CAPTURE_RECORD_DRIFT",
    );
    for (const photo of candidate.evidence.filter((e) => e.kind === "PHOTO"))
      check(
        cap.mediaKind !== "video" &&
          cap.evidence?.some(
            (e) => e.path === photo.originalFile && e.sha256 === photo.sha256,
          ),
        "PHOTO_CAPTURE_UNBOUND",
      );
    const articleId = candidate.record.sourceUrl.split("/").at(-1);
    for (const shot of candidate.evidence.filter(
      (e) => e.kind === "SCREENSHOT" && e.mediaRole === "FULL_IMAGE_SCREENSHOT",
    )) {
      const matched = cap.evidence?.find(
        (e) => e.path === shot.originalFile && e.sha256 === shot.sha256,
      );
      check(
        cap.mediaKind !== "video" &&
          matched &&
          matched.method === "FULL_IMAGE_SCREENSHOT" &&
          matched.evidenceKind === "SCREENSHOT" &&
          matched.articleId === articleId &&
          matched.canonicalUrl === candidate.record.sourceUrl &&
          matched.sourcePublishedAt === cap.sourcePublishedAt &&
          Number.isInteger(matched.index) &&
          matched.index > 0 &&
          matched.width >= 640 &&
          matched.height >= 256 &&
          matched.screenshotGeometry?.completeImage === true &&
          matched.screenshotGeometry.visibleScale >= 0.8,
        "FULL_IMAGE_SCREENSHOT_UNBOUND_OR_INCOMPLETE",
      );
    }
    for (const frame of candidate.evidence.filter(
      (e) => e.kind === "VIDEO_FRAME",
    )) {
      const side = candidate.evidence.find(
        (e) =>
          e.kind === "VIDEO_METADATA" && e.sha256 === frame.videoMetadataSha256,
      );
      check(side && cap.mediaKind === "video", "VIDEO_FRAME_UNBOUND");
      const metadata = json(store.inside(side.path));
      const matched = metadata.frames?.find((x) => x.sha256 === frame.sha256);
      check(
        metadata.articleId === articleId &&
          metadata.captureSha256 === captureEvidence.sha256 &&
          metadata.sourcePublishedAt === cap.sourcePublishedAt &&
          matched &&
          Number.isFinite(matched.actualMediaTime) &&
          matched.actualMediaTime >= 0 &&
          matched.width > 0 &&
          matched.height > 0,
        "VIDEO_FRAME_UNBOUND",
      );
    }
  }
};
const locationEvidenceValid = (store, c, evidence) => {
  if (!evidence) return false;
  const proof = json(store.inside(evidence.path));
  if (digest(proof.location ?? proof) !== digest(c.record.location))
    return false;
  if (c.record.location.accuracyMeters !== null) return true;
  const post = c.evidence.find(
    (e) =>
      ["CAPTURE", "PROFILE"].includes(e.kind) &&
      e.sha256 === proof.postOrProfileSha256,
  );
  const poi = c.evidence.find(
    (e) => e.kind === "POI" && e.sha256 === proof.poiEvidenceSha256,
  );
  if (
    !post ||
    !poi ||
    proof.sourceUrl !== c.record.sourceUrl ||
    proof.boardEvidenceKey !== c.record.boardEvidenceKey ||
    !proof.venueBindingText?.trim()
  )
    return false;
  const point = json(store.inside(poi.path)),
    r = c.record.location;
  return (
    point.providerUrl === r.venueReference.providerUrl &&
    point.latitude === r.latitude &&
    point.longitude === r.longitude
  );
};

export const collect = (store, manifestFile, nowMs = Date.now()) =>
  store.exclusive(async () => {
    const manifest = validatePacket("collect", json(manifestFile)),
      state = store.read();
    check(
      manifest.schemaVersion === "ichi-network-collect-v1" &&
        Array.isArray(manifest.candidates),
      "INVALID_COLLECT_MANIFEST",
    );
    let imported = 0,
      duplicates = 0;
    for (const input of manifest.candidates) {
      const r = input.record;
      check(
        r?.sourceId === networkSourceId(r.sourceUrl, r.boardEvidenceKey),
        "SOURCE_ID_MISMATCH",
      );
      check(
        /^https:\/\/www\.xiaohongshu\.com\/explore\/[A-Za-z0-9]+$/u.test(
          r.sourceUrl,
        ),
        "NONCANONICAL_SOURCE_URL",
      );
      const existing = state.candidates[r.sourceId];
      if (existing) {
        check(
          networkContentDigest(existing.record) === networkContentDigest(r),
          "EXISTING_CANDIDATE_USE_EDIT",
        );
        const identities = (evidence) =>
          evidence.map((e) => ({
            ...e,
            path: undefined,
            originalFile: e.originalFile ?? path.basename(e.path),
          }));
        check(
          digest(identities(input.evidence)) ===
            digest(identities(existing.evidence)),
          "EVIDENCE_CHANGED_USE_EDIT",
        );
        duplicates += 1;
        continue;
      }
      const evidence = input.evidence.map((e) =>
        store.importEvidence(e, path.dirname(path.resolve(manifestFile))),
      );
      const c = {
        id: r.sourceId,
        revision: 1,
        record: structuredClone(r),
        firstDiscoveredAt: input.firstDiscoveredAt ?? r.fetchedAt,
        evidence,
        similarityHints: input.similarityHints ?? [],
        status: "PENDING",
        review: null,
        history: [],
        attempts: [],
        publication: null,
      };
      verifyCapture(store, c);
      c.issues = candidateIssues(c, nowMs);
      c.status = c.issues.length ? "NEEDS_FIX" : "PENDING";
      state.candidates[c.id] = c;
      imported += 1;
    }
    for (const search of manifest.searches ?? []) {
      check(
        typeof search.query === "string" &&
          Array.isArray(search.coverage) &&
          typeof search.coverageStatus === "string",
        "INVALID_SEARCH_COVERAGE",
      );
      const key = digest(search);
      if (!state.searches.some((s) => s.sha256 === key))
        state.searches.push({ ...search, sha256: key });
    }
    store.save(state, "COLLECT", { imported, duplicates, cloudWrites: 0 });
    return {
      imported,
      duplicates,
      cloudWrites: 0,
      candidates: Object.keys(state.candidates).length,
    };
  });

export const edit = (store, id, replacementFile, nowMs = Date.now()) =>
  store.exclusive(async () => {
    const state = store.read(),
      old = state.candidates[id],
      input = validatePacket("replacement", json(replacementFile));
    check(old && !old.takenDown, "CANDIDATE_UNAVAILABLE");
    check(
      input.record.sourceId === id &&
        input.record.sourceUrl === old.record.sourceUrl &&
        input.record.boardEvidenceKey === old.record.boardEvidenceKey,
      "EDIT_IDENTITY_CHANGED",
    );
    check(
      input.record.sourceVersion !== old.record.sourceVersion,
      "NEW_SOURCE_VERSION_REQUIRED",
    );
    const evidence = input.evidence.map((e) =>
      store.importEvidence(e, path.dirname(path.resolve(replacementFile))),
    );
    const next = {
      ...old,
      revision: old.revision + 1,
      record: input.record,
      evidence,
      firstDiscoveredAt: old.firstDiscoveredAt,
      review: null,
      issues: [],
      history: [
        ...old.history,
        {
          revision: old.revision,
          record: old.record,
          evidence: old.evidence,
          review: old.review,
          publication: old.publication,
        },
      ],
    };
    verifyCapture(store, next);
    next.issues = candidateIssues(next, nowMs);
    next.status = old.publication
      ? "PUBLISHED_REVISION_NEEDS_REVIEW"
      : "NEEDS_REVIEW";
    state.candidates[id] = next;
    store.save(state, "EDIT_INVALIDATED_APPROVAL", {
      id,
      revision: next.revision,
    });
    return {
      id,
      revision: next.revision,
      approvalInvalidated: true,
      issues: next.issues,
    };
  });

export const applyFounderFixes = (store, file, nowMs = Date.now()) =>
  store.exclusive(async () => {
    const packet = validatePacket("fixes", json(file)),
      state = store.read();
    check(
      packet.schemaVersion === "ichi-network-founder-fixes-v1" &&
        packet.batchRevision === state.revision &&
        packet.userInstructionRef?.trim() &&
        Array.isArray(packet.items),
      "EXACT_FOUNDER_FIXES_REQUIRED",
    );
    check(
      packet.items.length <= 50 &&
        new Set(packet.items.map((x) => x.id)).size === packet.items.length,
      "DUPLICATE_OR_OVERSIZED_FOUNDER_FIXES",
    );
    const results = [];
    for (const fix of packet.items) {
      const c = state.candidates[fix.id];
      check(
        c &&
          !c.takenDown &&
          fix.binding === binding(c) &&
          c.revision === fix.revision,
        "FOUNDER_FIX_CONTENT_CHANGED",
      );
      verifyCapture(store, c);
      const image = c.evidence.find(
        (e) => boardImageEvidence(e) && e.sha256 === fix.imageSha256,
      );
      check(
        image && fix.remaining && Object.keys(fix.remaining).length > 0,
        "FOUNDER_FIX_IMAGE_OR_COUNTS_MISSING",
      );
      for (const [code, count] of Object.entries(fix.remaining))
        check(
          c.record.boardFacts.tiers.some((t) => t.tierCode === code) &&
            Number.isSafeInteger(count) &&
            count >= 0,
          "INVALID_FOUNDER_TIER_COUNT",
        );
      const recognition = {
        schemaVersion: "ichi-network-human-recognition-v1",
        actor: "FOUNDER",
        userInstructionRef: packet.userInstructionRef,
        confirmedAt: new Date(nowMs).toISOString(),
        previousBinding: binding(c),
        recognitions: [
          {
            imageSha256: image.sha256,
            boardEvidenceKey: c.record.boardEvidenceKey,
            confirmedRemaining: fix.remaining,
          },
        ],
      };
      const bytes = Buffer.from(JSON.stringify(recognition, null, 2) + "\n"),
        sha = digest(bytes);
      const privateFile = path.join(store.dir, `human-fix-${sha}.json`);
      fs.writeFileSync(privateFile, bytes, { flag: "wx", mode: 0o600 });
      const history = {
        revision: c.revision,
        record: structuredClone(c.record),
        evidence: c.evidence,
        review: c.review,
        publication: c.publication,
      };
      c.record = structuredClone(c.record);
      c.record.sourceVersion = `founder-fix-${sha}`;
      for (const tier of c.record.boardFacts.tiers)
        if (Object.hasOwn(fix.remaining, tier.tierCode))
          tier.remainingTickets = fix.remaining[tier.tierCode];
      c.evidence = [
        ...c.evidence,
        store.importEvidence(
          { path: privateFile, sha256: sha, kind: "HUMAN_RECOGNITION" },
          store.dir,
        ),
      ];
      c.history.push(history);
      c.revision++;
      c.review = null;
      c.status = "NEEDS_REVIEW";
      c.issues = candidateIssues(c, nowMs);
      results.push({
        id: c.id,
        revision: c.revision,
        confirmationSha256: sha,
        binding: binding(c),
        approvalInvalidated: true,
      });
    }
    store.save(state, "EXACT_FOUNDER_NUMBER_FIXES", {
      results,
      inputSha256: digest(fs.readFileSync(file)),
      cloudWrites: 0,
    });
    return { results, cloudWrites: 0 };
  });

export const review = (store, decisionsFile, nowMs = Date.now()) =>
  store.exclusive(async () => {
    const state = store.read(),
      packet = validatePacket("review", json(decisionsFile));
    check(
      packet.schemaVersion === "ichi-network-review-v1" &&
        typeof packet.userInstructionRef === "string" &&
        packet.userInstructionRef.trim() &&
        Array.isArray(packet.decisions),
      "EXPLICIT_REVIEW_EVIDENCE_REQUIRED",
    );
    check(packet.batchRevision === state.revision, "REVIEW_BATCH_CHANGED");
    const seen = new Set();
    for (const d of packet.decisions) {
      const c = state.candidates[d.id];
      check(c && !c.takenDown && !seen.has(d.id), "INVALID_REVIEW_TARGET");
      seen.add(d.id);
      verifyCapture(store, c);
      check(
        d.revision === c.revision && d.binding === binding(c),
        "REVIEW_CONTENT_CHANGED",
      );
      check(
        ["APPROVE", "FIX_AND_APPROVE", "REJECT", "NEEDS_FIX"].includes(
          d.decision,
        ),
        "INVALID_REVIEW_DECISION",
      );
      check(
        instant(d.reviewedAt) &&
          Date.parse(d.reviewedAt) <= nowMs &&
          Date.parse(d.reviewedAt) >= Date.parse(c.record.fetchedAt) &&
          typeof d.reviewVersion === "string" &&
          d.reviewVersion.trim(),
        "INVALID_REVIEW_CLOCK_VERSION",
      );
      if (["APPROVE", "FIX_AND_APPROVE"].includes(d.decision)) {
        check(candidateIssues(c, nowMs).length === 0, "CANDIDATE_NEEDS_FIX");
        check(
          d.highPrizeTiersConfirmed === true &&
            d.locationConfirmed === true &&
            d.accuracyConfirmed === true,
          "EXPLICIT_FACT_CONFIRMATIONS_REQUIRED",
        );
        check(
          d.reviewedBy === "FOUNDER" ||
            (d.reviewedBy === "AGENT_USER_DELEGATION" &&
              typeof d.authorizationRef === "string" &&
              d.authorizationRef.trim()),
          "REVIEW_ACTOR_UNPROVEN",
        );
        check(
          d.rights?.decision === "PASS" &&
            [
              "OWNER_PERMISSION",
              "LICENSE",
              "PERMITTED_STRUCTURED_FACTS",
            ].includes(d.rights.basis) &&
            typeof d.rights.evidenceRef === "string" &&
            d.rights.evidenceRef.trim() &&
            typeof d.rights.decisionVersion === "string" &&
            d.rights.decisionVersion.trim() &&
            instant(d.rights.decidedAt) &&
            Date.parse(d.rights.decidedAt) <= nowMs,
          "INDEPENDENT_RIGHTS_REQUIRED",
        );
        check(
          c.record.note.text === null ||
            digest(d.noteSafety) === digest(c.record.note.safetyProvenance),
          "NOTE_SAFETY_NOT_CONFIRMED",
        );
        check(
          typeof d.curatorAuthorityId === "string" &&
            d.curatorAuthorityId.trim(),
          "CURATOR_REQUIRED",
        );
      }
      c.review = {
        ...d,
        evidenceRef: packet.userInstructionRef,
        packetSha256: digest(fs.readFileSync(decisionsFile)),
      };
      c.status = ["APPROVE", "FIX_AND_APPROVE"].includes(d.decision)
        ? "APPROVED"
        : d.decision;
    }
    store.save(state, "EXPLICIT_REVIEW", {
      count: seen.size,
      evidenceSha256: digest(fs.readFileSync(decisionsFile)),
    });
    return { reviewed: seen.size, cloudWrites: 0 };
  });

export const serverDecision = (c) => {
  const d = c.review,
    r = c.record,
    contentDigest = networkContentDigest(r);
  const common = {
    sourceId: r.sourceId,
    sourceVersion: r.sourceVersion,
    contentDigest,
  };
  return {
    approval: {
      ...common,
      reviewedBy: d.reviewedBy,
      ...(d.reviewedBy === "AGENT_USER_DELEGATION"
        ? { authorizationRef: d.authorizationRef }
        : {}),
      reviewDecision: d.decision,
      reviewVersion: d.reviewVersion,
      reviewedAt: d.reviewedAt,
      curatorAuthorityId: d.curatorAuthorityId,
      highPrizeTiersConfirmed: d.highPrizeTiersConfirmed,
    },
    rights: { ...common, ...d.rights, takedownOwnerId: r.takedownOwnerId },
    noteSafety: d.noteSafety ?? null,
  };
};
export const autoReview = (
  store,
  recognitionFile,
  grantFile,
  nowMs = Date.now(),
) =>
  store.exclusive(async () => {
    const state = store.read(),
      recognition = validatePacket("recognition", json(recognitionFile)),
      grant = validatePacket("grant", json(grantFile));
    check(
      grant.schemaVersion === "ichi-network-auto-delegation-v1" &&
        grant.actor === "USER" &&
        grant.scope === "ICHI_NETWORK_PHASE5" &&
        grant.mode === "AUTO_CLEAR_ESCALATE_UNCERTAIN" &&
        typeof grant.userInstructionRef === "string" &&
        grant.userInstructionRef.trim() &&
        typeof grant.authorizationRef === "string" &&
        grant.authorizationRef.trim() &&
        instant(grant.authorizedAt) &&
        Date.parse(grant.authorizedAt) <= nowMs &&
        grant.maxBatchSize > 0 &&
        grant.maxBatchSize <= 50 &&
        grant.operations?.includes("PUBLISH"),
      "AUTOMATIC_USER_DELEGATION_REQUIRED",
    );
    check(
      recognition.schemaVersion === "ichi-network-recognition-v1" &&
        Array.isArray(recognition.items),
      "INVALID_RECOGNITION_PACKET",
    );
    check(
      recognition.items.length <= 50 &&
        new Set(recognition.items.map((r) => r.id)).size ===
          recognition.items.length,
      "DUPLICATE_OR_OVERSIZED_RECOGNITION",
    );
    const results = [];
    for (const result of recognition.items) {
      const c = state.candidates[result.id];
      check(
        c &&
          !c.takenDown &&
          (!c.publication ||
            c.publication.sourceVersion !== c.record.sourceVersion),
        "AUTO_REVIEW_TARGET_UNAVAILABLE",
      );
      verifyCapture(store, c);
      const reasons = candidateIssues(c, nowMs);
      if (result.binding !== binding(c))
        reasons.push("RECOGNITION_CONTENT_CHANGED");
      const boardImage = c.evidence.find(
        (e) => boardImageEvidence(e) && e.sha256 === result.boardImageSha256,
      );
      if (!boardImage || result.complete !== true)
        reasons.push("RECOGNITION_INCOMPLETE");
      for (const tier of c.record.boardFacts?.tiers ?? []) {
        const p = result.tiers?.[tier.tierCode];
        const exact =
          p &&
          p.imageSha256 === result.boardImageSha256 &&
          p.remainingTickets === tier.remainingTickets &&
          typeof p.region === "string" &&
          p.region.trim();
        const tickets =
          p?.method === "VISIBLE_UNDRAWN_TICKETS" &&
          Array.isArray(p.ticketIds) &&
          p.ticketIds.length === tier.remainingTickets &&
          new Set(p.ticketIds).size === p.ticketIds.length &&
          p.ticketIds.every((id) => typeof id === "string" && id.trim());
        const printed =
          p?.method === "PRINTED_REMAINING" && p.labelConfirmed === true;
        const full =
          p?.method === "FULL_UNDRAWN" &&
          p.allTicketsPresent === true &&
          p.printedInitial === tier.remainingTickets;
        const human =
          p?.method === "HUMAN_CONFIRMATION" &&
          c.evidence.some(
            (e) =>
              e.kind === "HUMAN_RECOGNITION" &&
              e.sha256 === p.confirmationSha256 &&
              json(store.inside(e.path)).recognitions?.some(
                (h) =>
                  h.imageSha256 === result.boardImageSha256 &&
                  h.boardEvidenceKey === c.record.boardEvidenceKey &&
                  h.confirmedRemaining?.[tier.tierCode] ===
                    tier.remainingTickets,
              ),
          );
        if (!(exact && (tickets || printed || full || human)))
          reasons.push(`TIER_${tier.tierCode}_EVIDENCE_INCOMPLETE`);
      }
      const location = c.evidence.find(
        (e) =>
          e.kind === "LOCATION" && e.sha256 === result.locationEvidenceSha256,
      );
      if (
        !locationEvidenceValid(store, c, location) ||
        result.locationConfirmed !== true ||
        result.locationDigest !== networkLocationDigest(c.record.location)
      )
        reasons.push("LOCATION_UNCONFIRMED");
      if (result.highPrizeTiersConfirmed !== true)
        reasons.push("HIGH_PRIZE_UNCONFIRMED");
      const grand = result.grandPrizeEvidence;
      const expectedGrand = (c.record.boardFacts?.tiers ?? [])
        .filter((t) => t.isGrandPrize === true)
        .map((t) => t.tierCode)
        .sort();
      const humanGrand =
        grand?.method === "HUMAN_CONFIRMATION" &&
        c.evidence.some((e) => {
          if (
            e.kind !== "HUMAN_RECOGNITION" ||
            e.sha256 !== grand.confirmationSha256
          )
            return false;
          return json(store.inside(e.path)).recognitions?.some(
            (h) =>
              h.imageSha256 === result.boardImageSha256 &&
              h.boardEvidenceKey === c.record.boardEvidenceKey &&
              Array.isArray(h.confirmedGrandPrizeTierCodes) &&
              digest([...h.confirmedGrandPrizeTierCodes].sort()) ===
                digest(expectedGrand),
          );
        });
      if (
        !grand ||
        grand.imageSha256 !== result.boardImageSha256 ||
        !grand.region?.trim() ||
        !Array.isArray(grand.tierCodes) ||
        new Set(grand.tierCodes).size !== grand.tierCodes.length ||
        digest([...grand.tierCodes].sort()) !== digest(expectedGrand) ||
        !(grand.method === "VISIBLE_PRIZE_CLASSIFICATION" || humanGrand)
      )
        reasons.push("HIGH_PRIZE_EVIDENCE_INCOMPLETE");
      if (
        c.record.note.text !== null &&
        (result.noteSafetyConfirmed !== true ||
          digest(result.noteSafety) !== digest(c.record.note.safetyProvenance))
      )
        reasons.push("NOTE_UNCONFIRMED");
      if (
        result.rights?.decision !== "PASS" ||
        !["OWNER_PERMISSION", "LICENSE", "PERMITTED_STRUCTURED_FACTS"].includes(
          result.rights.basis,
        ) ||
        !result.rights.evidenceRef ||
        !result.rights.decisionVersion ||
        !instant(result.rights.decidedAt) ||
        Date.parse(result.rights.decidedAt) > nowMs
      )
        reasons.push("RIGHTS_UNPROVEN");
      if (!grant.curatorAuthorityId) reasons.push("CURATOR_UNPROVEN");
      if (reasons.length) {
        c.review = null;
        c.status = "NEEDS_FOUNDER";
        c.issues = [...new Set(reasons)];
      } else {
        c.review = {
          id: c.id,
          revision: c.revision,
          binding: binding(c),
          decision: "APPROVE",
          reviewedBy: "AGENT_USER_DELEGATION",
          authorizationRef: grant.authorizationRef,
          reviewedAt: new Date(nowMs).toISOString(),
          reviewVersion: `auto-evidence-${digest(result)}`,
          curatorAuthorityId: grant.curatorAuthorityId,
          highPrizeTiersConfirmed: true,
          accuracyConfirmed: true,
          locationConfirmed: true,
          rights: result.rights,
          noteSafety: result.noteSafety ?? null,
          evidenceRef: grant.userInstructionRef,
          recognitionPacketSha256: digest(fs.readFileSync(recognitionFile)),
          autoGrant: grant,
          autoGrantSha256: digest(fs.readFileSync(grantFile)),
        };
        c.status = "APPROVED";
        c.issues = [];
      }
      results.push({ id: c.id, status: c.status, reasons: c.issues });
    }
    store.save(state, "AUTO_CLEAR_ESCALATE_UNCERTAIN", { results });
    return { results, cloudWrites: 0 };
  });

export const workflowPolicy = (policy, candidates) => {
  const next = structuredClone(policy);
  for (const c of candidates) {
    const grant = c.review?.autoGrant;
    if (grant) {
      let d = next.network.workflowReviewDelegation;
      if (!d)
        d = next.network.workflowReviewDelegation = {
          version: NETWORK_WORKFLOW_DELEGATION_VERSION,
          authorizationRef: grant.authorizationRef,
          authorizedAt: grant.authorizedAt,
          approvedSources: [],
        };
      check(
        d.authorizationRef === grant.authorizationRef &&
          d.authorizedAt === grant.authorizedAt,
        "WORKFLOW_DELEGATION_CHANGED",
      );
      const entry = {
        sourceId: c.id,
        sourceVersion: c.record.sourceVersion,
        contentDigest: networkContentDigest(c.record),
      };
      const previous = d.approvedSources.find((e) => e.sourceId === c.id);
      check(
        !previous || digest(previous) === digest(entry),
        "WORKFLOW_SOURCE_REVISION_REQUIRES_CORRECTION",
      );
      if (!previous) d.approvedSources.push(entry);
    }
    if (c.record.location.accuracyMeters === null) {
      const legacy = [
        next.network.venueApproximation,
        next.network.collection50VenueApproximation,
      ]
        .filter(Boolean)
        .flatMap((x) => x.approvedSources);
      if (legacy.some((x) => x.sourceId === c.id)) continue;
      const v = (next.network.workflowVenueApproximation ??= {
        version: NETWORK_WORKFLOW_LOCATION_VERSION,
        ruleId: NETWORK_WORKFLOW_LOCATION_RULE,
        approvedSources: [],
      });
      const locationEntry = {
        sourceId: c.id,
        sourceVersion: c.record.sourceVersion,
        locationDigest: networkLocationDigest(c.record.location),
      };
      const old = v.approvedSources.find((e) => e.sourceId === c.id);
      check(
        !old || digest(old) === digest(locationEntry),
        "WORKFLOW_LOCATION_REVISION_REQUIRES_CORRECTION",
      );
      if (!old) v.approvedSources.push(locationEntry);
    }
  }
  check(networkPolicyValid(next.network), "WORKFLOW_POLICY_INVALID");
  return next;
};
const validateApproved = (store, c, nowMs) => {
  check(
    c &&
      !c.takenDown &&
      c.status === "APPROVED" &&
      c.review?.binding === binding(c),
    "EXACT_APPROVAL_REQUIRED",
  );
  verifyCapture(store, c);
  check(candidateIssues(c, nowMs).length === 0, "CANDIDATE_NEEDS_FIX");
};
const planItems = (state, ids) =>
  (
    ids ??
    Object.keys(state.candidates).filter(
      (id) => state.candidates[id].status === "APPROVED",
    )
  ).map((id) => state.candidates[id]);
export const preparePublish = async (
  store,
  adapter,
  ids,
  nowMs = Date.now(),
) => {
  const state = store.read(),
    candidates = planItems(state, ids);
  check(
    candidates.length > 0 && candidates.length <= 50,
    "EMPTY_OR_OVERSIZED_BATCH",
  );
  const snapshot = await adapter.snapshot();
  const desiredPolicy = workflowPolicy(snapshot.policy, candidates);
  for (const c of candidates) {
    validateApproved(store, c, nowMs);
    const built = buildNetworkObservation({
      record: c.record,
      ...serverDecision(c),
      policy: desiredPolicy,
      locationPolicy: snapshot.locationPolicy,
      nowMs,
    });
    check(built.ok, built.code ?? "SERVER_SCHEMA_DENIED");
    check(
      !c.publication || c.publication.sourceVersion === c.record.sourceVersion,
      "PUBLISHED_CORRECTION_REQUIRES_SEPARATE_EXACT_OPERATOR_PLAN",
    );
  }
  const plan = {
    schemaVersion: "ichi-network-operation-plan-v1",
    operation: "PUBLISH",
    environment: adapter.environment,
    snapshotDigest: snapshot.digest,
    desiredPolicyDigest: digest(desiredPolicy),
    items: candidates.map((c) => ({
      id: c.id,
      sourceVersion: c.record.sourceVersion,
      contentDigest: networkContentDigest(c.record),
      binding: binding(c),
    })),
  };
  return { ...plan, planDigest: digest(plan), candidates, desiredPolicy };
};
const authorize = (authorization, plan, nowMs) => {
  const body = { ...plan };
  delete body.candidates;
  delete body.desiredPolicy;
  delete body.planDigest;
  if (authorization?.schemaVersion === "ichi-network-auto-delegation-v1") {
    validatePacket("grant", authorization);
    check(
      plan.operation === "PUBLISH" &&
        authorization.actor === "USER" &&
        authorization.scope === "ICHI_NETWORK_PHASE5" &&
        authorization.mode === "AUTO_CLEAR_ESCALATE_UNCERTAIN" &&
        authorization.environment === plan.environment &&
        authorization.operations?.includes("PUBLISH") &&
        plan.items.length <= authorization.maxBatchSize &&
        instant(authorization.authorizedAt) &&
        Date.parse(authorization.authorizedAt) <= nowMs &&
        plan.candidates.every(
          (c) =>
            c.review.reviewedBy === "FOUNDER" ||
            (c.review.authorizationRef === authorization.authorizationRef &&
              digest(c.review.autoGrant) === digest(authorization)),
        ),
      "AUTOMATIC_SCOPE_AUTHORIZATION_REQUIRED",
    );
    return;
  }
  validatePacket("authorization", authorization);
  check(
    authorization?.schemaVersion === "ichi-network-external-authorization-v1" &&
      authorization.actor === "USER" &&
      typeof authorization.userInstructionRef === "string" &&
      authorization.userInstructionRef.trim() &&
      authorization.operation === plan.operation &&
      authorization.environment === plan.environment &&
      authorization.planDigest === digest(body) &&
      instant(authorization.expiresAt) &&
      Date.parse(authorization.expiresAt) > nowMs,
    "EXACT_EXTERNAL_AUTHORIZATION_REQUIRED",
  );
};
const readBack = async (adapter, c, receipt) => {
  check(
    receipt?.ok &&
      receipt.sourceVersion === c.record.sourceVersion &&
      receipt.contentDigest === networkContentDigest(c.record),
    "REMOTE_RECEIPT_MISMATCH",
  );
  const item = await adapter.publicDetail(receipt.publicLeadId);
  const expected = c.record.boardFacts,
    actual = item?.board;
  check(
    item?.sourceIcon === "OFFICIAL_NETWORK" &&
      actual?.ipName === expected.ipName &&
      actual.themeName === expected.themeName &&
      actual.pricePerDrawMinor === expected.pricePerDrawMinor &&
      actual.totalRemaining ===
        expected.tiers.reduce((sum, t) => sum + t.remainingTickets, 0) &&
      actual.tiers.length === expected.tiers.length &&
      actual.tiers.every(
        (t, i) =>
          t.tierCode === expected.tiers[i].tierCode &&
          t.remainingTickets === expected.tiers[i].remainingTickets &&
          t.isGrandPrize === expected.tiers[i].isGrandPrize,
      ) &&
      item.freshness.observedAt === networkTime(c.record).observedAt &&
      item.publicUntil === networkTime(c.record).publicUntil &&
      (item.venueNote ?? null) === c.record.note.text,
    "PUBLIC_READBACK_FAILED",
  );
  const forbidden =
    /"(?:sourceUrl|sourceId|sourceVersion|rights|curatorAuthorityId|ownerAccountId|openid|photoEvidence|accuracyMeters)"\s*:/u;
  check(!forbidden.test(JSON.stringify(item)), "PRIVATE_PUBLIC_FIELD_LEAKAGE");
  return item;
};

export const publish = (
  store,
  adapter,
  authorization,
  ids,
  nowMs = Date.now(),
) =>
  store.exclusive(async () => {
    const plan = await preparePublish(store, adapter, ids, nowMs);
    authorize(authorization, plan, nowMs);
    const state = store.read();
    await adapter.assertSafe(plan.snapshotDigest);
    const results = [];
    try {
      for (const selected of plan.candidates) {
        const c = state.candidates[selected.id];
        validateApproved(store, c, nowMs);
        let remote = await adapter.lookup(c.record);
        check(
          !["TAKEN_DOWN", "VERSION_CONFLICT", "UNKNOWN"].includes(remote.state),
          "REMOTE_STATE_REQUIRES_OPERATOR_REVIEW",
        );
        if (remote.state !== "ADMITTED") {
          check(
            c.attempts.filter(
              (a) =>
                a.operation === "PUBLISH" &&
                a.sourceVersion === c.record.sourceVersion,
            ).length < 4,
            "RETRY_BUDGET_EXHAUSTED",
          );
          c.attempts.push({
            operation: "PUBLISH",
            sourceVersion: c.record.sourceVersion,
            binding: binding(c),
            status: "INTENT_SAVED",
            planDigest: plan.planDigest,
          });
          store.save(state, "PUBLISH_INTENT", {
            id: c.id,
            sourceVersion: c.record.sourceVersion,
          });
          try {
            // The adapter re-reads policy and decisions in the backend boundary.
            await adapter.register(
              c.record,
              serverDecision(c),
              plan.desiredPolicy,
            );
            await adapter.admit(c.record);
            remote = await adapter.lookup(c.record);
          } catch (e) {
            c.attempts.at(-1).status =
              "UNKNOWN_COMMIT_CHECK_REMOTE_BEFORE_RETRY";
            c.attempts.at(-1).errorCode = /^[A-Z0-9_:-]+$/u.test(e.code ?? "")
              ? e.code
              : "REMOTE_OPERATION_FAILED";
            store.save(state, "PUBLISH_INTERRUPTED", {
              id: c.id,
              sourceVersion: c.record.sourceVersion,
            });
            throw e;
          }
        }
        check(remote.state === "ADMITTED", "REMOTE_ADMISSION_NOT_CONFIRMED");
        await readBack(adapter, c, remote.receipt);
        c.publication = {
          ...remote.receipt,
          verifiedAt: new Date(nowMs).toISOString(),
        };
        c.status = "PUBLISHED";
        if (c.attempts.at(-1)?.sourceVersion === c.record.sourceVersion)
          c.attempts.at(-1).status = "READBACK_PASS";
        store.save(state, "PUBLICATION_VERIFIED", {
          id: c.id,
          publicLeadId: c.publication.publicLeadId,
        });
        results.push({ id: c.id, publicLeadId: c.publication.publicLeadId });
      }
    } finally {
      await adapter.closeAndVerify();
    }
    return { status: "PUBLISHED_READBACK_PASS_GATES_CLOSED", results };
  });

export const resume = (store, adapter, ids, nowMs = Date.now()) =>
  store.exclusive(async () => {
    const state = store.read(),
      results = [];
    for (const id of ids ?? Object.keys(state.candidates)) {
      const c = state.candidates[id];
      check(c, "CANDIDATE_UNAVAILABLE");
      verifyCapture(store, c);
      const remote = await adapter.lookup(c.record);
      if (remote.state === "ADMITTED") {
        await readBack(adapter, c, remote.receipt);
        c.publication = {
          ...remote.receipt,
          verifiedAt: new Date(nowMs).toISOString(),
        };
        c.status = "PUBLISHED";
      } else if (remote.state === "TAKEN_DOWN") {
        c.takenDown = true;
        c.status = "TAKEN_DOWN";
      }
      results.push({ id, remoteState: remote.state });
    }
    store.save(state, "READ_ONLY_REMOTE_RECOVERY", { results, cloudWrites: 0 });
    return { results, cloudWrites: 0 };
  });

export const prepareCorrection = async (
  store,
  adapter,
  ids,
  nowMs = Date.now(),
) => {
  check(
    Array.isArray(ids) && ids.length === 1,
    "ONE_EXACT_CORRECTION_REQUIRED",
  );
  const c = store.read().candidates[ids[0]];
  validateApproved(store, c, nowMs);
  check(
    c.publication && c.publication.sourceVersion !== c.record.sourceVersion,
    "PUBLISHED_PRIOR_VERSION_REQUIRED",
  );
  const prior = c.history.findLast(
    (h) => h.record.sourceVersion === c.publication.sourceVersion,
  );
  check(
    prior && networkContentDigest(prior.record) === c.publication.contentDigest,
    "CORRECTION_PRIOR_VERSION_UNPROVEN",
  );
  const snapshot = await adapter.snapshot();
  const corrected = correctionPolicy({
    policy: snapshot.policy,
    record: c.record,
    decision: serverDecision(c),
    previous: c.publication,
  });
  check(corrected.ok, corrected.code);
  const body = {
    schemaVersion: "ichi-network-operation-plan-v1",
    operation: "CORRECT",
    environment: adapter.environment,
    snapshotDigest: snapshot.digest,
    desiredPolicyDigest: digest(corrected.policy),
    items: [
      {
        id: c.id,
        sourceVersion: c.record.sourceVersion,
        contentDigest: networkContentDigest(c.record),
        binding: binding(c),
        expected: c.publication,
      },
    ],
  };
  return {
    ...body,
    planDigest: digest(body),
    candidates: [c],
    desiredPolicy: corrected.policy,
  };
};
export const correct = (
  store,
  adapter,
  authorization,
  ids,
  nowMs = Date.now(),
) =>
  store.exclusive(async () => {
    const plan = await prepareCorrection(store, adapter, ids, nowMs);
    authorize(authorization, plan, nowMs);
    const state = store.read(),
      c = state.candidates[ids[0]];
    await adapter.assertSafe(plan.snapshotDigest);
    try {
      const remote = await adapter.lookup(c.record);
      check(
        ["VERSION_CONFLICT", "ADMITTED"].includes(remote.state),
        "CORRECTION_TARGET_UNAVAILABLE",
      );
      if (remote.state !== "ADMITTED") {
        c.attempts.push({
          operation: "CORRECT",
          sourceVersion: c.record.sourceVersion,
          status: "INTENT_SAVED",
          planDigest: plan.planDigest,
        });
        store.save(state, "CORRECTION_INTENT", {
          id: c.id,
          binding: binding(c),
        });
        try {
          await adapter.correct(
            c.record,
            serverDecision(c),
            c.publication,
            plan.desiredPolicy,
            plan.planDigest,
          );
        } catch (e) {
          c.attempts.at(-1).status = "UNKNOWN_COMMIT_CHECK_REMOTE_BEFORE_RETRY";
          store.save(state, "CORRECTION_INTERRUPTED", { id: c.id });
          throw e;
        }
      }
      const after = await adapter.lookup(c.record);
      check(
        after.state === "ADMITTED" &&
          after.receipt.publicLeadId === c.publication.publicLeadId &&
          after.receipt.boardInstanceId === c.publication.boardInstanceId,
        "CORRECTION_PUBLIC_ID_CHANGED",
      );
      await readBack(adapter, c, after.receipt);
      c.publication = {
        ...after.receipt,
        verifiedAt: new Date(nowMs).toISOString(),
      };
      c.status = "PUBLISHED";
      if (c.attempts.at(-1)?.operation === "CORRECT")
        c.attempts.at(-1).status = "READBACK_PASS";
      store.save(state, "CORRECTION_VERIFIED_ORIGINAL_CLOCK", {
        id: c.id,
        publicLeadId: c.publication.publicLeadId,
      });
    } finally {
      await adapter.closeAndVerify();
    }
    return {
      status: "CORRECTED_READBACK_PASS_GATES_CLOSED",
      publicLeadId: c.publication.publicLeadId,
    };
  });

export const prepareWithdrawal = async (store, adapter, ids) => {
  check(
    Array.isArray(ids) && ids.length > 0 && ids.length <= 50,
    "EXACT_WITHDRAWAL_IDS_REQUIRED",
  );
  const state = store.read(),
    snapshot = await adapter.snapshot();
  const items = ids.map((id) => {
    const c = state.candidates[id];
    check(c?.publication, "PUBLISHED_SOURCE_REQUIRED");
    return {
      id,
      sourceVersion: c.publication.sourceVersion,
      contentDigest: c.publication.contentDigest,
      takedownOwnerId: c.record.takedownOwnerId,
    };
  });
  const body = {
    schemaVersion: "ichi-network-operation-plan-v1",
    operation: "TAKEDOWN",
    environment: adapter.environment,
    snapshotDigest: snapshot.digest,
    items,
  };
  return { ...body, planDigest: digest(body) };
};
export const withdraw = (
  store,
  adapter,
  authorization,
  ids,
  nowMs = Date.now(),
) =>
  store.exclusive(async () => {
    const plan = await prepareWithdrawal(store, adapter, ids);
    authorize(authorization, plan, nowMs);
    const state = store.read();
    await adapter.assertSafe(plan.snapshotDigest);
    try {
      for (const item of plan.items) {
        const c = state.candidates[item.id];
        c.attempts.push({
          operation: "TAKEDOWN",
          sourceVersion: item.sourceVersion,
          status: "INTENT_SAVED",
        });
        store.save(state, "TAKEDOWN_INTENT", item);
        const current = await adapter.lookup(c.record);
        check(
          ["ADMITTED", "TAKEN_DOWN"].includes(current.state),
          "WITHDRAWAL_SOURCE_CHANGED",
        );
        if (current.state !== "TAKEN_DOWN")
          await adapter.takedown(c.record.sourceId, item);
        check(
          (await adapter.lookup(c.record)).state === "TAKEN_DOWN",
          "TAKEDOWN_READBACK_FAILED",
        );
        c.status = "TAKEN_DOWN";
        c.takenDown = true;
        c.attempts.at(-1).status = "READBACK_PASS";
        store.save(state, "TAKEDOWN_VERIFIED_NO_RESURRECTION", item);
      }
    } finally {
      await adapter.closeAndVerify();
    }
    return { status: "TAKEN_DOWN_VERIFIED_GATES_CLOSED", count: ids.length };
  });
