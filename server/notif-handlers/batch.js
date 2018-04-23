const { handleBatch } = require("../jobs");

function batchHandler(ctx, messages) {
  return handleBatch(ctx, messages);
}

module.exports = batchHandler;
