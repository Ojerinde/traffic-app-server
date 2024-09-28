const catchAsync = require("../utils/catchAsync");

exports.typeDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload, clients.size);
  return clients.forEach((client) => {
    console.log(ws.clientType, payload.ClientID);
    if (client.clientType === payload.ClientID) return;
    client.send(
      JSON.stringify({
        event: "info_feedback",
        payload,
      })
    );
  });
});
