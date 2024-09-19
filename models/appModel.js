const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define schema for USer
const userDeviceSchema = new Schema({
  deviceId: {
    type: String,
    required: [true, "Device ID is required"],
  },
  secretKey: {
    type: String,
    required: [true, "Device Secret Key is required"],
    select: false,
  },
  deviceType: {
    type: String,
    enum: ["QT-TSLC"],
    required: [true, "Device Type is required"],
  },
  email: {
    type: String,
    required: [true, "Email of admin is required "],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userPhaseSchema = new Schema({
  email: { type: String, required: true },
  phases: [
    {
      _id: { type: Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true },
      data: { type: String, required: true },
    },
  ],
});

const userPatternSchema = new Schema({
  email: { type: String, required: true },
  patterns: [
    {
      name: { type: String, required: true },
      phases: [
        {
          type: Schema.Types.ObjectId,
          ref: "UserPhase",
          required: true,
        },
      ],
    },
  ],
});

const userGroupSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  patterns: [
    {
      name: {
        type: String,
        required: true,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      phases: [
        {
          name: {
            type: String,
            required: true,
          },
          phaseId: {
            type: String,
            required: true,
          },
          phaseData: {
            type: String,
            required: true,
          },
          duration: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

// Create models
const UserDevice = mongoose.model("UserDevice", userDeviceSchema);
const UserPhase = mongoose.model("UserPhase", userPhaseSchema);
const UserPattern = mongoose.model("UserPattern", userPatternSchema);
const UserGroup = mongoose.model("UserGroup", userGroupSchema);

module.exports = {
  UserDevice,
  UserPhase,
  UserPattern,
  UserGroup,
};
