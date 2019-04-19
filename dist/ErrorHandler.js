"use strict";
exports.__esModule = true;
var fs = require("fs");
var moment = require("moment");
exports.ErrorLogger = function (errText) {
    fs.appendFileSync('errorlog.txt', "::: " + moment().format('YYYY-MM-DD HH:mm:ss') + " :::\n" + errText + "\n\n");
};
