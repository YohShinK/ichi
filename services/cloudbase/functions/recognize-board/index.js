"use strict";

const CONTRACT_VERSION = "1.0.0";

exports.main = async function main(event = {}) {
  const requestId =
    typeof event.requestId === "string" ? event.requestId : "unknown";

  return {
    contractVersion: CONTRACT_VERSION,
    requestId,
    status: "service_error",
    reasonCode: "RECOGNITION_PROVIDER_NOT_CONFIGURED",
    retryable: false,
    imagePersisted: false,
  };
};
