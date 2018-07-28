"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var _ = require("lodash");
var fs = require("fs");
var fse = require("fs-extra");
var path = require("path");
var process = require("process");
var axios_1 = require("axios");
var ErrorHandler_1 = require("./ErrorHandler");
exports.getIntents = function (skill, lang) {
    var intents = [];
    var file;
    if (lang === 'en') {
        file = path.join(process.cwd(), skill + "/source/repo/speech_assets/SampleUtterances.en.txt");
    }
    else if (lang === 'de') {
        file = path.join(process.cwd(), skill + "/source/repo/speech_assets/SampleUtterances.de.txt");
    }
    else if (lang === 'fr') {
        file = path.join(process.cwd(), skill + "/source/repo/speech_assets/SampleUtterances.fr.txt");
    }
    var intentsFile = path.join(process.cwd(), skill + "/source/repo/speech_assets/IntentSchema.json");
    var parsedIntents = fse.readJsonSync(intentsFile);
    var rawUtterances = fs.readFileSync(file, 'utf8');
    var utterances = rawUtterances.split(/\n/i);
    _.forEach(parsedIntents.intents, function (intent) {
        var intentObj = {
            name: intent.intent,
            samples: []
        };
        if (intent.slots) {
            intentObj.slots = intent.slots;
        }
        intents.push(intentObj);
    });
    _.forEach(utterances, function (utterance) {
        var _a = utterance.split(' '), intent = _a[0], sample = _a.slice(1);
        sample = sample.join(' ');
        var intentObj = _.find(intents, function (intentObj) { return intentObj.name === intent; });
        if (intentObj) {
            intentObj.samples.push(sample);
        }
    });
    return intents;
};
exports.getSlots = function (skill, config) { return __awaiter(_this, void 0, void 0, function () {
    var types, slots;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                types = [];
                return [4 /*yield*/, getSlotData(config)];
            case 1:
                slots = _a.sent();
                _.forIn(slots, function (value, name) {
                    var type = {
                        values: [],
                        name: name
                    };
                    if (value.length === 0) {
                        value.push('Empty');
                    }
                    _.forEach(value, function (slotVal) {
                        type.values.push({
                            name: {
                                value: slotVal
                            }
                        });
                    });
                    var shouldInsert = true;
                    var kanziOnly = [
                        'SHOWS',
                        'SHOWGENRES',
                        'MOVIES',
                        'MOVIEGENRES',
                        'MUSICVIDEOS',
                        'MUSICVIDEOGENRES',
                        'VIDEOPLAYLISTS',
                        'ADDONS'
                    ];
                    if (kanziOnly.find(function (slot) { return slot === name; }) && skill !== 'kanzi') {
                        shouldInsert = false;
                    }
                    if (shouldInsert) {
                        types.push(type);
                    }
                });
                return [2 /*return*/, types];
        }
    });
}); };
var getSlotData = function (config) { return __awaiter(_this, void 0, void 0, function () {
    var connectionInfo, url, mainOptions, musicPlaylistOptions, videoPlaylistOptions, addonsVideoOptions, addonsAudioOptions, addonsImageOptions, addonsExeOptions, getTVShows, getTVShowGenres, getMovies, getMovieGenres, getMusicVideos, getMusicVideoGenres, getMusicians, getAlbums, getSongs, getMusicGenres, getMusicPlaylists, getVideoPlaylists, getAddonsVideo, getAddonsAudio, getAddonsImage, getAddonsExe, tvShowsArr, tvGenresArr, moviesArr, movieGenresArr, musicvideosArr, musicvideoGenresArr, musiciansArr, albumsArr, songsArr, musicGenresArr, musicPlaylistsArr, videoPlaylistsArr, addonsArr, optionsObj, promisesArr, _a, shows, showgenres, movies, moviegenres, musicvideos, musicvideogenres, musicians, albums, songs, musicgenres, musicplaylists, videoplaylists, addonsvideo, addonsaudio, addonsimage, addonsexe, e_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                connectionInfo = config.schema['DEFAULT'];
                url = connectionInfo.scheme + "://" + connectionInfo.address + ":" + connectionInfo.port;
                if (connectionInfo.subpath && connectionInfo.subpath.length) {
                    url += "/" + connectionInfo.subpath;
                }
                url += '/jsonrpc';
                mainOptions = {
                    "jsonrpc": "2.0",
                    "id": 1
                };
                musicPlaylistOptions = _.clone(mainOptions);
                musicPlaylistOptions.params = { "directory": "special://musicplaylists" };
                videoPlaylistOptions = _.clone(mainOptions);
                videoPlaylistOptions.params = { "directory": "special://videoplaylists" };
                addonsVideoOptions = _.clone(mainOptions);
                addonsVideoOptions.params = { "content": "video", "properties": ["name"] };
                addonsAudioOptions = _.clone(mainOptions);
                addonsAudioOptions.params = { "content": "audio", "properties": ["name"] };
                addonsImageOptions = _.clone(mainOptions);
                addonsImageOptions.params = { "content": "image", "properties": ["name"] };
                addonsExeOptions = _.clone(mainOptions);
                addonsExeOptions.params = { "content": "executable", "properties": ["name"] };
                getTVShows = _.clone(mainOptions);
                getTVShows.method = "VideoLibrary.GetTVShows";
                getTVShowGenres = _.clone(mainOptions);
                getTVShowGenres.method = "VideoLibrary.GetGenres";
                getTVShowGenres.params = { "type": "tvshow" };
                getMovies = _.clone(mainOptions);
                getMovies.method = "VideoLibrary.GetMovies";
                getMovieGenres = _.clone(mainOptions);
                getMovieGenres.method = "VideoLibrary.GetGenres";
                getMovieGenres.params = { "type": "movie" };
                getMusicVideos = _.clone(mainOptions);
                getMusicVideos.method = "VideoLibrary.GetMusicVideos";
                getMusicVideoGenres = _.clone(mainOptions);
                getMusicVideoGenres.method = "VideoLibrary.GetGenres";
                getMusicVideoGenres.params = { "type": "musicvideo" };
                getMusicians = _.clone(mainOptions);
                getMusicians.method = "AudioLibrary.GetArtists";
                getAlbums = _.clone(mainOptions);
                getAlbums.method = "AudioLibrary.GetAlbums";
                getSongs = _.clone(mainOptions);
                getSongs.method = "AudioLibrary.GetSongs";
                getMusicGenres = _.clone(mainOptions);
                getMusicGenres.method = "AudioLibrary.GetGenres";
                getMusicPlaylists = _.clone(musicPlaylistOptions);
                getMusicPlaylists.method = "Files.GetDirectory";
                getVideoPlaylists = _.clone(videoPlaylistOptions);
                getVideoPlaylists.method = "Files.GetDirectory";
                getAddonsVideo = _.clone(addonsVideoOptions);
                getAddonsVideo.method = "Addons.GetAddons";
                getAddonsAudio = _.clone(addonsAudioOptions);
                getAddonsAudio.method = "Addons.GetAddons";
                getAddonsImage = _.clone(addonsImageOptions);
                getAddonsImage.method = "Addons.GetAddons";
                getAddonsExe = _.clone(addonsExeOptions);
                getAddonsExe.method = "Addons.GetAddons";
                tvShowsArr = [];
                tvGenresArr = [];
                moviesArr = [];
                movieGenresArr = [];
                musicvideosArr = [];
                musicvideoGenresArr = [];
                musiciansArr = [];
                albumsArr = [];
                songsArr = [];
                musicGenresArr = [];
                musicPlaylistsArr = [];
                videoPlaylistsArr = [];
                addonsArr = [];
                optionsObj = {
                    method: 'post',
                    url: url,
                    timeout: 10000,
                    auth: {
                        username: connectionInfo.username,
                        password: connectionInfo.password
                    }
                };
                promisesArr = [
                    axios_1["default"](__assign({}, optionsObj, { data: getTVShows }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getTVShowGenres }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMovies }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMovieGenres }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMusicVideos }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMusicVideoGenres }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMusicians }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getAlbums }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getSongs }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMusicGenres }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getMusicPlaylists }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getVideoPlaylists }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getAddonsVideo }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getAddonsAudio }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getAddonsImage }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); }),
                    axios_1["default"](__assign({}, optionsObj, { data: getAddonsExe }))["catch"](function (err) { throw new Error('Error talking to Kodi.'); })
                ];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, axios_1["default"].all(promisesArr)];
            case 2:
                _a = _b.sent(), shows = _a[0], showgenres = _a[1], movies = _a[2], moviegenres = _a[3], musicvideos = _a[4], musicvideogenres = _a[5], musicians = _a[6], albums = _a[7], songs = _a[8], musicgenres = _a[9], musicplaylists = _a[10], videoplaylists = _a[11], addonsvideo = _a[12], addonsaudio = _a[13], addonsimage = _a[14], addonsexe = _a[15];
                if (_.hasIn(shows, 'data.result.tvshows')) {
                    _.forEach(shows.data.result.tvshows, function (tvshow) {
                        var str = sanitizeResult(tvshow.label);
                        tvShowsArr.push(str);
                    });
                }
                if (_.hasIn(showgenres, 'data.result.genres')) {
                    _.forEach(showgenres.data.result.genres, function (genre) {
                        var str = sanitizeResult(genre.label);
                        tvGenresArr.push(str);
                    });
                }
                if (_.hasIn(movies, 'data.result.movies')) {
                    _.forEach(movies.data.result.movies, function (movie) {
                        var str = sanitizeResult(movie.label);
                        moviesArr.push(str);
                    });
                }
                if (_.hasIn(moviegenres, 'data.result.genres')) {
                    _.forEach(moviegenres.data.result.genres, function (genre) {
                        var str = sanitizeResult(genre.label);
                        movieGenresArr.push(str);
                    });
                }
                if (_.hasIn(musicvideos, 'data.result.musicvideos')) {
                    _.forEach(musicvideos.data.result.musicvideos, function (musicvideo) {
                        var str = sanitizeResult(musicvideo.label);
                        musicvideosArr.push(str);
                    });
                }
                if (_.hasIn(musicvideogenres, 'data.result.genres')) {
                    _.forEach(musicvideogenres.data.result.genres, function (genre) {
                        var str = sanitizeResult(genre.label);
                        musicvideoGenresArr.push(str);
                    });
                }
                if (_.hasIn(musicians, 'data.result.artists')) {
                    _.forEach(musicians.data.result.artists, function (artist) {
                        var str = sanitizeResult(artist.label);
                        musiciansArr.push(str);
                    });
                }
                if (_.hasIn(albums, 'data.result.albums')) {
                    _.forEach(albums.data.result.albums, function (album) {
                        var str = sanitizeResult(album.label);
                        albumsArr.push(str);
                    });
                }
                if (_.hasIn(songs, 'data.result.songs')) {
                    _.forEach(songs.data.result.songs, function (song) {
                        var str = sanitizeResult(song.label);
                        songsArr.push(str);
                    });
                }
                if (_.hasIn(musicgenres, 'data.result.genres')) {
                    _.forEach(musicgenres.data.result.genres, function (genre) {
                        var str = sanitizeResult(genre.label);
                        musicGenresArr.push(str);
                    });
                }
                if (_.hasIn(musicplaylists, 'data.result.files')) {
                    _.forEach(musicplaylists.data.result.files, function (playlist) {
                        var str = sanitizeResult(playlist.label);
                        musicPlaylistsArr.push(str);
                    });
                }
                if (_.hasIn(videoplaylists, 'data.result.files')) {
                    _.forEach(videoplaylists.data.result.files, function (playlist) {
                        var str = sanitizeResult(playlist.label);
                        videoPlaylistsArr.push(str);
                    });
                }
                if (_.hasIn(addonsvideo, 'data.result.addons')) {
                    _.forEach(addonsvideo.data.result.addons, function (addon) {
                        var str = sanitizeResult(addon.name);
                        addonsArr.push(str);
                    });
                }
                if (_.hasIn(addonsaudio, 'data.result.addons')) {
                    _.forEach(addonsaudio.data.result.addons, function (addon) {
                        var str = sanitizeResult(addon.name);
                        addonsArr.push(str);
                    });
                }
                if (_.hasIn(addonsimage, 'data.result.addons')) {
                    _.forEach(addonsimage.data.result.addons, function (addon) {
                        var str = sanitizeResult(addon.name);
                        addonsArr.push(str);
                    });
                }
                if (_.hasIn(addonsexe, 'data.result.addons')) {
                    _.forEach(addonsexe.data.result.addons, function (addon) {
                        var str = sanitizeResult(addon.name);
                        addonsArr.push(str);
                    });
                }
                tvShowsArr = _.chain(tvShowsArr).compact().uniq().shuffle().take(100).orderBy().value();
                tvGenresArr = _.chain(tvGenresArr).compact().uniq().shuffle().take(100).orderBy().value();
                moviesArr = _.chain(moviesArr).compact().uniq().shuffle().take(100).orderBy().value();
                movieGenresArr = _.chain(movieGenresArr).compact().uniq().shuffle().take(100).orderBy().value();
                musicvideosArr = _.chain(musicvideosArr).compact().uniq().shuffle().take(100).orderBy().value();
                musicvideoGenresArr = _.chain(musicvideoGenresArr).compact().uniq().shuffle().take(100).orderBy().value();
                musiciansArr = _.chain(musiciansArr).compact().uniq().shuffle().take(100).orderBy().value();
                albumsArr = _.chain(albumsArr).compact().uniq().shuffle().take(100).orderBy().value();
                songsArr = _.chain(songsArr).compact().uniq().shuffle().take(100).orderBy().value();
                musicGenresArr = _.chain(musicGenresArr).compact().uniq().shuffle().take(100).orderBy().value();
                musicPlaylistsArr = _.chain(musicPlaylistsArr).compact().uniq().shuffle().take(100).orderBy().value();
                videoPlaylistsArr = _.chain(videoPlaylistsArr).compact().uniq().shuffle().take(100).orderBy().value();
                addonsArr = _.chain(addonsArr).compact().uniq().shuffle().take(100).orderBy().value();
                return [2 /*return*/, { 'SHOWS': tvShowsArr, 'SHOWGENRES': tvGenresArr, 'MOVIES': moviesArr, 'MOVIEGENRES': movieGenresArr, 'MUSICVIDEOS': musicvideosArr, 'MUSICVIDEOGENRES': musicvideoGenresArr, 'MUSICARTISTS': musiciansArr, 'MUSICALBUMS': albumsArr, 'MUSICSONGS': songsArr, 'MUSICGENRES': musicGenresArr, 'MUSICPLAYLISTS': musicPlaylistsArr, 'VIDEOPLAYLISTS': videoPlaylistsArr, 'ADDONS': addonsArr }];
            case 3:
                e_1 = _b.sent();
                ErrorHandler_1.ErrorLogger(e_1);
                throw new Error('Kodi server configuration settings are wrong. Please double-check kodi.config to make sure it is setup properly.');
            case 4: return [2 /*return*/];
        }
    });
}); };
var sanitizeResult = function (str) {
    // Remove invalid characters, per Amazon:
    // Slot type values can contain alphanumeric characters, spaces, commas,
    // apostrophes, periods, hyphens, ampersands and the @ symbol only.
    str = str.replace(/[^a-zA-Z0-9\ \,\'\.\-\@\&]/g, ' ');
    str = str.replace(/[ ]{2,}/g, ' '); // Remove double spaces
    // Slot items cannot exceed 140 chars, per Amazon
    if (str.length > 140) {
        str = str.substring(0, 141);
        str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
    }
    str = _.trim(str);
    return str;
};
