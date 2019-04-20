import * as execSh from 'exec-sh';
import * as execa from 'execa';
import * as fs from 'fs';
import * as readlineSync from 'readline-sync';
import * as fse from 'fs-extra';
import * as Listr from 'listr';
import * as unzip from 'unzip-stream';
import * as promisePipe from 'promisepipe';
import * as _ from 'lodash';
import * as archiver from 'archiver-promise';
import * as path from 'path';
import * as process from 'process';
import axios from 'axios';

import ParseIni from './ParseIni';
import {getIntents, getSlots} from './InteractionModel';
import {ErrorLogger} from './ErrorHandler';

const askPath = `${__dirname}/../node_modules/.bin/ask`;

const jsonOptions = {
  spaces: 2
};

export const loginOrSwitch = (args, options, logger) => {
  if (options.noBrowser) {
    execSh(`${askPath} init --no-browser`, {});
  } else {
    execSh(`${askPath} init`, {});
  }
};

export const downloadConfig = async (args, options, logger) => {
  const url = 'https://rawgit.com/m0ngr31/kodi-voice/master/kodi_voice/kodi.config.example';
  const fileName = 'kodi.config';

  if (fs.existsSync(fileName)) {
    const answer = readlineSync.keyInYNStrict('Config file already exists. Would you like to overwrite?');

    if (!answer) {
      return;
    }
  }

  const request = await axios.request({
    url,
    responseType: 'arraybuffer'
  });

  fs.writeFileSync(fileName, request.data);
};

export const initSkill = async (args, options, logger) => {
  const dir = args.skill;

  const tasks = new Listr([
    {
      title: `Initialize ${dir} skill`,
      task: async () => {
        let doInit = false;

        if (fs.existsSync(dir)) {
          const answer = readlineSync.keyInYNStrict('Skill directory exists. Would you like to overwrite?');

          if (answer) {
            let skillId = '';

            const skillConfig = fse.readJsonSync(`${dir}/.ask/config`);

            if (_.hasIn(skillConfig, 'deploy_settings.default.skill_id')) {
              skillId = skillConfig.deploy_settings.default.skill_id;

              try {
                await execa(askPath, ['api', 'delete-skill', '--skill-id', skillId], { cwd: dir, timeout: 60000 });
              } catch (e) { }
            }

            fse.removeSync(dir);
            doInit = true;
          }
        } else {
          doInit = true;
        }

        if (doInit) {
          try {
            await execa(askPath, ['new', '-n', dir]);

            const newSkillConfig = fse.readJsonSync(`${dir}/.ask/config`);
            delete newSkillConfig.deploy_settings.default.merge;
            fse.writeJsonSync(`${dir}/.ask/config`, newSkillConfig, jsonOptions);
          } catch (e) {
            ErrorLogger(e);
            throw new Error('Could not create skill. Please try again.');
          }
        }
      }
    }
  ]);

  tasks.run().catch(err => {});
};

export const updateOrDeploySkill = async (args, options, logger) => {
  let getInput = true;
  let answer = '';
  let uri = '';
  let invocationName = args.skill;
  let changeApi = false;

  if (args.skill === 'kanzi') {
    if (options.invocationName && options.invocationName.length) {
      invocationName = options.invocationName.toLowerCase();
    } else {
      const invocationOpts = ['Kanzi', 'Kodi'];
      let invocationAnswer = readlineSync.keyInSelect(invocationOpts, 'What would you like your invocation name to be?');

      if (invocationAnswer === -1) {
        return;
      }

      invocationName = invocationOpts[invocationAnswer].toLowerCase();
    }
  }

  if (fs.existsSync(args.skill) && fs.existsSync(`${args.skill}/skill.json`)) {
    const existingSkillConfig = fse.readJsonSync(`${args.skill}/skill.json`);

    if (_.hasIn(existingSkillConfig, 'manifest.apis.custom.endpoint.uri')) {
      getInput = false;
      changeApi = true;
      uri = existingSkillConfig.manifest.apis.custom.endpoint.uri;
    }
  }

  if (options.url && options.url.length) {
    getInput = false;
    changeApi = true;
    uri = options.url;
  }

  while (getInput) {
    answer = readlineSync.question("What's the URL for your skill server? (ex. https://... or arn:...). Press enter to skip. ");

    if (answer.length && (answer.substring(0, 8) === 'https://' || answer.substring(0, 4) === 'arn:')) {
      getInput = false;
      uri = answer;
      changeApi = true;
    } else if (!answer.length) {
      getInput = false;
      changeApi = false;
    } else {
      logger.warn('Invalid URI. Please try again.');
    }
  }

  const tasks = new Listr([
    {
      title: 'Check config file',
      task: ctx => {
        ctx.configFile = 'kodi.config';

        if (!fs.existsSync(ctx.configFile)) {
          throw new Error("Config file not found. Please run 'lexigram init-config' first.");
        }
      }
    },
    {
      title: 'Validate config file',
      task: ctx => {
        ctx.config = new ParseIni();

        const file = fs.readFileSync(ctx.configFile, 'utf8');
        ctx.config.parse(file);

        if (!ctx.config.verifyData()) {
          throw new Error('Configuration file is not valid. Please update it with the correct information.');
        }
      }
    },
    {
      title: 'Check skill directory',
      task: ctx => {
        ctx.dir = args.skill;

        if (!fs.existsSync(ctx.dir)) {
          throw new Error(`Skill directory not found. Please run 'lexigram init-skill ${ctx.dir}' first.`);
        }
      }
    },
    {
      title: 'Remove old repo code',
      skip: ctx => options.sourceDir && options.sourceDir.length,
      task: ctx => {
        fse.removeSync(`${ctx.dir}/source/repo`);
        fse.ensureDir(`${ctx.dir}/source/repo`);
      }
    },
    {
      title: 'Download latest source code',
      skip: ctx => options.sourceDir && options.sourceDir.length,
      task: async ctx => {
        fse.removeSync(`${ctx.dir}-github.zip`);

        let releaseUrl;

        try {
          const url = ctx.dir === 'kanzi' ?
            'https://api.github.com/repos/m0ngr31/kanzi/releases/latest' :
            'https://api.github.com/repos/m0ngr31/koko/releases/latest';

          const request = await axios.request({
            url
          });

          releaseUrl = request.data.zipball_url;

          const releaseRequest = await axios.request({
            url: releaseUrl,
            responseType: 'arraybuffer'
          });

          fs.writeFileSync(`${ctx.dir}-github.zip`, releaseRequest.data);
        } catch (e) {
          ErrorLogger('Could not download latest release.');
          throw new Error('Could not download latest release. Please try again.');
        }
      }
    },
    {
      title: 'Extract source code',
      skip: ctx => options.sourceDir && options.sourceDir.length,
      task: async ctx => {
        try {
          await promisePipe(
            fs.createReadStream(`${ctx.dir}-github.zip`),
            unzip.Extract({ path: `${ctx.dir}/source/repo` })
          );
        } catch (e) {
          ErrorLogger('Could not extract source code.');
          throw new Error('Could not extract source code. Please try again.');
        }
      }
    },
    {
      title: 'Extract source code - Part 2',
      skip: ctx => options.sourceDir && options.sourceDir.length,
      task: async ctx => {
        const readDir = fs.readdirSync(`${ctx.dir}/source/repo/`);
        const githubFolder = readDir[0];

        const readGithubFolder = fs.readdirSync(`${ctx.dir}/source/repo/${githubFolder}/`);

        readGithubFolder.forEach(fileOrDir => {
          fse.moveSync(`${ctx.dir}/source/repo/${githubFolder}/${fileOrDir}`, `${ctx.dir}/source/repo/${fileOrDir}`);
        });

        fse.removeSync(`${ctx.dir}/source/repo/${githubFolder}`);
        fse.removeSync(`${ctx.dir}-github.zip`);
      }
    },
    {
      title: 'Update skill data',
      task: ctx => {
        const skillJson = args.skill === 'kanzi' ? 'kanzi-skill.json' : 'koko-skill.json';
        const skillConfig = fse.readJsonSync(`${__dirname}/../${skillJson}`);

        if (changeApi) {
          delete skillConfig.manifest.apis;
          skillConfig.manifest.apis = {
            custom: {
              endpoint: {
                uri
              }
            }
          };

          if (args.skill === 'koko') {
            skillConfig.manifest.apis.custom.interfaces = [
              {
                "type": "AUDIO_PLAYER"
              }
            ]
          }

          if (uri.substring(0, 8) === 'https://') {
            skillConfig.manifest.apis.custom.endpoint.sslCertificateType = 'Wildcard';
          }
        }

        fse.removeSync(`${ctx.dir}/skill.json`);
        fse.writeJsonSync(`${ctx.dir}/skill.json`, skillConfig, jsonOptions);
      }
    },
    {
      title: 'Update slot values',
      task: async (ctx, task) => {
        task.output = 'Generating slot data from Kodi.';

        const isKanzi = args.skill === 'kanzi';

        const origObj :any = {
          interactionModel: {
            languageModel: {
              invocationName,
              types: await getSlots(ctx.dir, ctx.config),
              intents: []
            }
          }
        };

        task.output = 'Creating intent model.';

        const englishObj = _.cloneDeep(origObj);
        const germanObj = _.cloneDeep(origObj);
        const frenchObj = _.cloneDeep(origObj);
        const spanishObj = _.cloneDeep(origObj);

        const fullDir = options.sourceDir && options.sourceDir.length ? options.sourceDir : null;

        germanObj.interactionModel.languageModel.intents = getIntents(ctx.dir, 'de', fullDir);
        englishObj.interactionModel.languageModel.intents = getIntents(ctx.dir, 'en', fullDir);

        if (isKanzi) {
          frenchObj.interactionModel.languageModel.intents = getIntents(ctx.dir, 'fr', fullDir);
          spanishObj.interactionModel.languageModel.intents = getIntents(ctx.dir, 'es', fullDir);
        }

        fse.removeSync(`${ctx.dir}/models/en-US.json`);
        fse.removeSync(`${ctx.dir}/models/en-GB.json`);
        fse.removeSync(`${ctx.dir}/models/en-CA.json`);
        fse.removeSync(`${ctx.dir}/models/en-IN.json`);
        fse.removeSync(`${ctx.dir}/models/en-AU.json`);
        fse.removeSync(`${ctx.dir}/models/de-DE.json`);
        fse.removeSync(`${ctx.dir}/models/fr-FR.json`);
        fse.removeSync(`${ctx.dir}/models/fr-CA.json`);
        fse.removeSync(`${ctx.dir}/models/es-ES.json`);
        fse.removeSync(`${ctx.dir}/models/es-MX.json`);

        fse.writeJsonSync(`${ctx.dir}/models/en-US.json`, englishObj, jsonOptions);
        fse.writeJsonSync(`${ctx.dir}/models/en-GB.json`, englishObj, jsonOptions);
        fse.writeJsonSync(`${ctx.dir}/models/en-CA.json`, englishObj, jsonOptions);
        fse.writeJsonSync(`${ctx.dir}/models/en-IN.json`, englishObj, jsonOptions);
        fse.writeJsonSync(`${ctx.dir}/models/en-AU.json`, englishObj, jsonOptions);
        fse.writeJsonSync(`${ctx.dir}/models/de-DE.json`, germanObj, jsonOptions);

        if (isKanzi) {
          fse.writeJsonSync(`${ctx.dir}/models/fr-FR.json`, frenchObj, jsonOptions);
          fse.writeJsonSync(`${ctx.dir}/models/fr-CA.json`, frenchObj, jsonOptions);
          fse.writeJsonSync(`${ctx.dir}/models/es-ES.json`, spanishObj, jsonOptions);
          fse.writeJsonSync(`${ctx.dir}/models/es-MX.json`, spanishObj, jsonOptions);
        }
      }
    },
    {
      title: 'Deploy skill',
      task: async (ctx, task) => {
        try {
          task.output = 'Deploying skill information.';
          await execa(askPath, ['deploy', '-t', 'skill'], { cwd: ctx.dir, timeout: 300000 });
          task.output = 'Deploying skill slot data and intents.';
          await execa(askPath, ['deploy', '-t', 'model'], { cwd: ctx.dir, timeout: 600000 });
        } catch (e) {
          ErrorLogger(e);
          throw new Error('Error deploying. Please try again');
        }
      }
    }
  ]);

  tasks.run().catch(err => {});
};

export const generateZip = (args, options, logger) => {
  const tasks = new Listr([
    {
      title: 'Check config file',
      task: ctx => {
        ctx.configFile = 'kodi.config';

        if (!fs.existsSync(ctx.configFile)) {
          throw new Error("Config file not found. Please run 'lexigram init-config' first.");
        }
      }
    },
    {
      title: 'Validate config file',
      task: ctx => {
        ctx.config = new ParseIni();

        const file = fs.readFileSync(ctx.configFile, 'utf8');
        ctx.config.parse(file);

        if (!ctx.config.verifyData()) {
          throw new Error('Configuration file is not valid. Please update it with the correct information.');
        }
      }
    },
    {
      title: 'Check skill directory',
      task: ctx => {
        ctx.dir = args.skill;

        if (!fs.existsSync(ctx.dir)) {
          throw new Error(`Skill directory not found. Please run 'lexigram init-skill ${ctx.dir}' first.`);
        }
      }
    },
    {
      title: 'Remove old Lambda function code',
      task: ctx => {
        fse.removeSync(`${ctx.dir}/source/skill`);
        fse.ensureDir(`${ctx.dir}/source/skill`);
      }
    },
    {
      title: 'Download latest source code',
      task: async ctx => {
        fse.removeSync(`${ctx.dir}-release.zip`);

        let releaseUrl;

        try {
          const url = ctx.dir === 'kanzi' ?
            'https://api.github.com/repos/m0ngr31/kanzi/releases/latest' :
            'https://api.github.com/repos/m0ngr31/koko/releases/latest';

          const request = await axios.request({
            url
          });

          releaseUrl = request.data.assets[0].browser_download_url;

          const releaseRequest = await axios.request({
            url: releaseUrl,
            responseType: 'arraybuffer'
          });

          fs.writeFileSync(`${ctx.dir}-release.zip`, releaseRequest.data);
        } catch (e) {
          ErrorLogger('Could not download latest release.');
          throw new Error('Could not download latest release. Please try again.');
        }
      }
    },
    {
      title: 'Extract source code',
      task: async ctx => {
        try {
          await promisePipe(
            fs.createReadStream(`${ctx.dir}-release.zip`),
            unzip.Extract({ path: `${ctx.dir}/source/skill` })
          );

          fse.removeSync(`${ctx.dir}-release.zip`);
        } catch (e) {
          ErrorLogger('Could not extract source code.');
          throw new Error('Could not extract source code. Please try again.');
        }
      }
    },
    {
      title: 'Copy config file',
      task: ctx => {
        try {
          fse.copySync(ctx.configFile, `${ctx.dir}/source/skill/${ctx.configFile}`);
        } catch (e) {
          ErrorLogger('Could not copy config file.');
          throw new Error('Could not copy config file. Please try again.');
        }
      }
    },
    {
      title: 'Create deployment zip file',
      task: async ctx => {
        fse.removeSync(`${ctx.dir}-lambda-upload.zip`);

        const archive = archiver(`${ctx.dir}-lambda-upload.zip`, {
          zlib: { level: 9 }
        });

        archive.directory(`${ctx.dir}/source/skill`, false);
        await archive.finalize();
      }
    }
  ]);

  tasks.run()
  .then(() => {
    logger.info(`\nFile is ready. Please upload '${args.skill}-lambda-upload.zip' to AWS Lambda.`)
  })
  .catch(err => {});
};
