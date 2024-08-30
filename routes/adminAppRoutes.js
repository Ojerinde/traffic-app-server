const express = require("express");
const router = express.Router();
const adminAppController = require("../controllers/adminAppController");

router.post("/addDevice", adminAppController.addDeviceByAdminHandler);
router.get(
  "/getDevice/:deviceDepartment",
  adminAppController.getAllDeviceByAdminHandler
);

module.exports = router;
