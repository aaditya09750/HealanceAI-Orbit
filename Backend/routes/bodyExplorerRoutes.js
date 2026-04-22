import express from 'express';
import {
  getAllBodyParts,
  getBodyPartInfo,
  listSystems,
} from '../controllers/bodyExplorerController.js';

const router = express.Router();

// Distinct body systems for the filter UI. Registered BEFORE the `:partName`
// route so "meta" isn't treated as a part name.
router.get('/meta/systems', listSystems);

// Catalog listing with optional ?search= and ?system= query filters.
router.get('/', getAllBodyParts);

// Single body part by name.
router.get('/:partName', getBodyPartInfo);

export default router;
