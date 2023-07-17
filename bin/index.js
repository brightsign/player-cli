#!/usr/bin/env node

const yargs = require('yargs');
const fs = require('fs');
const formData = require('form-data');
const currentPath = require('path'); // for absolute path
const players = require('./players.json');
const axios = require('axios');
const AxiosDigestAuth = require('@mhoc/axios-digest-auth').default;

let axiosDigestAuthInst;

// set up CLI
//const options = yargs

yargs.scriptName('bsc')
yargs.usage('Usage: $0 <command> [options]')
yargs.help()


yargs.command('getDI [playerName]', 'Get Device Info', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, getDeviceInfo);

yargs.command('addPlayer [playerName] [ipAddress] [password]', 'Add a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player2',
    describe: 'Player name'
  });
  yargs.positional('ipAddress', {
    type: 'string',
    default: '',
    describe: 'player IP address'
  });
  yargs.positional('password', {
    type: 'string',
    default: '',
    describe: 'player password'
  });
}, addPlayerFunc);

yargs.command('rmPlayer [playerName]', 'remove a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player2',
    describe: 'Player name'
  });
}, removePlayerFunc);

yargs.command('push [playerName] [FileDirectory] [location]', 'Push files to a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
  yargs.positional('FileDirectory', {
    type: 'string',
    default: '',
    describe: 'File or directory to push'
  });
  yargs.positional('location', {
    type: 'string',
    default: '',
    describe: 'Location to push to (on player)'
  });
}, pushFunc);

// set up commands

async function pushFunc(argv) {

  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'PUT',
    url: 'http://' + playerIP + '/api/v1/files/sd/' + argv.location,
  };

  // check if file or directory
  let path = argv.FileDirectory;
  let absPath = currentPath.resolve(path);
  let isFile;

  isFile = await checkDir(path);

  if (isFile) {
    // if file, push file
    console.log('pushing file: ' + absPath);

    let fileInput = fs.statSync(absPath);
    let fileSizeInBytes = fileInput.size;
    let fileStream = fs.createReadStream(absPath);

    let form = new formData();
    form.append('field-name', fileStream, {knownLength: fileSizeInBytes});
    requestOptions.data = form;

    try {
      let response = await requestAxios(requestOptions, playerPW);
      console.log(response);
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  } else if (!isFile){
    console.log('pushing directory');
    // if directory, push directory
    fs.readdir(path, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }

      files.forEach((file, index) => async () =>{
        let filePath = absPath + '/' + file;

        console.log(filePath);

        let fileInput = fs.statSync(filePath);
        let fileSizeInBytes = fileInput.size;
        let fileStream = fs.createReadStream(filePath);

        let form = new formData();
        form.append('field-name', fileStream, {knownLength: fileSizeInBytes});
        requestOptions.data = form;

        try {
          let response = await requestAxios(requestOptions, playerPW);
          console.log(response);
        } catch (err) {
          console.log(JSON.stringify(err));
        }
      });
    });
  }
}

async function checkDir(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
        return;
      }
      if (stats.isFile()) {
        //console.log('file');
        resolve(true);
      } else if (stats.isDirectory()) {
        //console.log('directory');
        resolve(false);
      } else {
        reject(new Error('Provided path is neither file nor directory'));
        return;
      }
    });
  });
}

function addPlayerFunc(argv) {
  fs.readFile('./players.json', 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading file: ', error);
      return;
    }

    // parse json object
    let JSONdata = JSON.parse(data);

    // add new player
    JSONdata[argv.playerName] = {
      ipAddress: argv.ipAddress,
      password: argv.password
    }

    // write new json object to file
    let modifiedData = JSON.stringify(JSONdata, null, 2);
    fs.writeFile('./players.json', modifiedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing file: ', error);
        return;
      }
      console.log('Player added successfully');
    });
  });
}

function removePlayerFunc(argv) {
  fs.readFile('./players.json', 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading file: ', error);
      return;
    }

    // parse json object
    let JSONdata = JSON.parse(data);

    // remove player
    delete JSONdata[argv.playerName];

    // write new json object to file
    let modifiedData = JSON.stringify(JSONdata, null, 2);
    fs.writeFile('./players.json', modifiedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing file: ', error);
        return;
      }
      console.log('Player removed successfully');
    });
  });
}

async function getDeviceInfo(argv) {

  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerIP + '/api/v1/info',
  };
  try {
    let response = await requestAxios(requestOptions, playerPW);
    console.log(response);
  } catch (err) {
    console.log(JSON.stringify(err));
  }
  

}

async function prepareAxios(pass) {
  if (axiosDigestAuthInst == null || axiosDigestAuthInst === undefined) {
    const options = {
        username: 'admin'
    };
    axiosDigestAuthInst = new AxiosDigestAuth(options);
  }
}

async function requestAxios(requestOptions, password) {

  let response;

  prepareAxios(password);

  response = await axiosDigestAuthInst.request(requestOptions);
  //console.log(JSON.stringify(response.data));


  return response.data?.data.result || response.data.result;
}



// parse the command line arguments
yargs.argv;