const express = require("express");
const router = express.Router();
const appController = require("../controllers/appController");

router.post("/devices", appController.addDeviceByUserHandler);
router.get("/devices/:email", appController.getAllDeviceByUserHandler);
router.get("/devices/:deviceId/:userEmail", appController.getDeviceDetailById);

router.post("/phases", appController.addPhaseByUserHandler);
router.get("/phases/:email", appController.getAllPhaseByUserHandler);

router.post("/patterns", appController.addPatternByUserHandler);
router.get("/patterns/:email", appController.getAllPatternsByUserHandler);

module.exports = router;
