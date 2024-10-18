const catchAsync = require("../utils/catchAsync");

exports.downloadRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received download request data from Client", payload);

  // console.log("Download", {
  //   Event: "ctrl",
  //   Type: "prog",
  //   Param: {
  //     DeviceID: payload.DeviceID,
  //   },
  // });

  // Send the pattern strings to the hardware
  clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "prog",
        Param: {
          DeviceID: payload.DeviceID,
        },
      })
    );
  });
});

exports.downloadHandler = catchAsync(async (ws, clients, payload) => {
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    client.send(
      JSON.stringify({
        event: "download_feedback",
        payload,
      })
    );
  });
});
