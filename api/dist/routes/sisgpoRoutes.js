"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const sisgpoController_1 = require("../controllers/sisgpoController");
const sisgpoProxyController_1 = require("../controllers/sisgpoProxyController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Garante que requisições JSON/urlencoded cheguem ao proxy com o body preenchido.
router.use(express_1.default.json());
router.use(express_1.default.urlencoded({ extended: true }));
router.get('/plantao/sso-token', authMiddleware_1.proteger, sisgpoController_1.issueSisgpoPlantaoToken);
router.get('/settings', authMiddleware_1.proteger, sisgpoController_1.getSisgpoSettings);
router.get('/viaturas/empenhadas', authMiddleware_1.proteger, sisgpoController_1.getSisgpoViaturasEmpenhadas);
router.all('/proxy/*', authMiddleware_1.proteger, sisgpoProxyController_1.proxySisgpoRequest);
exports.default = router;
