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
  console.log(patternPhases);
  return;
  clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "program",
        Param: {
          DeviceID: payload.DeviceID,
          Plan: payload.plan,
          Period: payload.timeSegment,
          JunctionId: payload.junctionId,
          Patterns: patternPhases,
          PatternSettings: patternSettings,
        },
      })
    );
  });
});

exports.uploadHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received upload data from Hardware", payload);
});
