"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var execSh = require("exec-sh");
var execa = require("execa");
var fs = require("fs");
var readlineSync = require("readline-sync");
var fse = require("fs-extra");
var Listr = require("listr");
var unzip = require("unzip-stream");
var promisePipe = require("promisepipe");
var _ = require("lodash");
var archiver = require("archiver-promise");
var axios_1 = require("axios");
var ParseIni_1 = require("./ParseIni");
var InteractionModel_1 = require("./InteractionModel");
var askPath = __dirname + "/../node_modules/.bin/ask";
exports.loginOrSwitch = function (args, options, logger) {
    if (options.noBrowser) {
        execSh(askPath + " init --no-browser", {});
    }
    else {
        execSh(askPath + " init", {});
    }
};
exports.downloadConfig = function (args, options, logger) { return __awaiter(_this, void 0, void 0, function () {
    var url, fileName, answer, request;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = 'https://rawgit.com/m0ngr31/kodi-voice/master/kodi_voice/kodi.config.example';
                fileName = 'kodi.config';
                if (fs.existsSync(fileName)) {
                    answer = readlineSync.keyInYNStrict('Config file already exists. Would you like to overwrite?');
                    if (!answer) {
                        return [2 /*return*/];
                    }
                }
                return [4 /*yield*/, axios_1["default"].request({
                        url: url,
                        responseType: 'arraybuffer'
                    })];
            case 1:
                request = _a.sent();
                fs.writeFileSync(fileName, request.data);
                return [2 /*return*/];
        }
    });
}); };
exports.initSkill = function (args, options, logger) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var dir, tasks;
    return __generator(this, function (_a) {
        dir = args.skill;
        tasks = new Listr([
            {
                title: "Initialize " + dir + " skill",
                task: function () { return __awaiter(_this, void 0, void 0, function () {
                    var doInit, answer, skillId, skillConfig, e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                doInit = false;
                                if (!fs.existsSync(dir)) return [3 /*break*/, 6];
                                answer = readlineSync.keyInYNStrict('Skill directory exists. Would you like to overwrite?');
                                if (!answer) return [3 /*break*/, 5];
                                skillId = '';
                                skillConfig = fse.readJsonSync(dir + "/.ask/config");
                                if (!_.hasIn(skillConfig, 'deploy_settings.default.skill_id')) return [3 /*break*/, 4];
                                skillId = skillConfig.deploy_settings["default"].skill_id;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, execa(askPath, ['api', 'delete-skill', '--skill-id', skillId], { cwd: dir })];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                e_1 = _a.sent();
                                return [3 /*break*/, 4];
                            case 4:
                                fse.removeSync(dir);
                                doInit = true;
                                _a.label = 5;
                            case 5: return [3 /*break*/, 7];
                            case 6:
                                doInit = true;
                                _a.label = 7;
                            case 7:
                                if (doInit) {
                                    return [2 /*return*/, execa(askPath, ['new', '-n', dir, '--lambda-name', dir])["catch"](function () {
                                            throw new Error('Could not create skill. Please try again.');
                                        })];
                                }
                                return [2 /*return*/];
                        }
                    });
                }); }
            }
        ]);
        tasks.run()["catch"](function (err) { });
        return [2 /*return*/];
    });
}); };
exports.updateOrDeploySkill = function (args, options, logger) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var jsonOptions, getInput, answer, uri, invocationName, changeApi, invocationOpts, invocationAnswer, existingSkillConfig, tasks;
    return __generator(this, function (_a) {
        jsonOptions = {
            spaces: 2
        };
        getInput = true;
        answer = '';
        uri = '';
        invocationName = args.skill;
        changeApi = false;
        if (args.skill === 'kanzi') {
            invocationOpts = ['Kanzi', 'Kodi'];
            invocationAnswer = readlineSync.keyInSelect(invocationOpts, 'What would you like your invocation name to be?');
            if (invocationAnswer === -1) {
                return [2 /*return*/];
            }
            invocationName = invocationOpts[invocationAnswer].toLowerCase();
        }
        if (fs.existsSync(args.skill) && fs.existsSync(args.skill + "/skill.json")) {
            existingSkillConfig = fse.readJsonSync(args.skill + "/skill.json");
            if (_.hasIn(existingSkillConfig, 'manifest.apis.custom.endpoint.uri')) {
                getInput = false;
                changeApi = true;
                uri = existingSkillConfig.manifest.apis.custom.endpoint.uri;
            }
        }
        while (getInput) {
            answer = readlineSync.question("What's the URL for your skill server? (ex. https://... or arn:...). Press enter to skip. ");
            if (answer.length && (answer.substring(0, 8) === 'https://' || answer.substring(0, 4) === 'arn:')) {
                getInput = false;
                uri = answer;
                changeApi = true;
            }
            else if (!answer.length) {
                getInput = false;
                changeApi = false;
            }
            else {
                logger.warn('Invalid URI. Please try again.');
            }
        }
        tasks = new Listr([
            {
                title: 'Check config file',
                task: function (ctx) {
                    ctx.configFile = 'kodi.config';
                    if (!fs.existsSync(ctx.configFile)) {
                        throw new Error("Config file not found. Please run 'lexigram init-config' first.");
                    }
                }
            },
            {
                title: 'Validate config file',
                task: function (ctx) {
                    ctx.config = new ParseIni_1["default"]();
                    var file = fs.readFileSync(ctx.configFile, 'utf8');
                    ctx.config.parse(file);
                    if (!ctx.config.verifyData()) {
                        throw new Error('Configuration file is not valid. Please update it with the correct information.');
                    }
                }
            },
            {
                title: 'Check skill directory',
                task: function (ctx) {
                    ctx.dir = args.skill;
                    if (!fs.existsSync(ctx.dir)) {
                        throw new Error("Skill directory not found. Please run 'lexigram init-skill " + ctx.dir + "' first.");
                    }
                }
            },
            {
                title: 'Remove old repo code',
                task: function (ctx) {
                    fse.removeSync(ctx.dir + "/lambda/repo");
                    fse.ensureDir(ctx.dir + "/lambda/repo");
                }
            },
            {
                title: 'Download latest source code',
                task: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    var releaseUrl, url, request, releaseRequest, e_2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                fse.removeSync(ctx.dir + "-github.zip");
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 4, , 5]);
                                url = ctx.dir === 'kanzi' ?
                                    'https://api.github.com/repos/m0ngr31/kanzi/releases/latest' :
                                    'https://api.github.com/repos/m0ngr31/koko/releases/latest';
                                return [4 /*yield*/, axios_1["default"].request({
                                        url: url
                                    })];
                            case 2:
                                request = _a.sent();
                                releaseUrl = request.data.zipball_url;
                                return [4 /*yield*/, axios_1["default"].request({
                                        url: releaseUrl,
                                        responseType: 'arraybuffer'
                                    })];
                            case 3:
                                releaseRequest = _a.sent();
                                fs.writeFileSync(ctx.dir + "-github.zip", releaseRequest.data);
                                return [3 /*break*/, 5];
                            case 4:
                                e_2 = _a.sent();
                                throw new Error("Could not download latest release. Please try again.");
                            case 5: return [2 /*return*/];
                        }
                    });
                }); }
            },
            {
                title: 'Extract source code',
                task: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    var e_3;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, promisePipe(fs.createReadStream(ctx.dir + "-github.zip"), unzip.Extract({ path: ctx.dir + "/lambda/repo" }))];
                            case 1:
                                _a.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                e_3 = _a.sent();
                                throw new Error('Could not extract source code. Please try again.');
                            case 3: return [2 /*return*/];
                        }
                    });
                }); }
            },
            {
                title: 'Extract source code - Part 2',
                task: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                    var readDir, githubFolder, readGithubFolder;
                    return __generator(this, function (_a) {
                        readDir = fs.readdirSync(ctx.dir + "/lambda/repo/");
                        githubFolder = readDir[0];
                        readGithubFolder = fs.readdirSync(ctx.dir + "/lambda/repo/" + githubFolder + "/");
                        readGithubFolder.forEach(function (fileOrDir) {
                            fse.moveSync(ctx.dir + "/lambda/repo/" + githubFolder + "/" + fileOrDir, ctx.dir + "/lambda/repo/" + fileOrDir);
                        });
                        fse.removeSync(ctx.dir + "/lambda/repo/" + githubFolder);
                        fse.removeSync(ctx.dir + "-github.zip");
                        return [2 /*return*/];
                    });
                }); }
            },
            {
                title: 'Update skill data',
                task: function (ctx) {
                    var skillJson = args.skill === 'kanzi' ? 'kanzi-skill.json' : 'koko-skill.json';
                    var skillConfig = fse.readJsonSync(__dirname + "/../" + skillJson);
                    if (changeApi) {
                        delete skillConfig.manifest.apis;
                        skillConfig.manifest.apis = {
                            custom: {
                                endpoint: {
                                    uri: uri
                                }
                            }
                        };
                        if (args.skill === 'koko') {
                            skillConfig.manifest.apis.custom.interfaces = [
                                {
                                    "type": "AUDIO_PLAYER"
                                }
                            ];
                        }
                        if (uri.substring(0, 8) === 'https://') {
                            skillConfig.manifest.apis.custom.endpoint.sslCertificateType = 'Wildcard';
                        }
                    }
                    fse.removeSync(ctx.dir + "/skill.json");
                    fse.writeJsonSync(ctx.dir + "/skill.json", skillConfig, jsonOptions);
                }
            },
            {
                title: 'Update slot values',
                task: function (ctx, task) { return __awaiter(_this, void 0, void 0, function () {
                    var origObj, _a, _b, _c, englishObj, germanObj;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                task.output = 'Generating slot data from Kodi.';
                                _a = {};
                                _b = {};
                                _c = {
                                    invocationName: invocationName
                                };
                                return [4 /*yield*/, InteractionModel_1.getSlots(ctx.dir, ctx.config)];
                            case 1:
                                origObj = (_a.interactionModel = (_b.languageModel = (_c.types = _d.sent(),
                                    _c.intents = [],
                                    _c),
                                    _b),
                                    _a);
                                task.output = 'Creating intent model.';
                                englishObj = _.cloneDeep(origObj);
                                germanObj = _.cloneDeep(origObj);
                                germanObj.interactionModel.languageModel.intents = InteractionModel_1.getIntents(ctx.dir, 'de');
                                englishObj.interactionModel.languageModel.intents = InteractionModel_1.getIntents(ctx.dir, 'en');
                                fse.removeSync(ctx.dir + "/models/en-US.json");
                                fse.removeSync(ctx.dir + "/models/en-GB.json");
                                fse.removeSync(ctx.dir + "/models/en-CA.json");
                                fse.removeSync(ctx.dir + "/models/en-IN.json");
                                fse.removeSync(ctx.dir + "/models/en-AU.json");
                                fse.removeSync(ctx.dir + "/models/de-DE.json");
                                fse.writeJsonSync(ctx.dir + "/models/en-US.json", englishObj, jsonOptions);
                                fse.writeJsonSync(ctx.dir + "/models/en-GB.json", englishObj, jsonOptions);
                                fse.writeJsonSync(ctx.dir + "/models/en-CA.json", englishObj, jsonOptions);
                                fse.writeJsonSync(ctx.dir + "/models/en-IN.json", englishObj, jsonOptions);
                                fse.writeJsonSync(ctx.dir + "/models/en-AU.json", englishObj, jsonOptions);
                                fse.writeJsonSync(ctx.dir + "/models/de-DE.json", germanObj, jsonOptions);
                                return [2 /*return*/];
                        }
                    });
                }); }
            },
            {
                title: 'Deploy skill',
                task: function (ctx, task) { return __awaiter(_this, void 0, void 0, function () {
                    var e_4;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 3, , 4]);
                                task.output = 'Deploying skill information.';
                                return [4 /*yield*/, execa(askPath, ['deploy', '-t', 'skill'], { cwd: ctx.dir })];
                            case 1:
                                _a.sent();
                                task.output = 'Deploying skill slot data and intents.';
                                return [4 /*yield*/, execa(askPath, ['deploy', '-t', 'model'], { cwd: ctx.dir })];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                e_4 = _a.sent();
                                throw new Error('Error deploying. Please try again');
                            case 4: return [2 /*return*/];
                        }
                    });
                }); }
            }
        ]);
        tasks.run()["catch"](function (err) { });
        return [2 /*return*/];
    });
}); };
exports.generateZip = function (args, options, logger) {
    var tasks = new Listr([
        {
            title: 'Check config file',
            task: function (ctx) {
                ctx.configFile = 'kodi.config';
                if (!fs.existsSync(ctx.configFile)) {
                    throw new Error("Config file not found. Please run 'lexigram init-config' first.");
                }
            }
        },
        {
            title: 'Validate config file',
            task: function (ctx) {
                ctx.config = new ParseIni_1["default"]();
                var file = fs.readFileSync(ctx.configFile, 'utf8');
                ctx.config.parse(file);
                if (!ctx.config.verifyData()) {
                    throw new Error('Configuration file is not valid. Please update it with the correct information.');
                }
            }
        },
        {
            title: 'Check skill directory',
            task: function (ctx) {
                ctx.dir = args.skill;
                if (!fs.existsSync(ctx.dir)) {
                    throw new Error("Skill directory not found. Please run 'lexigram init-skill " + ctx.dir + "' first.");
                }
            }
        },
        {
            title: 'Remove old Lambda function code',
            task: function (ctx) {
                fse.removeSync(ctx.dir + "/lambda/skill");
                fse.ensureDir(ctx.dir + "/lambda/skill");
            }
        },
        {
            title: 'Download latest source code',
            task: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                var releaseUrl, url, request, releaseRequest, e_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fse.removeSync(ctx.dir + "-release.zip");
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            url = ctx.dir === 'kanzi' ?
                                'https://api.github.com/repos/m0ngr31/kanzi/releases/latest' :
                                'https://api.github.com/repos/m0ngr31/koko/releases/latest';
                            return [4 /*yield*/, axios_1["default"].request({
                                    url: url
                                })];
                        case 2:
                            request = _a.sent();
                            releaseUrl = request.data.assets[0].browser_download_url;
                            return [4 /*yield*/, axios_1["default"].request({
                                    url: releaseUrl,
                                    responseType: 'arraybuffer'
                                })];
                        case 3:
                            releaseRequest = _a.sent();
                            fs.writeFileSync(ctx.dir + "-release.zip", releaseRequest.data);
                            return [3 /*break*/, 5];
                        case 4:
                            e_5 = _a.sent();
                            throw new Error("Could not download latest release. Please try again.");
                        case 5: return [2 /*return*/];
                    }
                });
            }); }
        },
        {
            title: 'Extract source code',
            task: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                var e_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, promisePipe(fs.createReadStream(ctx.dir + "-release.zip"), unzip.Extract({ path: ctx.dir + "/lambda/skill" }))];
                        case 1:
                            _a.sent();
                            fse.removeSync(ctx.dir + "-release.zip");
                            return [3 /*break*/, 3];
                        case 2:
                            e_6 = _a.sent();
                            throw new Error('Could not extract source code. Please try again.');
                        case 3: return [2 /*return*/];
                    }
                });
            }); }
        },
        {
            title: 'Copy config file',
            task: function (ctx) {
                try {
                    fse.copySync(ctx.configFile, ctx.dir + "/lambda/skill/" + ctx.configFile);
                }
                catch (e) {
                    throw new Error('Could not copy config file. Please try again.');
                }
            }
        },
        {
            title: 'Create deployment zip file',
            task: function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                var archive;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fse.removeSync(ctx.dir + "-lambda-upload.zip");
                            archive = archiver(ctx.dir + "-lambda-upload.zip", {
                                zlib: { level: 9 }
                            });
                            archive.directory(ctx.dir + "/lambda/skill", false);
                            return [4 /*yield*/, archive.finalize()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); }
        }
    ]);
    tasks.run()
        .then(function () {
        logger.info("\nFile is ready. Please upload '" + args.skill + "-lambda-upload.zip' to AWS Lambda.");
    })["catch"](function (err) { });
};
