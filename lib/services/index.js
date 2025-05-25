"use strict";

const s = {};

s.user = require("./consumers/user.service.js");
s.application = require("./consumers/application.service.js");
s.credential = require("./credentials/credential.service.js");
s.auth = require("./auth.js");

module.exports = s;
