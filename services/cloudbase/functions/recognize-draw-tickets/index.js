"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

// Keep the proven CloudBase function identity while sharing the frozen
// Prize Ticket Verification implementation. The deployment builder copies
// that implementation directly into the recognize-draw-tickets artifact.
module.exports = require("../verify-prize-tickets");
