const express = require("express");
const router = express.Router();
const appController = require("../controllers/appController");

router.post("/device", appController.addDeviceByUserHandler);
router.get("/device/:email", appController.getAllDeviceByUserHandler);
router.get("/device/:deviceId/:userEmail", appController.getDeviceDetailById);

router.post("/phase", appController.addPhaseByUserHandler);
router.get("/phase/:email", appController.getAllPhaseByUserHandler);

module.exports = router;
