const catchAsync = require("../utils/catchAsync");

exports.infoDataRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info request data from Client", payload);
  return clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    console.log("Sending Message to Hardware", payload.DeviceID);
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "info",
        Param: {
          DeviceID: payload.DeviceID,
        },
      })
    );
  });
});

exports.infoDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload);
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    console.log("Sending Message to all clients but not to", payload.DeviceID);

    client.send(
      JSON.stringify({
        event: "info_feedback",
        payload,
      })
    );
  });
});
