const express = require("express");
const router = express.Router();
const adminAppController = require("../controllers/adminAppController");

router.post("/device", adminAppController.addDeviceByAdminHandler);
router.get(
  "/device/:deviceDepartment",
  adminAppController.getAllDeviceByAdminHandler
);

module.exports = router;
