// src/routes/evidence.js
import { Router } from "express";
import * as evidenceCtrl from "../controllers/evidenceController.js";
import { validatePagination, validateInvestigationId } from "../validators/investigationValidator.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = Router({ mergeParams: true });

router.get("/", validateInvestigationId, validatePagination, asyncWrapper(evidenceCtrl.listEvidence));
router.get("/:evidenceId", validateInvestigationId, asyncWrapper(evidenceCtrl.getEvidence));

export default router;
