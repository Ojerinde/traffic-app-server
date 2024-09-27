const catchAsync = require("../utils/catchAsync");

exports.typeDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload, clients.length);
  return clients.forEach((client) => {
    client.send(
      JSON.stringify({
        event: "info_feedback",
        payload,
      })
    );
  });
});
