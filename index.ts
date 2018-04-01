#!/usr/bin/env node

import * as caporal from 'caporal';

import {loginOrSwitch, downloadConfig, initSkill, updateOrDeploySkill, generateZip} from './actions';

declare const process : {
  argv: any,
}

const program = caporal as any;

(program as Caporal)
  .version('1.0.0')
  .command('login', 'Authenticate with Amazon.')
  .help('Login to or switch to a different Amazon account.')
  .action(loginOrSwitch)
  .command('init-config', 'Generates a config file in the current directory for you to put in your server information.')
  .help(`Downloads a file called kodi.config into the current directory.\n\n     This file contains all the information the skill needs to work.`)
  .action(downloadConfig)
  .command('init-skill', 'Configure skill information for either Kanzi or Koko.')
  .argument('[skill]', 'Skill to configure', /kanzi|koko/, 'kanzi')
  .help('Select either kanzi (for Kodi remote), or koko (for streaming music from Kodi).')
  .action(initSkill)
  .command('deploy', 'Reads your current config file to generate the slot data and upload the skill data to Amazon.')
  .argument('[skill]', 'Skill to deploy', /kanzi|koko/, 'kanzi')
  .help('Verifies kodi.config is valid, then generates the skill data needed, and uploads it to Amazon.')
  .action(updateOrDeploySkill)
  .command('generate-function', 'Generates a zip file you can upload directly to AWS Lambda.')
  .argument('[skill]', 'Skill to generate zip for.', /kanzi|koko/, 'kanzi')
  .help('Verifies kodi.config is valid, then generates a zip file you can upload directly to AWS Lambda.')
  .action(generateZip);

program.parse(process.argv);
