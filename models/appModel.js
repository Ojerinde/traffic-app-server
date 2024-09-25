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
      blinkEnabled: { type: Boolean, default: false },
      blinkTimeRedToGreen: { type: Number, min: 1, max: 5, default: 1 },
      blinkTimeGreenToRed: { type: Number, min: 1, max: 5, default: 2 },
      amberEnabled: { type: Boolean, default: true },
      amberDurationRedToGreen: { type: Number, min: 1, max: 5, default: 3 },
      amberDurationGreenToRed: { type: Number, min: 1, max: 5, default: 3 },
      configuredPhases: [
        {
          name: { type: String, required: true },
          phaseId: { type: String, required: true },
          signalString: { type: String, required: true },
          duration: { type: Number, required: true },
          id: { type: Number, required: true },
        },
      ],
    },
  ],
});

const userPlanSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    plans: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        dayType: { type: String, required: true },
        schedule: {
          type: Map,
          of: new Schema(
            {
              value: { type: String, required: true },
              label: { type: String, required: true },
            },
            { _id: false }
          ),
        },
        customDate: { type: Date, default: null },
      },
    ],
  },
  { timestamps: true }
);

// Create models
const UserDevice = mongoose.model("UserDevice", userDeviceSchema);
const UserPhase = mongoose.model("UserPhase", userPhaseSchema);
const UserPattern = mongoose.model("UserPattern", userPatternSchema);
const UserPlan = mongoose.model("UserPlan", userPlanSchema);
module.exports = {
  UserDevice,
  UserPhase,
  UserPattern,
  UserPlan,
};
