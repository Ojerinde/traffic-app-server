const { AdminDevice } = require("../models/adminAppModel");
const { UserDevice, UserPhase, UserPattern } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");
const { generateSecretKey } = require("../utils/misc");

exports.getDeviceDetailById = catchAsync(async (req, res, next) => {
  console.log("Getting device detail by user", req.params);
  const { deviceId, userEmail } = req.params;

  const existingDevice = await AdminDevice.findOne({ deviceId: deviceId });

  if (!existingDevice) {
    return res.status(400).json({ message: "Invalid Device ID" });
  }
  if (existingDevice.deviceStatus.status !== "purchased") {
    return res.status(400).json({ message: "Device has not been purchased." });
  }

  if (
    existingDevice.deviceStatus.ownerEmail &&
    existingDevice.deviceStatus.ownerEmail.toLowerCase() !==
      userEmail.toLowerCase()
  ) {
    return res
      .status(403)
      .json({ message: "You are not authorized to add this device." });
  }
  const device = {
    type: existingDevice.deviceType,
    id: existingDevice.deviceId,
    department: existingDevice.deviceDepartment,
  };

  res.status(200).json({
    message: "Valid Device ID",
    device,
  });
});

exports.addDeviceByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Adding device by user", req.body);
  const { deviceId, deviceType, email } = req.body;

  if (!deviceId || !deviceType || !email) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const existingDevice = await UserDevice.findOne({ deviceId: deviceId });

  const recognizedDevice = await AdminDevice.findOne({ deviceId });

  if (!recognizedDevice) {
    return res.status(400).json({ message: "Device is not recognized" });
  }

  if (existingDevice) {
    return res.status(400).json({ message: "Device already exist." });
  }
  const secretKey = generateSecretKey();
  const newDevice = await UserDevice.create({
    deviceId,
    deviceType,
    email,
    secretKey,
  });

  res.status(201).json({
    message: "Device added successfully",
    data: {
      ...newDevice.toObject(),
      secretKey: undefined,
    },
  });
});

exports.getAllDeviceByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Getting all devices by user");
  const { email } = req.params;
  const devices = await UserDevice.find({ email });

  return res.status(200).json({
    devices,
  });
});
exports.addPhaseByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Adding Phase by user", req.body);

  const { email, phaseName, phaseData } = req.body;

  // Check if phases already exist for the user
  const userPhase = await UserPhase.findOne({ email });

  // Check for existing phase name
  if (userPhase) {
    const existingPhase = userPhase.phases.find(
      (phase) => phase.name === phaseName
    );

    if (existingPhase) {
      return res.status(400).json({
        message: `Phase with name "${phaseName}" already exists!`,
      });
    }
  }

  const phase = {
    name: phaseName,
    data: phaseData,
  };

  const updatedPhase = await UserPhase.findOneAndUpdate(
    { email },
    { $push: { phases: phase } },
    { upsert: true, new: true }
  );

  res.status(201).json({
    message: `Phase ${phaseName} added successfully!`,
    phase: updatedPhase.phases[updatedPhase.phases.length - 1],
  });
});

exports.getAllPhaseByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Getting Phase by user");

  const { email } = req.params;
  const phases = await UserPhase.findOne({ email });
  console.log("Phases", phases);
  res.status(200).json({
    data: phases,
  });
});

exports.deletePhaseByUserHandler = catchAsync(async (req, res) => {
  console.log("Deleting phase by user", req.params);
  const { phaseId, email } = req.params;

  const updatedUser = await UserPhase.findOneAndUpdate(
    { email },
    { $pull: { phases: { _id: phaseId } } },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({
      message: "Phase not found or you don't have permission to delete it.",
    });
  }

  res.status(200).json({ message: "Phase successfully deleted." });
});

exports.addPatternByUserHandler = catchAsync(async (req, res) => {
  const { email, patternName, selectedPhases } = req.body;

  const user = await UserPhase.findOne({ email });
  const userPhasesID = user.phases.map((phase) => phase._id.toString());

  const allPhasesValid = selectedPhases.every((phaseId) =>
    userPhasesID.includes(phaseId)
  );

  if (!allPhasesValid) {
    return res.status(400).json({
      message: "One or more phases are invalid!",
    });
  }

  // Ensure no duplicate pattern name
  const existingPattern = await UserPattern.findOne({
    email,
    "patterns.name": patternName,
  });

  if (existingPattern) {
    return res.status(400).json({
      message: `Pattern name "${patternName}" already exists!`,
    });
  }

  // Create the new pattern
  const pattern = {
    name: patternName,
    phases: selectedPhases,
  };

  await UserPattern.findOneAndUpdate(
    { email },
    { $push: { patterns: pattern } },
    { upsert: true }
  );

  res.status(201).json({
    message: `Pattern "${patternName}" added successfully!`,
  });
});

exports.getAllPatternsByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Getting all patterns by user", req.params);
  const { email } = req.params;

  const userPhases = await UserPhase.findOne({ email });

  if (!userPhases) {
    return res.status(404).json({ message: "No phases found for this user" });
  }

  const userPatterns = await UserPattern.findOne({ email });

  if (!userPatterns) {
    return res.status(404).json({ message: "No patterns found for this user" });
  }

  const populatedPatterns = userPatterns.patterns.map((pattern) => {
    const populatedPhases = pattern.phases
      .map((phaseId) =>
        userPhases.phases.find(
          (phase) => phase._id.toString() === phaseId.toString()
        )
      )
      .filter((phase) => phase);

    return {
      ...pattern.toObject(),
      phases: populatedPhases,
    };
  });

  res.status(200).json({
    data: {
      patterns: populatedPatterns,
    },
  });
});

exports.deletePatternByUserHandler = catchAsync(async (req, res) => {
  console.log("Deleting pattern by user", req.params);
  const { patternId, email } = req.params;

  const updatedUser = await UserPattern.findOneAndUpdate(
    { email },
    { $pull: { patterns: { _id: patternId } } },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({
      message: "Pattern not found or you don't have permission to delete it.",
    });
  }

  res.status(200).json({ message: "Pattern successfully deleted." });
});
