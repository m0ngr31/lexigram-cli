#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var caporal = require("caporal");
var actions_1 = require("./actions");
var program = caporal;
program
    .version('1.0.9')
    .name('Lexigram-CLI')
    .bin('lexigram')
    .command('login', 'Authenticate with Amazon.')
    .option('--no-browser <noBrowser>', 'Login without browser', program.BOOL, false)
    .help('Login to or switch to a different Amazon account.')
    .action(actions_1.loginOrSwitch)
    .command('init-config', 'Generates a config file in the current directory for you to put in your server information.')
    .help("Downloads a file called kodi.config into the current directory.\n\n     This file contains all the information the skill needs to work.")
    .action(actions_1.downloadConfig)
    .command('init-skill', 'Configure skill information for either Kanzi or Koko.')
    .argument('[skill]', 'Skill to configure', /kanzi|koko/, 'kanzi')
    .help('Select either kanzi (for Kodi remote), or koko (for streaming music from Kodi).')
    .action(actions_1.initSkill)
    .command('deploy', 'Reads your current config file to generate the slot data and upload the skill data to Amazon.')
    .argument('[skill]', 'Skill to deploy', /kanzi|koko/, 'kanzi')
    .help('Verifies kodi.config is valid, then generates the skill data needed, and uploads it to Amazon.')
    .action(actions_1.updateOrDeploySkill)
    .command('generate-function', 'Generates a zip file you can upload directly to AWS Lambda.')
    .argument('[skill]', 'Skill to generate zip for.', /kanzi|koko/, 'kanzi')
    .help('Verifies kodi.config is valid, then generates a zip file you can upload directly to AWS Lambda.')
    .action(actions_1.generateZip);
program.parse(process.argv);
