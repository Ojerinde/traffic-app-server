const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema for Lecturer
const adminDeviceSchema = new Schema({
  deviceId: {
    type: String,
    required: [true, "Device ID is required"],
  },
  deviceType: {
    type: String,
    enum: ["QT-TSLC"],
    required: [true, "Device Type is required"],
  },
  deviceDepartment: {
    type: String,
    required: [true, "Device Department is required"],
  },
  adminEmail: {
    type: String,
    required: [true, "Email of admin is required "],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
  },
  modifiedBy: {
    type: String,
  },
});

// // Create models
const AdminDevice = mongoose.model("AdminDevice", adminDeviceSchema);

module.exports = {
  AdminDevice,
};
