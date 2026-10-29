// src/routes/investigations.js
import { Router } from "express";
import * as investigationController from "../controllers/investigationController.js";
import { validateInvestigationCreate, validateInvestigationId, validatePagination } from "../validators/investigationValidator.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = Router();

// GET /api/v1/investigations – list with pagination & filters
router.get(
  "/",
  validatePagination,
  asyncWrapper(investigationController.listInvestigations)
);

// POST /api/v1/investigations – create new investigation (queues job)
router.post(
  "/",
  validateInvestigationCreate,
  asyncWrapper(investigationController.createInvestigation)
);

// GET /api/v1/investigations/:id – detail
router.get(
  "/:id",
  validateInvestigationId,
  asyncWrapper(investigationController.getInvestigation)
);

// DELETE /api/v1/investigations/:id – delete (cancels if running)
router.delete(
  "/:id",
  validateInvestigationId,
  asyncWrapper(investigationController.deleteInvestigation)
);

// GET /api/v1/investigations/:id/progress – job progress
router.get(
  "/:id/progress",
  validateInvestigationId,
  asyncWrapper(investigationController.getProgress)
);

// POST /api/v1/investigations/:id/cancel – cancel job
router.post(
  "/:id/cancel",
  validateInvestigationId,
  asyncWrapper(investigationController.cancelInvestigation)
);

export default router;
