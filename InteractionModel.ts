import * as _ from 'lodash';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as process from 'process';
import axios from 'axios';

export const getIntents = (skill, lang) => {
  const intents: any[] = [];
  let file;

  if (lang === 'en') {
    file = path.join(process.cwd(), `${skill}/lambda/repo/speech_assets/SampleUtterances.en.txt`);
  } else {
    file = path.join(process.cwd(), `${skill}/lambda/repo/speech_assets/SampleUtterances.de.txt`);
  }

  const intentsFile = path.join(process.cwd(), `${skill}/lambda/repo/speech_assets/IntentSchema.json`)
  const parsedIntents = fse.readJsonSync(intentsFile);

  const rawUtterances = fs.readFileSync(file, 'utf8');
  const utterances = rawUtterances.split(/\n/i);

  _.forEach(parsedIntents.intents, intent => {
    const intentObj: any = {
      name: intent.intent,
      samples: []
    };

    if (intent.slots) {
      intentObj.slots = intent.slots
    }

    intents.push(intentObj);
  });

  _.forEach(utterances, utterance => {
    let [intent, ...sample] = utterance.split(' ');
    sample = sample.join(' ');

    const intentObj = _.find(intents, intentObj => intentObj.name === intent);

    if (intentObj) {
      intentObj.samples.push(sample);
    }
  });

  _.remove(intents, intent => !intent.samples.length);

  return intents;
};

export const getSlots = async (skill, config) => {
  const types: any = [];

  const slots: any = await getSlotData(config);

  _.forIn(slots, (value, name) => {
    const type: any = {
      values: [],
      name
    };

    if (value.length === 0) {
      value.push('Empty');
    }

    _.forEach(value, slotVal => {
      type.values.push(
        {
          name: {
            value: slotVal
          }
        }
      );
    });

    let shouldInsert = true;

    const kanziOnly = [
      'SHOWS',
      'SHOWGENRES',
      'MOVIES',
      'MOVIEGENRES',
      'MUSICVIDEOS',
      'MUSICVIDEOGENRES',
      'VIDEOPLAYLISTS',
      'ADDONS'
    ];

    if (kanziOnly.find(slot => slot === name) && skill !== 'kanzi') {
      shouldInsert = false;
    }

    if (shouldInsert) {
      types.push(type);
    }
  });

  return types;
};

const getSlotData = async config => {
  const connectionInfo = config.schema['DEFAULT'];
  let url = `${connectionInfo.scheme}://${connectionInfo.address}:${connectionInfo.port}`;

  if (connectionInfo.subpath && connectionInfo.subpath.length) {
    url += `/${connectionInfo.subpath}`
  }
  url += '/jsonrpc';

  const mainOptions = {
    "jsonrpc": "2.0",
    "id": 1
  };

  const musicPlaylistOptions = _.clone(mainOptions);
  musicPlaylistOptions.params = {"directory": "special://musicplaylists"};
  const videoPlaylistOptions = _.clone(mainOptions);
  videoPlaylistOptions.params = {"directory": "special://videoplaylists"};

  const addonsVideoOptions = _.clone(mainOptions);
  addonsVideoOptions.params = {"content": "video", "properties":["name"]};
  const addonsAudioOptions = _.clone(mainOptions);
  addonsAudioOptions.params = {"content": "audio", "properties":["name"]};
  const addonsImageOptions = _.clone(mainOptions);
  addonsImageOptions.params = {"content": "image", "properties":["name"]};
  const addonsExeOptions = _.clone(mainOptions);
  addonsExeOptions.params = {"content": "executable", "properties":["name"]};

  const getTVShows = _.clone(mainOptions);
  getTVShows.method = "VideoLibrary.GetTVShows";
  const getTVShowGenres = _.clone(mainOptions);
  getTVShowGenres.method = "VideoLibrary.GetGenres";
  getTVShowGenres.params = {"type":"tvshow"};
  const getMovies = _.clone(mainOptions);
  getMovies.method = "VideoLibrary.GetMovies";
  const getMovieGenres = _.clone(mainOptions);
  getMovieGenres.method = "VideoLibrary.GetGenres";
  getMovieGenres.params = {"type":"movie"};
  const getMusicVideos = _.clone(mainOptions);
  getMusicVideos.method = "VideoLibrary.GetMusicVideos";
  const getMusicVideoGenres = _.clone(mainOptions);
  getMusicVideoGenres.method = "VideoLibrary.GetGenres";
  getMusicVideoGenres.params = {"type":"musicvideo"};
  const getMusicians = _.clone(mainOptions);
  getMusicians.method = "AudioLibrary.GetArtists";
  const getAlbums = _.clone(mainOptions);
  getAlbums.method = "AudioLibrary.GetAlbums";
  const getSongs = _.clone(mainOptions);
  getSongs.method = "AudioLibrary.GetSongs";
  const getMusicGenres = _.clone(mainOptions);
  getMusicGenres.method = "AudioLibrary.GetGenres";
  const getMusicPlaylists = _.clone(musicPlaylistOptions);
  getMusicPlaylists.method = "Files.GetDirectory";
  const getVideoPlaylists = _.clone(videoPlaylistOptions);
  getVideoPlaylists.method = "Files.GetDirectory";
  const getAddonsVideo = _.clone(addonsVideoOptions);
  getAddonsVideo.method = "Addons.GetAddons";
  const getAddonsAudio = _.clone(addonsAudioOptions);
  getAddonsAudio.method = "Addons.GetAddons";
  const getAddonsImage = _.clone(addonsImageOptions);
  getAddonsImage.method = "Addons.GetAddons";
  const getAddonsExe = _.clone(addonsExeOptions);
  getAddonsExe.method = "Addons.GetAddons";

  let tvShowsArr: any[] = [];
  let tvGenresArr: any[] = [];
  let moviesArr: any[] = [];
  let movieGenresArr: any[] = [];
  let musicvideosArr: any[] = [];
  let musicvideoGenresArr: any[] = [];
  let musiciansArr: any[] = [];
  let albumsArr: any[] = [];
  let songsArr: any[] = [];
  let musicGenresArr: any[] = [];
  let musicPlaylistsArr: any[] = [];
  let videoPlaylistsArr: any[] = [];
  let addonsArr: any[] = [];

  const optionsObj = {
    method: 'post',
    url,
    timeout: 10000,
    auth: {
      username: connectionInfo.username,
      password: connectionInfo.password
    }
  }

  const promisesArr = [
    axios({ ...optionsObj, data: getTVShows }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getTVShowGenres }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMovies }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMovieGenres }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMusicVideos }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMusicVideoGenres }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMusicians }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getAlbums }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getSongs }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMusicGenres }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getMusicPlaylists }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getVideoPlaylists }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getAddonsVideo }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getAddonsAudio }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getAddonsImage }).catch(err => { throw new Error('Error talking to Kodi.'); }),
    axios({ ...optionsObj, data: getAddonsExe }).catch(err => { throw new Error('Error talking to Kodi.'); })
  ];

  try {
    const [
      shows,
      showgenres,
      movies,
      moviegenres,
      musicvideos,
      musicvideogenres,
      musicians,
      albums,
      songs,
      musicgenres,
      musicplaylists,
      videoplaylists,
      addonsvideo,
      addonsaudio,
      addonsimage,
      addonsexe
    ] = await axios.all(promisesArr);

      if (shows.data.result && shows.data.result.tvshows) {
      _.forEach(shows.data.result.tvshows, function (tvshow) {
        var str = sanitizeResult(tvshow.label);
        var str_stripped = sanitizeResult(tvshow.label);
        tvShowsArr.push(str);
        tvShowsArr.push(str_stripped);
      });
    }
    if (showgenres.data.result && showgenres.data.result.genres) {
      _.forEach(showgenres.data.result.genres, function (genre) {
        var str = sanitizeResult(genre.label);
        var str_stripped = sanitizeResult(genre.label);
        tvGenresArr.push(str);
        tvGenresArr.push(str_stripped);
      });
    }
    if (movies.data.result && movies.data.result.movies) {
      _.forEach(movies.data.result.movies, function (movie) {
        var str = sanitizeResult(movie.label);
        var str_stripped = sanitizeResult(movie.label);
        moviesArr.push(str);
        moviesArr.push(str_stripped);
      });
    }
    if (moviegenres.data.result && moviegenres.data.result.genres) {
      _.forEach(moviegenres.data.result.genres, function (genre) {
        var str = sanitizeResult(genre.label);
        var str_stripped = sanitizeResult(genre.label);
        movieGenresArr.push(str);
        movieGenresArr.push(str_stripped);
      });
    }
    if (musicvideos.data.result && musicvideos.data.result.musicvideos) {
      _.forEach(musicvideos.data.result.musicvideos, function (musicvideo) {
        var str = sanitizeResult(musicvideo.label);
        var str_stripped = sanitizeResult(musicvideo.label);
        musicvideosArr.push(str);
        musicvideosArr.push(str_stripped);
      });
    }
    if (musicvideogenres.data.result && musicvideogenres.data.result.genres) {
      _.forEach(musicvideogenres.data.result.genres, function (genre) {
        var str = sanitizeResult(genre.label);
        var str_stripped = sanitizeResult(genre.label);
        musicvideoGenresArr.push(str);
        musicvideoGenresArr.push(str_stripped);
      });
    }
    if (musicians.data.result && musicians.data.result.artists) {
      _.forEach(musicians.data.result.artists, function (artist) {
        var str = sanitizeResult(artist.label);
        var str_stripped = sanitizeResult(artist.label);
        musiciansArr.push(str);
        musiciansArr.push(str_stripped);
      });
    }
    if (albums.data.result && albums.data.result.albums) {
      _.forEach(albums.data.result.albums, function (album) {
        var str = sanitizeResult(album.label);
        var str_stripped = sanitizeResult(album.label);
        albumsArr.push(str);
        albumsArr.push(str_stripped);
      });
    }
    if (songs.data.result && songs.data.result.songs) {
      _.forEach(songs.data.result.songs, function (song) {
        var str = sanitizeResult(song.label);
        var str_stripped = sanitizeResult(song.label);
        songsArr.push(str);
        songsArr.push(str_stripped);
      });
    }
    if (musicgenres.data.result && musicgenres.data.result.genres) {
      _.forEach(musicgenres.data.result.genres, function (genre) {
        var str = sanitizeResult(genre.label);
        var str_stripped = sanitizeResult(genre.label);
        musicGenresArr.push(str);
        musicGenresArr.push(str_stripped);
      });
    }
    if (musicplaylists.data.result && musicplaylists.data.result.files) {
      _.forEach(musicplaylists.data.result.files, function (playlist) {
        var str = sanitizeResult(playlist.label);
        var str_stripped = sanitizeResult(playlist.label);
        musicPlaylistsArr.push(str);
        musicPlaylistsArr.push(str_stripped);
      });
    }
    if (videoplaylists.data.result && videoplaylists.data.result.files) {
      _.forEach(videoplaylists.data.result.files, function (playlist) {
        var str = sanitizeResult(playlist.label);
        var str_stripped = sanitizeResult(playlist.label);
        videoPlaylistsArr.push(str);
        videoPlaylistsArr.push(str_stripped);
      });
    }
    if (addonsvideo.data.result && addonsvideo.data.result.addons) {
      _.forEach(addonsvideo.data.result.addons, function (addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }
    if (addonsaudio.data.result && addonsaudio.data.result.addons) {
      _.forEach(addonsaudio.data.result.addons, function (addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }
    if (addonsimage.data.result && addonsimage.data.result.addons) {
      _.forEach(addonsimage.data.result.addons, function (addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }
    if (addonsexe.data.result && addonsexe.data.result.addons) {
      _.forEach(addonsexe.data.result.addons, function (addon) {
        var str = sanitizeResult(addon.name);
        var str_stripped = sanitizeResult(addon.name);
        addonsArr.push(str);
        addonsArr.push(str_stripped);
      });
    }

    tvShowsArr = _.take(_.shuffle(_.compact(_.uniq(tvShowsArr))), 100);
    tvGenresArr = _.take(_.shuffle(_.compact(_.uniq(tvGenresArr))), 100);
    moviesArr = _.take(_.shuffle(_.compact(_.uniq(moviesArr))), 100);
    movieGenresArr = _.take(_.shuffle(_.compact(_.uniq(movieGenresArr))), 100);
    musicvideosArr = _.take(_.shuffle(_.compact(_.uniq(musicvideosArr))), 100);
    musicvideoGenresArr = _.take(_.shuffle(_.compact(_.uniq(musicvideoGenresArr))), 100);
    musiciansArr = _.take(_.shuffle(_.compact(_.uniq(musiciansArr))), 100);
    albumsArr = _.take(_.shuffle(_.compact(_.uniq(albumsArr))), 100);
    songsArr = _.take(_.shuffle(_.compact(_.uniq(songsArr))), 100);
    musicGenresArr = _.take(_.shuffle(_.compact(_.uniq(musicGenresArr))), 100);
    musicPlaylistsArr = _.take(_.shuffle(_.compact(_.uniq(musicPlaylistsArr))), 100);
    videoPlaylistsArr = _.take(_.shuffle(_.compact(_.uniq(videoPlaylistsArr))), 100);
    addonsArr = _.take(_.shuffle(_.compact(_.uniq(addonsArr))), 100);

    return { 'SHOWS': tvShowsArr, 'SHOWGENRES': tvGenresArr, 'MOVIES': moviesArr, 'MOVIEGENRES': movieGenresArr, 'MUSICVIDEOS': musicvideosArr, 'MUSICVIDEOGENRES': musicvideoGenresArr, 'MUSICARTISTS': musiciansArr, 'MUSICALBUMS': albumsArr, 'MUSICSONGS': songsArr, 'MUSICGENRES': musicGenresArr, 'MUSICPLAYLISTS': musicPlaylistsArr, 'VIDEOPLAYLISTS': videoPlaylistsArr, 'ADDONS': addonsArr };
  } catch (e) {
    console.log(e);
    throw new Error('Kodi server configuration settings are wrong. Please double-check kodi.config to make sure it is setup properly.');
  }
};

const sanitizeResult = str => {
  // Remove invalid characters, per Amazon:
  // Slot type values can contain alphanumeric characters, spaces, commas,
  // apostrophes, periods, hyphens, ampersands and the @ symbol only.
  str = str.replace(/[`~!#$%^*()_=+\[\]{}\\|;:"<>/?]/g, ' ');

  // Slot items cannot exceed 140 chars, per Amazon
  if (str.length > 140) {
    str = str.substring(0, 141);
    str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
  }

  str = _.trim(str);
  return str;
};