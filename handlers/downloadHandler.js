const { UserPattern } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.downloadRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received download request data from Client", payload);
});

exports.downloadHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received download data feedback from Hardware", payload);
});
