const { UserPattern } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.uploadRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received upload request data from Client", payload);

  // Find the user's patterns
  const userPatterns = await UserPattern.findOne({ email: payload.email });

  const pattern = userPatterns.patterns.find(
    (p) => p.name === payload.patternName
  );

  // Format the pattern phases
  const patternPhases = pattern.configuredPhases.map((phase) => ({
    PhaseName: phase.name,
    PhaseId: phase.phaseId,
    SignalString: phase.signalString,
    Duration: phase.duration,
  }));

  // Additional pattern settings
  const patternSettings = {
    BlinkEnabled: pattern.blinkEnabled,
    BlinkTimeRedToGreen: pattern.blinkTimeRedToGreen,
    BlinkTimeGreenToRed: pattern.blinkTimeGreenToRed,
    AmberEnabled: pattern.amberEnabled,
    AmberDurationRedToGreen: pattern.amberDurationRedToGreen,
    AmberDurationGreenToRed: pattern.amberDurationGreenToRed,
  };

  // Generate the pattern strings
  let patternString = "";

  patternPhases.forEach((phase) => {
    // Base signal string with phase duration
    patternString += `*${phase.Duration}${phase.SignalString}\n`;

    // If BlinkEnabled, toggle between original and modified signal strings
    if (patternSettings.BlinkEnabled) {
      let blinkCount = patternSettings.BlinkTimeGreenToRed;

      for (let i = 0; i < blinkCount; i++) {
        // Blink with X replacing G in SignalString
        const blinkSignalString = phase.SignalString.replace(/G/g, "X");
        patternString += `*X${blinkSignalString}\n`;

        // Back to original signal string
        patternString += `*X${phase.SignalString}\n`;
      }
      if (patternSettings.AmberEnabled) {
        const amberSignalString = phase.SignalString.replace(/G/g, "A");
        patternString += `*${patternSettings.AmberDurationGreenToRed}${amberSignalString}\n`;
      }
    }
  });

  // Extract hours and minutes from timeSegment
  const [hours, minutes] = payload.timeSegment.split(":").map(Number);
  let startMinutes = minutes + 1;
  let startHours = hours;
  if (startMinutes >= 60) {
    startMinutes -= 60;
    startHours += 1;
  }
  if (startHours >= 24) {
    startHours = 0;
  }
  let endMinutes = startMinutes + 29;
  let endHours = startHours;
  if (endMinutes >= 60) {
    endMinutes -= 60;
    endHours += 1;
  }
  if (endHours >= 24) {
    endHours = 0;
  }
  const startTime = `${String(startHours).padStart(2, "0")}:${String(
    startMinutes
  ).padStart(2, "0")}`;
  const endTime = `${String(endHours).padStart(2, "0")}:${String(
    endMinutes
  ).padStart(2, "0")}`;
  const timeSegmentString = `@${startTime}-${endTime}`;

  // console.log("Generated Data:\n", patternString.trim(), {
  //   Event: "ctrl",
  //   Type: "program",
  //   Param: {
  //     DeviceID: payload.DeviceID,
  //     Plan: `/${payload.plan}s_new.txt`,
  //     Period: timeSegmentString,
  //     JunctionId: payload.junctionId,
  //     Pattern: patternString.trim(),
  //   },
  // });

  // Send the pattern strings to the clients
  clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "prog",
        Param: {
          DeviceID: payload.DeviceID,
          Plan: `/${payload.plan}s_new.txt`,
          Period: timeSegmentString,
          JunctionId: payload.junctionId,
          Pattern: patternString.trim(),
        },
      })
    );
  });
});

exports.uploadHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received upload data feedback from Hardware", payload);
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    client.send(
      JSON.stringify({
        event: "upload_feedback",
        payload,
      })
    );
  });
});
