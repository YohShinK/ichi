"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Ajv2020 = require("ajv/dist/2020").default;
const domain = require(
  fs.existsSync(path.join(__dirname, "shared", "domain.js"))
    ? "./shared/domain"
    : "../../shared/domain",
);
const { TEXT_SAFETY_USAGE, reviewTextSafety } = require(
  fs.existsSync(path.join(__dirname, "shared", "text-safety-review.js"))
    ? "./shared/text-safety-review"
    : "../../shared/text-safety-review",
);

const MODEL = "qwen3.7-flash";
const PROMPT_VERSION = "prize-ticket-verification-v2";
const PROVIDER_SCHEMA_VERSION = "prize-ticket-verification-provider-v2";
const PROVIDER_TIMEOUT_MS = 45000;
const MODEL_MAX_PIXELS = 2097152;
const contractRoot = fs.existsSync(path.join(__dirname, "recognition-contract"))
  ? path.join(__dirname, "recognition-contract")
  : path.resolve(__dirname, "../../../../data/prize-ticket-verification");
const prompt = fs.readFileSync(
  path.join(contractRoot, "prompt", `${PROMPT_VERSION}.txt`),
  "utf8",
);
const schema = JSON.parse(
  fs.readFileSync(
    path.join(contractRoot, "schema", `${PROVIDER_SCHEMA_VERSION}.schema.json`),
    "utf8",
  ),
);
const validateProviderOutput = new Ajv2020({
  allErrors: true,
  strict: true,
}).compile(schema);
const stripMetadata = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const copy = { ...value };
  delete copy._id;
  return copy;
};
const getDocument = async (source, collection, id) => {
  try {
    return (
      stripMetadata(
        (await source.collection(collection).doc(id).get())?.data,
      ) || null
    );
  } catch (error) {
    if (/not exist|not found|-502005/u.test(String(error?.message || error)))
      return null;
    throw error;
  }
};
const response = (data) => ({ ok: true, data });
const failure = (code) => ({ ok: false, error: { code } });
const nowIso = () => new Date().toISOString();
const storageCleanupId = (fileId) =>
  `storage:${crypto.createHash("sha256").update(fileId).digest("hex").slice(0, 32)}`;
const noteHash = (value) =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");
const normalizeUserNote = (value) => {
  const userNote = String(value || "").trim();
  domain.assert(
    userNote.length > 0 && userNote.length <= 300,
    "USER_NOTE_REQUIRED",
  );
  return userNote;
};
const coordinatesOf = (value) => {
  const latitude = Number(value?.latitude);
  const longitude = Number(value?.longitude);
  return Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
    ? { latitude, longitude }
    : null;
};
const locationDistanceMeters = (left, right) => {
  const a = coordinatesOf(left);
  const b = coordinatesOf(right);
  domain.assert(a && b, "LOCATION_REVIEW_UNAVAILABLE");
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLatitude = radians(b.latitude - a.latitude);
  const dLongitude = radians(b.longitude - a.longitude);
  const latitude1 = radians(a.latitude);
  const latitude2 = radians(b.latitude);
  const haversine =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(dLongitude / 2) ** 2;
  return (
    6371008.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};
const normalizeTicketLocation = (value) => {
  const coordinates = coordinatesOf(value);
  const accuracy = Number(value?.accuracy);
  domain.assert(
    coordinates &&
      Number.isFinite(accuracy) &&
      accuracy >= 0 &&
      value?.source === "camera" &&
      typeof value?.capturedAt === "string" &&
      !Number.isNaN(Date.parse(value.capturedAt)) &&
      typeof value?.consentVersion === "string" &&
      value.consentVersion.trim(),
    "TICKET_LOCATION_INVALID",
  );
  return {
    ...coordinates,
    accuracy,
    source: "camera",
    capturedAt: value.capturedAt,
    consentVersion: value.consentVersion,
  };
};
const evaluateLocationGate = ({ boardLocation, ticketLocation, radius }) => {
  const configuredRadius = Number(radius);
  if (!Number.isFinite(configuredRadius) || configuredRadius <= 0)
    return {
      status: "LOCATION_PENDING",
      reasonCode: "LOCATION_REVIEW_UNAVAILABLE",
    };
  const distanceMeters = locationDistanceMeters(boardLocation, ticketLocation);
  return {
    status:
      distanceMeters <= configuredRadius
        ? "LOCATION_PASSED"
        : "LOCATION_FAILED",
    reasonCode:
      distanceMeters <= configuredRadius ? null : "LOCATION_OUT_OF_RANGE",
    distanceMeters,
    radiusMeters: configuredRadius,
    boardAccuracy: Number(boardLocation?.accuracy) || 0,
    ticketAccuracy: Number(ticketLocation?.accuracy) || 0,
  };
};
const reviewUserNote = async ({ cloud, openId, userNote, runtime }) => {
  const review = await reviewTextSafety({
    cloud,
    usage: TEXT_SAFETY_USAGE.MAP_NOTE,
    content: userNote,
    openId,
    reviewer: runtime.noteReviewer,
  });
  return { status: review.passed ? "NOTE_PASSED" : "NOTE_FAILED" };
};
const providerUrl = (workspaceId, region) =>
  `https://${workspaceId}.${region === "ap-southeast-1" ? "ap-southeast-1.maas.aliyuncs.com" : "cn-beijing.maas.aliyuncs.com"}/compatible-mode/v1/chat/completions`;

const canonicalizeTier = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toUpperCase();
  // A bare SP cannot deterministically identify SP1/SP2/... and therefore
  // must remain unresolved rather than turning into an unexpected tier.
  if (normalized === "SP") return null;
  const letter = /^([A-Z])(?:\s*(?:賞|奖|獎|赏券))?$/u.exec(normalized);
  if (letter) return letter[1];
  const label = /^([A-Z])\s*(?:賞|奖|獎|赏券)/u.exec(normalized);
  if (label) return label[1];
  return normalized || null;
};
const observedFromTickets = (provider) => {
  if (provider.evidenceType === "uncertain")
    return {
      evidenceType: "uncertain",
      uncertain: true,
      invalid: false,
      total: 0,
      tierCounts: {},
      unknownTickets: 0,
    };
  if (provider.evidenceType !== "physical_tickets")
    return {
      evidenceType: "digital_or_screen",
      uncertain: false,
      invalid: true,
      total: 0,
      tierCounts: {},
      unknownTickets: 0,
    };
  const indices = new Set();
  const tierCounts = {};
  let unknownTickets = 0;
  for (const ticket of provider.tickets) {
    if (indices.has(ticket.ticketIndex))
      throw Object.assign(new Error("duplicate ticket index"), {
        code: "PRIZE_TICKET_SCHEMA_INVALID",
      });
    indices.add(ticket.ticketIndex);
    const tier = canonicalizeTier(ticket.tierCode || ticket.tierRaw);
    if (!tier) unknownTickets += 1;
    else tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }
  return {
    evidenceType: "physical_tickets",
    uncertain: false,
    invalid: false,
    total: provider.tickets.length,
    tierCounts,
    unknownTickets,
  };
};
const exactReconcile = (expected, observed) => {
  if (observed.uncertain) return { status: "NEEDS_REVIEW", mismatches: [] };
  if (observed.invalid || observed.total === 0)
    return { status: "INVALID_EVIDENCE", mismatches: [] };
  if (observed.unknownTickets)
    return { status: "NEEDS_REVIEW", mismatches: [] };
  const allTiers = new Set([
    ...Object.keys(expected.tierCounts),
    ...Object.keys(observed.tierCounts),
  ]);
  const mismatches = [...allTiers].sort().flatMap((tier) =>
    expected.tierCounts[tier] === observed.tierCounts[tier]
      ? []
      : [
          {
            tier,
            expected: expected.tierCounts[tier] || 0,
            observed: observed.tierCounts[tier] || 0,
          },
        ],
  );
  if (expected.total !== observed.total)
    mismatches.unshift({
      tier: "__TOTAL__",
      expected: expected.total,
      observed: observed.total,
    });
  return { status: mismatches.length ? "MISMATCH" : "VERIFIED", mismatches };
};
const expectedFromAuthoritativeRecord = (record, submissionVersion) => {
  domain.assert(
    Number(record?.authoritativeDrawSubmissionVersion || 0) ===
      submissionVersion,
    "AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE",
  );
  const events = record?.authoritativeDrawEvents;
  domain.assert(
    Array.isArray(events) && events.length > 0,
    "AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE",
  );
  const tierCounts = {};
  for (const event of events) {
    const tier = canonicalizeTier(event?.tierCode);
    domain.assert(tier && tier !== "SP", "AUTHORITATIVE_DRAW_RECORD_INVALID");
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }
  return { total: events.length, tierCounts };
};
const authoritativeSubmissionFacts = (event, observation, version) => {
  const source = event.authoritativeDrawEvents;
  if (!Array.isArray(source) || source.length === 0) return null;
  const seen = new Set();
  const authoritativeDrawEvents = source.map((item) => {
    const eventId = String(item?.eventId || "").trim();
    const tierCode = domain.normalizeTierId(item?.tierCode);
    domain.assert(
      eventId && !seen.has(eventId) && tierCode !== "OTHER",
      "AUTHORITATIVE_DRAW_RECORD_INVALID",
    );
    seen.add(eventId);
    return {
      eventId,
      tierCode,
      ...(Number.isFinite(item?.occurredAt)
        ? { occurredAt: Number(item.occurredAt) }
        : {}),
    };
  });
  const counts = authoritativeDrawEvents.reduce((result, item) => {
    result[item.tierCode] = (result[item.tierCode] || 0) + 1;
    return result;
  }, {});
  return {
    authoritativeDrawEvents,
    authoritativeDrawSubmissionVersion: version,
    finalSnapshot: domain.deriveFinalSnapshot(
      observation.initialSnapshot,
      counts,
    ),
  };
};
const callProvider = async ({
  fetchImpl,
  apiKey,
  workspaceId,
  region,
  imageUrl,
  metrics,
}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const result = await fetchImpl(providerUrl(workspaceId, region), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
                max_pixels: MODEL_MAX_PIXELS,
              },
            ],
          },
        ],
        enable_thinking: false,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!result.ok)
      throw Object.assign(new Error("provider_http"), {
        code: "PRIZE_TICKET_PROVIDER_FAILED",
      });
    const payload = await result.json();
    if (metrics) {
      metrics.providerLatencyMs = Date.now() - startedAt;
      metrics.providerHttpStatus = result.status;
      metrics.providerRequestId =
        typeof payload?.id === "string" ? payload.id : null;
    }
    const content = payload?.choices?.[0]?.message?.content;
    domain.assert(
      typeof content === "string" && content.trim(),
      "PRIZE_TICKET_SCHEMA_INVALID",
    );
    const output = JSON.parse(content);
    domain.assert(
      validateProviderOutput(output),
      "PRIZE_TICKET_SCHEMA_INVALID",
    );
    if (metrics) {
      metrics.providerAjvPass = true;
      metrics.providerRawTicketCount = output.tickets.length;
      metrics.providerEvidenceType = output.evidenceType;
    }
    return output;
  } finally {
    if (metrics && metrics.providerLatencyMs === undefined)
      metrics.providerLatencyMs = Date.now() - startedAt;
    clearTimeout(timeout);
  }
};
const main = async (event = {}, runtime = {}) => {
  const cloud = runtime.cloud || require("wx-server-sdk");
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  const db = cloud.database();
  const env = runtime.env || process.env;
  const recordId = String(event.recordId || "");
  const boardId = String(event.boardId || "");
  const version = Number(event.submissionVersion);
  const fileId = String(event.imageFileId || "");
  const captureSource = String(event.captureSource || "");
  const capturedAt = Number(event.capturedAt);
  const action =
    event.action === "submit"
      ? "submit"
      : event.action === "verify"
        ? "verify"
        : event.action === "review-note"
          ? "review-note"
          : "legacy_submit_and_verify";
  const metrics = {};
  const logger = runtime.logger || console;
  let claimed = false;
  let terminalCompleted = false;
  try {
    domain.assert(
      /^record_[a-f0-9]{32}$/u.test(recordId) && boardId,
      "RECORD_NOT_FOUND",
    );
    domain.assert(
      Number.isSafeInteger(version) && version > 0,
      "SUBMISSION_VERSION_INVALID",
    );
    if (action !== "review-note")
      domain.assert(
        version !== 1 || captureSource === "camera",
        "INITIAL_EVIDENCE_CAMERA_REQUIRED",
      );
    const context = cloud.getWXContext();
    const identityId = domain.hashIdentity({
      appId: context.APPID,
      openId: context.OPENID,
      secret: env.IDENTITY_HMAC_KEY,
    });
    const identity = await getDocument(db, "wechatIdentities", identityId);
    const observation = await getDocument(
      db,
      "observationCandidates",
      recordId,
    );
    domain.assert(
      identity?.accountId &&
        observation?.ownerAccountId === identity.accountId &&
        observation.boardId === boardId,
      "RECORD_NOT_FOUND",
    );
    if (action !== "review-note")
      domain.assert(
        fileId.includes(
          `/recognition-temp/prize-ticket-${recordId}-v${version}/`,
        ),
        "PRIZE_TICKET_IMAGE_INVALID",
      );
    let userNote = "";
    const verificationId = `prize-ticket:${recordId}:${boardId}:${version}`;
    const submission = await db.runTransaction(async (tx) => {
      const existing = await getDocument(tx, "drawSubmissions", verificationId);
      const fresh = await getDocument(tx, "observationCandidates", recordId);
      domain.assert(
        fresh?.ownerAccountId === identity.accountId &&
          fresh.boardId === boardId,
        "RECORD_NOT_FOUND",
      );
      domain.assert(fresh.status !== "deleting", "RECORD_DELETED");
      if (version < Number(fresh.latestPrizeTicketSubmissionVersion || 0))
        return { superseded: true };
      const previous =
        version > 1
          ? await getDocument(
              tx,
              "drawSubmissions",
              `prize-ticket:${recordId}:${boardId}:${version - 1}`,
            )
          : null;
      userNote = normalizeUserNote(
        action === "review-note"
          ? event.userNote
          : event.userNote || existing?.userNote || previous?.userNote,
      );
      const authoritative =
        authoritativeSubmissionFacts(event, fresh, version) ||
        (previous?.authoritativeDrawEvents
          ? authoritativeSubmissionFacts(
              { authoritativeDrawEvents: previous.authoritativeDrawEvents },
              fresh,
              version,
            )
          : null);
      const inheritedLocationReview =
        existing?.locationReview?.status === "LOCATION_PASSED"
          ? existing.locationReview
          : previous?.locationReview?.status === "LOCATION_PASSED"
            ? previous.locationReview
            : null;
      const ticketLocation = inheritedLocationReview
        ? existing?.ticketLocation || previous?.ticketLocation
        : normalizeTicketLocation(event.ticketLocation);
      const locationReview =
        inheritedLocationReview ||
        evaluateLocationGate({
          boardLocation: fresh.location,
          ticketLocation,
          radius: env.PRIZE_TICKET_LOCATION_RADIUS_METERS,
        });
      if (existing) {
        if (authoritative && existing.authoritativeDrawEvents)
          domain.assert(
            JSON.stringify(existing.authoritativeDrawEvents) ===
              JSON.stringify(authoritative.authoritativeDrawEvents),
            "SUBMISSION_VERSION_CONFLICT",
          );
        if (existing.result && (action === "submit" || action === "verify"))
          return { existing };
        if (action !== "review-note")
          domain.assert(
            existing.imageFileId === fileId,
            "SUBMISSION_FILE_MISMATCH",
          );
        if (action !== "review-note")
          domain.assert(
            existing.userNote === userNote,
            "SUBMISSION_NOTE_MISMATCH",
          );
        if (!existing.authoritativeDrawEvents) {
          domain.assert(authoritative, "AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE");
          await tx
            .collection("drawSubmissions")
            .doc(verificationId)
            .update({
              data: {
                ...authoritative,
                userNote,
                userNoteHash: noteHash(userNote),
                ticketLocation,
                locationReview,
                uploadedAt:
                  existing.uploadedAt ||
                  existing.submittedAt ||
                  existing.createdAt ||
                  nowIso(),
                updatedAt: nowIso(),
              },
            });
          return {
            existing: {
              ...existing,
              ...authoritative,
              userNote,
              userNoteHash: noteHash(userNote),
              ticketLocation,
              locationReview,
            },
          };
        }
        return { existing };
      }
      domain.assert(
        action !== "verify" && action !== "review-note",
        "PENDING_SUBMISSION_NOT_FOUND",
      );
      domain.assert(authoritative, "AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE");
      domain.assert(
        version === Number(fresh.latestPrizeTicketSubmissionVersion || 0) + 1,
        "SUBMISSION_VERSION_GAP",
      );
      const timestamp = nowIso();
      await tx
        .collection("drawSubmissions")
        .doc(verificationId)
        .set({
          data: {
            verificationId,
            recordId,
            boardId,
            submissionVersion: version,
            ownerAccountId: identity.accountId,
            status:
              locationReview.status === "LOCATION_PASSED"
                ? "PHOTO_PENDING"
                : locationReview.status,
            captureSource,
            imageFileId: fileId,
            ...authoritative,
            userNote,
            userNoteHash: noteHash(userNote),
            ticketLocation,
            locationReview,
            uploadedAt: timestamp,
            submittedAt: timestamp,
            ...(version === 1
              ? {
                  capturedAt,
                  albumSaveWarning: event.albumSaveWarning === true,
                }
              : {}),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await tx
        .collection("deletionJobs")
        .doc(storageCleanupId(fileId))
        .set({
          data: {
            ownerAccountId: identity.accountId,
            targetType: "storage-object",
            targetId: storageCleanupId(fileId),
            fileId,
            reason: "prize_ticket_temp_expiry",
            verificationId,
            recordId,
            boardId,
            submissionVersion: version,
            status: "pending",
            requestedAt: timestamp,
            deadlineAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
            nextAttemptAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
            attempts: 0,
            updatedAt: timestamp,
          },
        });
      await tx
        .collection("observationCandidates")
        .doc(recordId)
        .update({
          data: {
            latestPrizeTicketSubmissionVersion: version,
            currentVerificationVersion: version,
            prizeTicketVerificationStatus:
              locationReview.status === "LOCATION_PASSED"
                ? "PHOTO_PENDING"
                : locationReview.status,
            userNote,
            updatedAt: timestamp,
          },
        });
      return {
        pending: true,
        status:
          locationReview.status === "LOCATION_PASSED"
            ? "PHOTO_PENDING"
            : locationReview.status,
        locationReview,
      };
    });
    if (submission.superseded)
      return response({
        recordId,
        boardId,
        submissionVersion: version,
        status: "SUPERSEDED",
      });
    if (action === "submit") {
      if (submission.existing?.result)
        return response({ ...submission.existing.result, idempotent: true });
      terminalCompleted =
        (submission.existing?.status || submission.status) ===
        "LOCATION_FAILED";
      if (terminalCompleted)
        await db
          .collection("drawSubmissions")
          .doc(verificationId)
          .update({ data: { imageFileId: null, updatedAt: nowIso() } });
      return response({
        recordId,
        boardId,
        submissionVersion: version,
        status:
          submission.existing?.status || submission.status || "PHOTO_PENDING",
        reasonCode:
          submission.existing?.locationReview?.reasonCode ||
          submission.locationReview?.reasonCode ||
          null,
        idempotent: Boolean(submission.existing),
      });
    }

    if (action === "review-note") {
      const active = submission.existing;
      domain.assert(active, "PENDING_SUBMISSION_NOT_FOUND");
      domain.assert(
        active.locationReview?.status === "LOCATION_PASSED" &&
          active.photoReview?.status === "PHOTO_PASSED",
        "NOTE_GATE_NOT_READY",
      );
      if (
        active.noteReview?.status === "NOTE_PASSED" &&
        active.userNoteHash === noteHash(userNote)
      )
        return response({
          ...(active.result || {}),
          recordId,
          boardId,
          submissionVersion: version,
          status: "APPROVED",
          idempotent: true,
        });
      const requestedNoteHash = noteHash(userNote);
      await db.runTransaction(async (tx) => {
        const freshSubmission = await getDocument(
          tx,
          "drawSubmissions",
          verificationId,
        );
        const freshObservation = await getDocument(
          tx,
          "observationCandidates",
          recordId,
        );
        domain.assert(
          freshSubmission?.locationReview?.status === "LOCATION_PASSED" &&
            freshSubmission?.photoReview?.status === "PHOTO_PASSED" &&
            freshObservation?.status !== "deleting" &&
            Number(freshObservation?.latestPrizeTicketSubmissionVersion) ===
              version,
          "SUBMISSION_SUPERSEDED",
        );
        await tx
          .collection("drawSubmissions")
          .doc(verificationId)
          .update({
            data: {
              userNote,
              userNoteHash: requestedNoteHash,
              noteReview: {
                status: "NOTE_PENDING",
                reviewedAt: null,
              },
              status: "NOTE_PENDING",
              result: {
                ...(freshSubmission.result || {}),
                status: "NOTE_PENDING",
                reasonCode: null,
              },
              approvedAt: null,
              updatedAt: nowIso(),
            },
          });
        await tx
          .collection("observationCandidates")
          .doc(recordId)
          .update({
            data: {
              userNote,
              verificationStatus: "NOTE_PENDING",
              prizeTicketVerificationStatus: "NOTE_PENDING",
              approvedAt: null,
              status: "private_saved",
              updatedAt: nowIso(),
            },
          });
      });
      const noteReview = await reviewUserNote({
        cloud,
        openId: context.OPENID,
        userNote,
        runtime,
      });
      const status =
        noteReview.status === "NOTE_PASSED" ? "APPROVED" : noteReview.status;
      const timestamp = nowIso();
      const result = {
        ...(active.result || {}),
        recordId,
        boardId,
        submissionVersion: version,
        status,
        reasonCode: noteReview.reasonCode || null,
      };
      await db.runTransaction(async (tx) => {
        const fresh = await getDocument(tx, "observationCandidates", recordId);
        const freshSubmission = await getDocument(
          tx,
          "drawSubmissions",
          verificationId,
        );
        domain.assert(
          fresh?.status !== "deleting" &&
            Number(fresh?.latestPrizeTicketSubmissionVersion) === version &&
            freshSubmission?.userNoteHash === requestedNoteHash,
          "SUBMISSION_SUPERSEDED",
        );
        await tx
          .collection("drawSubmissions")
          .doc(verificationId)
          .update({
            data: {
              userNote,
              userNoteHash: requestedNoteHash,
              noteReview: { ...noteReview, reviewedAt: timestamp },
              status,
              result,
              ...(status === "APPROVED" ? { approvedAt: timestamp } : {}),
              updatedAt: timestamp,
            },
          });
        await tx
          .collection("observationCandidates")
          .doc(recordId)
          .update({
            data: {
              userNote,
              verificationStatus: status,
              prizeTicketVerificationStatus: status,
              ...(status === "APPROVED"
                ? {
                    latestVerifiedPrizeTicketSubmissionVersion: version,
                    status: "uploaded",
                    approvedAt: timestamp,
                  }
                : {}),
              updatedAt: timestamp,
            },
          });
      });
      terminalCompleted = true;
      return response(result);
    }

    if (submission.existing?.result) {
      if (
        (submission.existing.result.status === "VERIFIED" &&
          !submission.existing.verifiedAt) ||
        !submission.existing.uploadedAt
      )
        await db
          .collection("drawSubmissions")
          .doc(verificationId)
          .update({
            data: {
              ...(submission.existing.result.status === "VERIFIED" &&
              !submission.existing.verifiedAt
                ? { verifiedAt: submission.existing.completedAt || nowIso() }
                : {}),
              ...(!submission.existing.uploadedAt
                ? {
                    uploadedAt:
                      submission.existing.submittedAt ||
                      submission.existing.createdAt ||
                      nowIso(),
                  }
                : {}),
              updatedAt: nowIso(),
            },
          });
      return response({ ...submission.existing.result, idempotent: true });
    }
    const activeSubmission = submission.existing || {
      status: "PHOTO_PENDING",
      imageFileId: fileId,
    };
    if (
      activeSubmission.status === "LOCATION_PENDING" ||
      activeSubmission.status === "LOCATION_FAILED"
    ) {
      terminalCompleted = activeSubmission.status === "LOCATION_FAILED";
      return response({
        recordId,
        boardId,
        submissionVersion: version,
        status: activeSubmission.status,
        reasonCode:
          activeSubmission.locationReview?.reasonCode ||
          "LOCATION_REVIEW_UNAVAILABLE",
        expected: { total: 0, tierCounts: {} },
        observed: { total: 0, tierCounts: {}, unknownTickets: 0 },
        mismatches: [],
        idempotent: true,
      });
    }
    if (
      activeSubmission.status === "PROCESSING" &&
      Date.now() -
        Date.parse(String(activeSubmission.processingStartedAt || "")) <
        65_000
    )
      return response({
        recordId,
        boardId,
        submissionVersion: version,
        status: "PENDING",
        idempotent: true,
      });
    domain.assert(
      activeSubmission.status === "PHOTO_PENDING" ||
        activeSubmission.status === "PROVIDER_FAILED" ||
        activeSubmission.status === "PROCESSING",
      "SUBMISSION_ALREADY_COMPLETED",
    );
    await db
      .collection("drawSubmissions")
      .doc(verificationId)
      .update({
        data: { status: "PROCESSING", processingStartedAt: nowIso() },
      });
    claimed = true;
    const expected = expectedFromAuthoritativeRecord(activeSubmission, version);
    domain.assert(
      env.DASHSCOPE_API_KEY && env.DASHSCOPE_WORKSPACE_ID,
      "PRIZE_TICKET_PROVIDER_FAILED",
    );
    const temp = await cloud.getTempFileURL({
      fileList: [{ fileID: fileId, maxAge: 300 }],
    });
    const imageUrl = String(temp?.fileList?.[0]?.tempFileURL || "");
    domain.assert(
      imageUrl.startsWith("https://"),
      "PRIZE_TICKET_IMAGE_URL_UNAVAILABLE",
    );
    logger.info?.("ICHI_PRIZE_TICKET_PROVIDER", {
      stage: "provider_start",
      verificationId,
      recordId,
      boardId,
      submissionVersion: version,
    });
    const provider = await callProvider({
      fetchImpl: runtime.fetchImpl || fetch,
      apiKey: env.DASHSCOPE_API_KEY,
      workspaceId: env.DASHSCOPE_WORKSPACE_ID,
      region: env.DASHSCOPE_REGION || "cn-beijing",
      imageUrl,
      metrics,
    });
    logger.info?.("ICHI_PRIZE_TICKET_PROVIDER", {
      stage: "provider_end",
      verificationId,
      recordId,
      boardId,
      submissionVersion: version,
      providerRequestId: metrics.providerRequestId || null,
      providerHttpStatus: metrics.providerHttpStatus || null,
      providerLatencyMs: metrics.providerLatencyMs || 0,
    });
    const observed = observedFromTickets(provider);
    const reconciliation = exactReconcile(expected, observed);
    const photoReview = {
      status:
        reconciliation.status === "VERIFIED" ? "PHOTO_PASSED" : "PHOTO_FAILED",
      providerResult: reconciliation.status,
      reasonCode:
        reconciliation.status === "VERIFIED"
          ? null
          : `PHOTO_${reconciliation.status}`,
      reviewedAt: nowIso(),
    };
    const noteReview =
      photoReview.status === "PHOTO_PASSED"
        ? await reviewUserNote({
            cloud,
            openId: context.OPENID,
            userNote: activeSubmission.userNote,
            runtime,
          })
        : null;
    const gateStatus =
      photoReview.status === "PHOTO_FAILED"
        ? "PHOTO_FAILED"
        : noteReview.status === "NOTE_PASSED"
          ? "APPROVED"
          : noteReview.status;
    const result = {
      verificationId,
      recordId,
      boardId,
      submissionVersion: version,
      status: gateStatus,
      photoStatus: reconciliation.status,
      reasonCode: photoReview.reasonCode || noteReview?.reasonCode || null,
      expected,
      observed: {
        evidenceType: observed.evidenceType,
        total: observed.total,
        tierCounts: observed.tierCounts,
        unknownTickets: observed.unknownTickets,
      },
      mismatches: reconciliation.mismatches,
    };
    let returnedResult = result;
    await db.runTransaction(async (tx) => {
      const fresh = await getDocument(tx, "observationCandidates", recordId);
      if (!fresh || fresh.status === "deleting") {
        returnedResult = { ...result, status: "SUPERSEDED" };
        await tx
          .collection("drawSubmissions")
          .doc(verificationId)
          .update({
            data: {
              status: "SUPERSEDED",
              completedAt: nowIso(),
              updatedAt: nowIso(),
            },
          });
        return;
      }
      const status =
        Number(fresh.latestPrizeTicketSubmissionVersion) > version
          ? "SUPERSEDED"
          : gateStatus;
      returnedResult = { ...result, status };
      await tx
        .collection("drawSubmissions")
        .doc(verificationId)
        .update({
          data: {
            status,
            result: { ...result, status },
            imageFileId: null,
            photoReview,
            ...(noteReview
              ? { noteReview: { ...noteReview, reviewedAt: nowIso() } }
              : {}),
            providerMetadata: {
              model: MODEL,
              promptVersion: PROMPT_VERSION,
              providerSchemaVersion: PROVIDER_SCHEMA_VERSION,
            },
            providerDiagnostics: {
              requestId: metrics.providerRequestId || null,
              latencyMs: metrics.providerLatencyMs || 0,
              httpStatus: metrics.providerHttpStatus || null,
              ajvPass: metrics.providerAjvPass === true,
              rawTicketCount: metrics.providerRawTicketCount || 0,
              evidenceType: metrics.providerEvidenceType || null,
            },
            completedAt: nowIso(),
            verifiedAt: photoReview.status === "PHOTO_PASSED" ? nowIso() : null,
            approvedAt: status === "APPROVED" ? nowIso() : null,
          },
        });
      if (Number(fresh.latestPrizeTicketSubmissionVersion) === version)
        await tx
          .collection("observationCandidates")
          .doc(recordId)
          .update({
            data: {
              ...(status === "APPROVED"
                ? {
                    latestVerifiedPrizeTicketSubmissionVersion: version,
                    status: "uploaded",
                    approvedAt: nowIso(),
                  }
                : {}),
              currentVerificationVersion: version,
              verificationStatus: status,
              prizeTicketVerificationStatus: status,
              userNote: activeSubmission.userNote,
              updatedAt: nowIso(),
            },
          });
    });
    terminalCompleted = true;
    return response({
      ...returnedResult,
      providerDiagnostics: {
        requestId: metrics.providerRequestId || null,
        latencyMs: metrics.providerLatencyMs || 0,
        httpStatus: metrics.providerHttpStatus || null,
        ajvPass: metrics.providerAjvPass === true,
        rawTicketCount: metrics.providerRawTicketCount || 0,
        evidenceType: metrics.providerEvidenceType || null,
      },
    });
  } catch (error) {
    const code =
      error?.name === "AbortError"
        ? "PRIZE_TICKET_PROVIDER_FAILED"
        : error?.code || "PRIZE_TICKET_PROVIDER_FAILED";
    if (claimed) {
      try {
        await db.runTransaction(async (tx) => {
          await tx
            .collection("drawSubmissions")
            .doc(`prize-ticket:${recordId}:${boardId}:${version}`)
            .update({
              data: {
                status: "PHOTO_FAILED",
                imageFileId: null,
                errorCode: code,
                updatedAt: nowIso(),
              },
            });
          const fresh = await getDocument(
            tx,
            "observationCandidates",
            recordId,
          );
          if (
            fresh?.status !== "deleting" &&
            Number(fresh?.latestPrizeTicketSubmissionVersion) === version
          )
            await tx
              .collection("observationCandidates")
              .doc(recordId)
              .update({
                data: {
                  currentVerificationVersion: version,
                  verificationStatus: "PHOTO_FAILED",
                  prizeTicketVerificationStatus: "PHOTO_FAILED",
                  updatedAt: nowIso(),
                },
              });
        });
      } catch {
        // The immutable processing record is recoverable by the same-version retry.
      }
    }
    logger.error("ICHI_PRIZE_TICKET_VERIFICATION", {
      code,
      recordId,
      boardId,
      submissionVersion: version,
      providerLatencyMs: metrics.providerLatencyMs || 0,
      providerHttpStatus: metrics.providerHttpStatus || null,
    });
    if (claimed) terminalCompleted = true;
    if (claimed)
      return response({
        recordId,
        boardId,
        submissionVersion: version,
        status: "PHOTO_FAILED",
        expected: { total: 0, tierCounts: {} },
        observed: { total: 0, tierCounts: {}, unknownTickets: 0 },
        mismatches: [],
        errorCode: code,
        providerDiagnostics: {
          requestId: metrics.providerRequestId || null,
          latencyMs: metrics.providerLatencyMs || 0,
          httpStatus: metrics.providerHttpStatus || null,
          ajvPass: metrics.providerAjvPass === true,
          rawTicketCount: metrics.providerRawTicketCount || 0,
          evidenceType: metrics.providerEvidenceType || null,
        },
      });
    return failure(code);
  } finally {
    if (terminalCompleted && fileId)
      try {
        await cloud.deleteFile({ fileList: [fileId] });
        try {
          await db
            .collection("deletionJobs")
            .doc(storageCleanupId(fileId))
            .update({
              data: {
                status: "completed",
                completedAt: nowIso(),
                updatedAt: nowIso(),
              },
            });
        } catch {
          // Historical submissions may predate durable storage cleanup jobs.
        }
      } catch {
        try {
          await db
            .collection("deletionJobs")
            .doc(storageCleanupId(fileId))
            .update({
              data: {
                status: "retry",
                nextAttemptAt: nowIso(),
                updatedAt: nowIso(),
              },
            });
        } catch {
          // Client cleanup and the repeatable storage audit remain guards for
          // submissions created before durable cleanup registration existed.
        }
      }
  }
};
exports.main = main;
exports.__test = {
  canonicalizeTier,
  observedFromTickets,
  exactReconcile,
  callProvider,
  expectedFromAuthoritativeRecord,
  authoritativeSubmissionFacts,
  noteHash,
  normalizeUserNote,
  normalizeTicketLocation,
  locationDistanceMeters,
  evaluateLocationGate,
  reviewUserNote,
  isDeletedObservation: (record) => !record || record.status === "deleting",
};
