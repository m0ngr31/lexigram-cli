"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
exports.__esModule = true;
var ParseIni = /** @class */ (function () {
    function ParseIni() {
        this.ini = '';
    }
    ParseIni.prototype.cleanComments = function (line) {
        var cleanLine = line;
        // Skip comments
        if (cleanLine.indexOf('#') > -1)
            cleanLine = cleanLine.substring(0, cleanLine.indexOf('#'));
        if (cleanLine.indexOf(';') > -1)
            cleanLine = cleanLine.substring(0, cleanLine.lastIndexOf(';'));
        cleanLine = cleanLine.trim();
        return cleanLine;
    };
    ParseIni.prototype.headerCheck = function (line) {
        return line[0] === '[' && line.substring(line.length - 1) === ']';
    };
    ParseIni.prototype.destructureValue = function (line) {
        var cleanLine = line;
        var response = '';
        if (cleanLine.indexOf('=') > -1) {
            response = cleanLine.substring(cleanLine.indexOf('=') + 1);
            cleanLine = cleanLine.substring(0, cleanLine.indexOf('='));
            cleanLine = cleanLine.trim();
            response = response.trim();
        }
        return [cleanLine, response];
    };
    ParseIni.prototype.setOjb = function (obj) {
        if (!this.ini && !(this.ini.length === 0))
            return;
        var objCheck = __assign({}, obj);
        var lines = this.ini.split(/\n/i);
        var lastHeader = 'unset';
        var foundHeader = -1;
        var foundMatch = false;
        // Adding obj data to existing ini sheet
        for (var a = 0; a < lines.length; a++) {
            var cleanLine = this.cleanComments(lines[a]);
            if (cleanLine.length > 0) {
                // Determine if it's a header or setting
                if (this.headerCheck(cleanLine)) {
                    if (lastHeader !== 'unset') {
                        delete objCheck[lastHeader];
                    }
                    lastHeader = cleanLine.replace(/(\[|\])/g, '');
                    if (!obj[lastHeader])
                        continue;
                }
                else {
                    var response = void 0;
                    _a = this.destructureValue(cleanLine), cleanLine = _a[0], response = _a[1];
                    if (!obj[lastHeader] || (obj[lastHeader] && !obj[lastHeader][cleanLine]))
                        continue;
                    if (obj[lastHeader][cleanLine]) {
                        lines[a] = cleanLine + "=" + obj[lastHeader][cleanLine];
                    }
                }
            }
        }
        // Adding in data that isn't in there by default
        for (var key in objCheck) {
            if (objCheck.hasOwnProperty(key)) {
                lines.push("\n[" + key + "]");
                for (var subkey in objCheck[key]) {
                    if (objCheck[key].hasOwnProperty(subkey)) {
                        lines.push(subkey + "=" + objCheck[key][subkey]);
                    }
                }
            }
        }
        var newLines = lines.join('\n');
        // Get new schema
        this.parse(newLines);
        var _a;
    };
    ParseIni.prototype.set = function (header, field, value) {
        if (!this.ini)
            return;
        var lines = this.ini.split(/\n/i);
        var lastHeader = 'unset';
        var foundHeader = -1;
        var foundMatch = false;
        for (var a = 0; a < lines.length; a++) {
            var cleanLine = this.cleanComments(lines[a]);
            if (cleanLine.length > 0) {
                // Determine if it's a header or setting
                if (this.headerCheck(cleanLine)) {
                    lastHeader = cleanLine.replace(/(\[|\])/g, '');
                    if (lastHeader === header)
                        foundHeader = a;
                }
                else {
                    var response = void 0;
                    _a = this.destructureValue(cleanLine), cleanLine = _a[0], response = _a[1];
                    if (lastHeader === header && field === cleanLine) {
                        lines[a] = field + "=" + value;
                        foundMatch = true;
                        break;
                    }
                }
            }
        }
        if (!foundMatch && foundHeader > -1)
            lines.splice(foundHeader + 1, 0, field + "=" + value);
        var newLines = lines.join('\n');
        // Get new schema
        this.parse(newLines);
        var _a;
    };
    ParseIni.prototype.verifyData = function () {
        try {
            if (this.schema && (this.schema['default'] || this.schema['DEFAULT'])) {
                var data = void 0;
                if (this.schema['default']) {
                    data = this.schema['default'];
                }
                else {
                    data = this.schema['DEFAULT'];
                }
                if (!data.scheme || (data.scheme && !data.scheme.length)) {
                    return false;
                }
                if (!data.address || (data.address && !data.address.length)) {
                    return false;
                }
                if (!data.port || (data.port && !data.port.length)) {
                    return false;
                }
                if (!data.username || (data.username && !data.username.length)) {
                    return false;
                }
                if (!data.password || (data.password && !data.password.length)) {
                    return false;
                }
                return true;
            }
            return false;
        }
        catch (e) {
            return false;
        }
    };
    ParseIni.prototype.parse = function (ini) {
        var _this = this;
        var lines = ini.split(/\n/i);
        var schema = {};
        var lastHeader = 'unset';
        lines.forEach(function (line) {
            var cleanLine = _this.cleanComments(line);
            if (cleanLine.length > 0) {
                // Determine if it's a header or setting
                if (_this.headerCheck(cleanLine))
                    lastHeader = cleanLine.replace(/(\[|\])/g, '');
                else {
                    var response = void 0;
                    _a = _this.destructureValue(cleanLine), cleanLine = _a[0], response = _a[1];
                    if (!schema[lastHeader])
                        schema[lastHeader] = {};
                    schema[lastHeader][cleanLine] = response;
                }
            }
            var _a;
        });
        this.schema = schema;
        this.ini = ini;
    };
    return ParseIni;
}());
exports["default"] = ParseIni;
