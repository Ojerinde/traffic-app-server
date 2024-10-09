const { UserDeviceState } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.intersectionControlRequestHandler = catchAsync(
  async (ws, clients, payload) => {
    console.log("Received intersection request data from Client", payload);

    // Get the deviceState from the database using the DeviceID
    const deviceState = await UserDeviceState.findOne({
      DeviceID: payload.DeviceID,
    });
    if (!deviceState) {
      console.error(`Device with ID ${payload.DeviceID} not found.`);
      return;
    }

    let newActionValue;
    let additionalParams = {};
    let action = payload.action;
    if (action === "Manual") {
      action = "Auto";
    }
    switch (payload.action) {
      case "Auto":
        deviceState.Auto = true;
        newActionValue = true;
        await deviceState.save();
        break;
      case "Manual":
        if (payload.duration) additionalParams.duration = payload.duration;
        if (payload.signalString)
          additionalParams.signalString = payload.signalString;
        deviceState.Auto = false;
        newActionValue = false;
        await deviceState.save();

        // Generate the main phase signal
        const {
          duration,
          signalString,
          blinkEnabled,
          blinkTimeGreenToRed,
          amberEnabled,
          amberDurationGreenToRed,
        } = payload;

        const phaseSignal = `*${duration}${signalString}`;

        // Send the initial phase signal to the clients
        clients.forEach((client) => {
          if (client.clientType !== payload.DeviceID) return;
          client.send(
            JSON.stringify({
              Event: "ctrl",
              Type: "sign",
              Param: {
                DeviceID: payload.DeviceID,
                Phase: phaseSignal,
              },
            })
          );
        });

        // Wait for the specified duration before proceeding to the blink logic
        setTimeout(() => {
          if (blinkEnabled) {
            const blinkIterations = 2 * blinkTimeGreenToRed;
            const blinkInterval = 500;

            for (let i = 0; i < blinkIterations; i++) {
              let blinkPhase;
              if (i % 2 === 0) {
                blinkPhase = `*X${signalString.replace(/G/g, "X")}`;
              } else {
                blinkPhase = `*X${signalString}`;
              }
              setTimeout(() => {
                clients.forEach((client) => {
                  if (client.clientType !== payload.DeviceID) return;
                  client.send(
                    JSON.stringify({
                      Event: "ctrl",
                      Type: "sign",
                      Param: {
                        DeviceID: payload.DeviceID,
                        Phase: blinkPhase,
                      },
                    })
                  );
                });
              }, i * blinkInterval);
            }

            // Handle amber logic only after the blink phase completes
            setTimeout(() => {
              if (amberEnabled) {
                const amberPhase = `*${amberDurationGreenToRed}${signalString.replace(
                  /G/g,
                  "A"
                )}`;

                clients.forEach((client) => {
                  if (client.clientType !== payload.DeviceID) return;
                  client.send(
                    JSON.stringify({
                      Event: "ctrl",
                      Type: "sign",
                      Param: {
                        DeviceID: payload.DeviceID,
                        Phase: amberPhase,
                      },
                    })
                  );
                });
              }
            }, blinkIterations * blinkInterval); // Wait for blink phase to complete before sending amber
          } else if (amberEnabled) {
            // Send amber phase immediately if blink is not enabled
            const amberPhase = `*${amberDurationGreenToRed}${signalString.replace(
              /G/g,
              "A"
            )}`;
            clients.forEach((client) => {
              if (client.clientType !== payload.DeviceID) return;
              client.send(
                JSON.stringify({
                  Event: "ctrl",
                  Type: "sign",
                  Param: {
                    DeviceID: payload.DeviceID,
                    Phase: amberPhase,
                  },
                })
              );
            });
          }
        }, duration * 1000);
        return;

      case "Hold":
        newActionValue = !deviceState.Hold;
        break;
      case "Next":
        newActionValue = !deviceState.Next;
        break;
      case "Restart":
        newActionValue = !deviceState.Restart;
        break;
      case "Power":
        newActionValue = !deviceState.Power;
        deviceState.Power = newActionValue;
        await deviceState.save();
        break;
      case "Reset":
        newActionValue = !deviceState.Reset;
        break;
      default:
        console.error(`Unknown action: ${payload.action}`);
        return;
    }
    // console.log("Intersection Config", deviceState, {
    //   DeviceID: payload.DeviceID,
    //   [action]: `${newActionValue}`,
    //   ...additionalParams,
    // });

    clients.forEach((client) => {
      if (client.clientType !== payload.DeviceID) return;
      client.send(
        JSON.stringify({
          Event: "ctrl",
          Type: "state",
          Param: {
            DeviceID: payload.DeviceID,
            [action]: `${newActionValue}`,
            ...additionalParams,
          },
        })
      );
    });
  }
);

exports.intersectionControlHandler = catchAsync(
  async (ws, clients, payload) => {
    console.log("Received intersection data from Hardware", payload);
  }
);
