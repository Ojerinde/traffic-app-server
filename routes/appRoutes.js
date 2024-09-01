const express = require("express");
const router = express.Router();
const appController = require("../controllers/appController");

router.post("/addDevice", appController.addDeviceByUserHandler);
router.get(
  "/getDeviceDetail/:deviceId/:userEmail",
  appController.getDeviceDetailById
);
router.get("/getDevice/:email", appController.getAllDeviceByUserHandler);

module.exports = router;
