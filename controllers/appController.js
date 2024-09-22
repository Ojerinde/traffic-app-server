const { AdminDevice } = require("../models/adminAppModel");
const {
  UserDevice,
  UserPhase,
  UserPattern,
  UserGroup,
} = require("../models/appModel");
const User = require("../models/userModel");
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
  console.log("Getting Phase by user", req.params);

  const { email } = req.params;
  const phases = await UserPhase.findOne({ email });
  if (!phases || phases.length === 0) {
    return res.status(404).json({
      message: "No phase found for this user",
    });
  }
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

  res.status(204).json({ message: "Phase successfully deleted." });
});

exports.addPatternByUserHandler = catchAsync(async (req, res) => {
  console.log("Adding pattern by user", req.body);

  const {
    email,
    name,
    configuredPhases,
    blinkEnabled,
    blinkTimeRedToGreen,
    blinkTimeGreenToRed,
    amberEnabled,
    amberDurationRedToGreen,
    amberDurationGreenToRed,
  } = req.body;

  // Ensure the user exists
  const user = await UserPhase.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found!" });
  }

  // Ensure no duplicate pattern name
  const existingPattern = await UserPattern.findOne({
    email,
    "patterns.name": name,
  });

  if (existingPattern) {
    return res.status(400).json({
      message: `Pattern name "${name}" already exists!`,
    });
  }

  const pattern = {
    name,
    blinkEnabled,
    blinkTimeRedToGreen,
    blinkTimeGreenToRed,
    amberEnabled,
    amberDurationRedToGreen,
    amberDurationGreenToRed,
    configuredPhases: configuredPhases.map((phase) => ({
      name: phase.name,
      phaseId: phase.phaseId,
      signalString: phase.signalString,
      duration: phase.duration,
    })),
  };

  // Add the pattern to the database
  await UserPattern.findOneAndUpdate(
    { email },
    { $push: { patterns: pattern } },
    { upsert: true }
  );

  res.status(201).json({
    message: `Pattern "${name}" added successfully!`,
  });
});

exports.getAllPatternsByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Getting all patterns by user", req.params);
  const { email } = req.params;

  // Find user pattern by email
  const userPatterns = await UserPattern.findOne({ email });

  if (!userPatterns) {
    return res.status(404).json({ message: "No pattern found for this user" });
  }

  const populatedPatterns = userPatterns.patterns.map((pattern) => ({
    name: pattern.name,
    blinkEnabled: pattern.blinkEnabled,
    blinkTimeRedToGreen: pattern.blinkTimeRedToGreen,
    blinkTimeGreenToRed: pattern.blinkTimeGreenToRed,
    amberEnabled: pattern.amberEnabled,
    amberDurationRedToGreen: pattern.amberDurationRedToGreen,
    amberDurationGreenToRed: pattern.amberDurationGreenToRed,
    configuredPhases: pattern.configuredPhases.map((phase) => ({
      name: phase.name,
      phaseId: phase.phaseId,
      signalString: phase.signalString,
      duration: phase.duration,
    })),
  }));

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

  res.status(204).json({ message: "Pattern successfully deleted." });
});

exports.addGroupByUserHandler = catchAsync(async (req, res) => {
  console.log("Adding Group by user", req.body);

  const { name, email, patterns } = req.body;

  patterns.forEach((pattern, index) => {
    if (!pattern.startTime || !pattern.endTime) {
      console.error(
        `Pattern at index ${index} is missing startTime or endTime`
      );
    }
  });

  const newGroup = await UserGroup.create({
    name,
    email,
    patterns: patterns.map((pattern) => ({
      name: pattern.name,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
    })),
  });

  return res.status(201).json({
    message: "Group successfully created with multiple patterns",
    data: newGroup,
  });
});

exports.getAllGroupsByUserHandler = catchAsync(async (req, res, next) => {
  console.log("Getting all groups by user", req.params);
  const { email } = req.params;

  // Fetch user groups and use .lean() to return plain JavaScript objects
  const groups = await UserGroup.find({ email }).lean();

  if (!groups || groups.length === 0) {
    return res.status(404).json({
      message: "No group found for this user",
    });
  }

  const userPatterns = await UserPattern.findOne({ email }).lean();

  const enrichedGroups = groups.map((group) => {
    const enrichedPatterns = group.patterns.map((groupPattern) => {
      const correspondingPattern = userPatterns.patterns.find(
        (pattern) => pattern.name === groupPattern.name
      );

      if (correspondingPattern) {
        return {
          ...groupPattern,
          ...correspondingPattern,
        };
      }

      return groupPattern;
    });

    return {
      ...group,
      patterns: enrichedPatterns,
    };
  });

  res.status(200).json({
    data: enrichedGroups,
  });
});

exports.deleteGroupByUserHandler = catchAsync(async (req, res) => {
  console.log("Deleting group by user", req.params);
  const { groupId, email } = req.params;

  const group = await UserGroup.findOneAndDelete({ _id: groupId, email });

  if (!group) {
    return res.status(404).json({
      message: "Group not found or you don't have permission to delete it.",
    });
  }

  res.status(204).json({
    message: "Group successfully deleted.",
  });
});

exports.confirmPasswordHandler = catchAsync(async (req, res) => {
  console.log("Confirming password by user", req.body);
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  const isPasswordCorrect = await user.correctPassword(password);

  if (!isPasswordCorrect) {
    console.log("Incorrect");
    return res.status(401).json({
      message: "Incorrect password.",
    });
  }

  console.log("Correct");

  res.status(200).json({
    message: "Password confirmed.",
  });
});
