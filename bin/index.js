#!/usr/bin/env node
const yargs = require('yargs');
const handlers = require('./handlerFunctions.js');
const positionals = require('./positionalFunctions.js');

// set up commands
yargs.scriptName('bsc');
yargs.usage('Command usage: bsc <command> [options]');
yargs.help();
yargs.alias('h', 'help');


// Get Device Info
yargs.command('getdi <playerName>', 'Get Device Info', (yargs) => {positionals.getDiPositional(yargs)}, (argv) => {handlers.getDeviceInfo(argv)});

// Add a player to your configuration
yargs.command('addplayer <playerName> <ipAddress> [username] [password] [storage]', 'Add a player', (yargs) => {positionals.addPlayerPositional(yargs)}, (argv) => {handlers.addPlayer(argv)});

// Remove a player from your configuration
yargs.command('rmplayer <playerName>', 'remove a player', (yargs) => {positionals.rmPlayerPositional(yargs)}, (argv) => {handlers.removePlayer(argv)});

// Update a player in your configuration
yargs.command('editplayer <playerName>', 'Update a player', (yargs) => {positionals.editPlayerPositional(yargs)}, (argv) => {handlers.editPlayer(argv)});

// List all players in your configuration
yargs.command('listplayers', 'List all players', (yargs) => {}, handlers.listPlayers);

// Reboot a player
yargs.command('reboot <playerName>', 'Reboot a player', (yargs) => {positionals.rebootPositional(yargs)}, (argv) => {handlers.reboot(argv)});

// Handle commands

// Check if player has a lDWS password
yargs.command('checkpw <playerName>', 'Check if player has a lDWS password', (yargs) => {positionals.checkPWPositional(yargs)}, (argv) => {handlers.checkPW(argv)});

// Change player lDWS password
yargs.command('setpw <playerName> [newPassword]', 'Change player lDWS password, enter "" for no password', (yargs) => {positionals.changePWPositional(yargs)}, (argv) => {handlers.changePW(argv)});

// Take a screenshot
yargs.command('screenshot <playerName>', 'Take a screenshot', (yargs) => {positionals.screenshotPositional(yargs)}, (argv) => {handlers.screenshot(argv)});

// Get logs
yargs.command('getlogs <playerName>', 'Get logs', (yargs) => {positionals.getLogsPositional(yargs)}, (argv) => {handlers.getLogs(argv)});

// Raw command
yargs.command('raw', 'allow for raw input', (yargs) => {positionals.rawPositional(yargs)}, (argv) => {handlers.handleRawRequest(argv)});

// delete file
yargs.command('delfile <playerName> <file>', 'Delete a file', (yargs) => {positionals.delFilePositional(yargs)}, (argv) => {handlers.deleteFile(argv)});

// Push a file or files to a player (file or directory)
yargs.command('putfile <playerName> <FileDirectory> [location]', 'Put files on a player', (yargs) => {positionals.putFilePositional(yargs)}, (argv) => {handlers.push(argv)});

// getFiles
yargs.command('getfiles <playerName> [path]', 'Get files on player', (yargs) => {positionals.getFilePositional(yargs)}, (argv) => {handlers.getFilesCommand(argv)});

// downloadFile
yargs.command('downloadfile <playerName> [path]', 'Download file on player', (yargs) => {positionals.getFilePositional(yargs)}, (argv) => {handlers.downloadFileCommand(argv)});

// getTime 
yargs.command('gettime <playerName>', 'Get player time', (yargs) => {positionals.getTimePositional(yargs)}, (argv) => {handlers.getTime(argv)});

// set time
yargs.command('settime <playerName> <timezone> <time> <date> [applyTimezone]', 'Set player time', (yargs) => {positionals.setTimePositional(yargs)}, (argv) => {handlers.setTime(argv)});

// check DWS
yargs.command('checkdws <playerName>', 'Check if player has DWS enabled', (yargs) => {positionals.checkDWSPositional(yargs)}, (argv) => {handlers.checkDWS(argv)});

// set DWS
yargs.command('setdws <playerName> <onOff>', 'set DWS on/off', (yargs) => {positionals.setDWSPositional(yargs)}, (argv) => {handlers.setDWS(argv)});

// get registry
yargs.command('getreg <playerName> [section] [key]', 'Get registry values', (yargs) => {positionals.getRegPositional(yargs)}, (argv) => {handlers.getReg(argv)});

// edit registry
yargs.command('setreg <playerName> <section> <key> <value>', 'Edit registry values', (yargs) => {positionals.setRegPositional(yargs)}, (argv) => {handlers.editReg(argv)});

// set power save
yargs.command('setpowersave <playerName> <enabled> <connector> <device>', 'Set the video connector power save', (yargs) => {positionals.setPowerSavePositional(yargs)}, (argv) => {handlers.setPowerSave(argv)});

// get power save
yargs.command('getpowersave <playerName> [connector] [device]', 'Get the video connector power save', (yargs) => {positionals.getPowerSavePositional(yargs)}, (argv) => {handlers.getPowerSave(argv)});

// Factory reset
yargs.command('facreset <playerName>', 'Factory reset player', (yargs) => {positionals.facResetPositional(yargs)}, (argv) => {handlers.factoryReset(argv)});

// Send CEC command
yargs.command('sendcec <playerName> <command>', 'Send CEC command. Note that this command will only work on players running the newest version of supervisor', (yargs) => {positionals.sendCecPositional(yargs)}, (argv) => {handlers.sendCec(argv)});

// define yargs options
yargs.option('verbose', {
  alias: 'v',
  describe: 'Run with verbose logging',
  type: 'boolean',
  default: false,
});

yargs.option('rawdata', {
  alias: 'd',
  describe: 'Output raw json response data',
  type: 'boolean',
  default: false,
});

// Main function
function main() {
  let exists = handlers.checkConfigExists();
  if (!exists) {
    handlers.generatePlayersJson();
  } else {
    
    yargs.recommendCommands(); // recommend commands if given command is not found
    yargs.demandCommand(1, '')
      .help(); // show help menu if no command is given
      
    handlers.helpChecker();
    yargs.argv;
  }
}

// Run main function
main();




