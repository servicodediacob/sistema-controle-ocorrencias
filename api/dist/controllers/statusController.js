"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastUpdateStatus = exports.updateLastProcessedTimestamp = void 0;
let lastProcessedTimestamp = null;
const updateLastProcessedTimestamp = () => {
    lastProcessedTimestamp = Date.now();
};
exports.updateLastProcessedTimestamp = updateLastProcessedTimestamp;
const getLastUpdateStatus = (_req, res) => {
    res.status(200).json({ lastProcessedTimestamp });
};
exports.getLastUpdateStatus = getLastUpdateStatus;
