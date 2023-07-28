#!/usr/bin/env node

// The version of code stored in this branch explicitly assumes that the player 
// does NOT have a lDWS password set. Using this CLI with a player that has a
// lDWS password set will NOT WORK

// refer to branch 'pe-28-updated' for a version of code that works with players
// that have a lDWS password set

const yargs = require('yargs');
const fs = require('fs');
const fsp = require('fs').promises;
const formData = require('form-data');
let currentPath = require('path'); // for absolute path
const players = require('./players.json');
const axios = require('axios');
//const { get } = require('http');
const AxiosDigestAuth = require('@mhoc/axios-digest-auth').default;
const util = require('util');
const createReadStreamPromise = util.promisify(fs.createReadStream);
const fetch = require('node-fetch');


// set up commands
yargs.scriptName('bsc')
yargs.usage('Built-in command usage: $0 <command> [options]')
yargs.help()
yargs.alias('h', 'help')

// give examples of raw usage
yargs.usage('Raw usage: bsc raw -i <targetIp> -p [targetPassword] -m <reqMethod> -r <reqRoute> -a [rawResponse]');
yargs.usage('');
yargs.usage('       Raw Request Examples:');
yargs.usage('       bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="info"');
yargs.usage('       bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="files/sd"');

// Get Device Info
yargs.command('getDI <playerName>', 'Get Device Info', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, getDeviceInfo);

// Add a player to your configuration
yargs.command('addPlayer <playerName> <ipAddress> [username] [password]', 'Add a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player2',
    describe: 'Player name'
  });
  yargs.positional('ipAddress', {
    type: 'string',
    describe: 'player IP address'
  });
  yargs.positional('username', {
    type: 'string',
    default: 'admin',
    describe: 'player username'
  });
  yargs.positional('password', {
    type: 'string',
    describe: 'player password'
  });
}, addPlayerFunc);

// Remove a player from your configuration
yargs.command('rmPlayer <playerName>', 'remove a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player2',
    describe: 'Player name'
  });
}, removePlayerFunc);

// Push a file or files to a player (file or directory)
yargs.command('put <playerName> <FileDirectory> [location]', 'Put files on a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
  yargs.positional('FileDirectory', {
    type: 'string',
    default: '',
    describe: 'File or directory to put'
  });
  yargs.positional('location', {
    type: 'string',
    default: '',
    describe: 'Location to push to (on player)'
  });
}, pushFunc);

// Reboot a player
yargs.command('reboot <playerName>', 'Reboot a player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
    });
}, rebootFunc);

// Check if player has a lDWS password
yargs.command('checkPW <playerName>', 'Check if player has a lDWS password', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, checkPWFunc);

// Change player lDWS password
yargs.command('changePW <playerName> [newPassword]', 'Change player lDWS password, enter "" for no password', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
  yargs.positional('newPassword', {
    type: 'string',
    default: '',
    describe: 'New password, surround in quotes'
  });
}, changePWFunc);

// Take a screenshot
yargs.command('screenshot <playerName>', 'Take a screenshot', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, screenshotFunc);

// Get logs
/*
yargs.command('getLogs <playerName>', 'Get logs', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, getLogsFunc);
*/
// Edit Registry


// 

yargs.command('raw', 'allow for raw input', (yargs) => {
  yargs.option('i', { alias: 'targetIp', describe: 'IP Address of Target Player', type: 'string', demandOption: true });
  yargs.option('p', { alias: 'targetPassword', describe: 'Password of Target Player', type: 'string', demandOption: false });
  yargs.option('m', { alias: 'reqMethod', describe: 'Request method type', type: 'string', demandOption: true });
  yargs.option('r', { alias: 'reqRoutes', describe: 'Request url route', type: 'string', demandOption: true });
  yargs.option('a', { alias: 'rawResponse', describe: 'Raw HTTP REST Response', type: 'boolean', demandOption: false });
  yargs.option('f', { alias: 'file', describe: 'Path to file to push if pushing file', type: 'string', demandOption: false })
}, handleRawRequestFunc);

// Handle commands
async function handleRawRequestFunc(argv) {
  console.log('Handling Raw Request');
  let ipAddressRaw = argv.i;
  let targetPasswordRaw = argv.p;
  let requestMethodRaw = argv.m;
  let requestRouteRaw = argv.r;
  let rawResponseRaw = argv.a;
  let fileRaw = argv.f;

  let requestOptions = {
    method: requestMethodRaw,
    url: 'http://' + ipAddressRaw + '/api/v1/' + requestRouteRaw,
  };
  
  if (fileRaw != null) {
    let form = new formData();
    let fileToUpload = fs.createReadStream(fileRaw);
    console.log('Uploading file: ', fileRaw);
    form.append("file", fileToUpload, {filename: fileRaw});
    requestOptions.body = form;
  }

  let response = await requestFetch(requestOptions);
  
  if(rawResponseRaw) {
    console.log(response);
  } else {
    console.log(response.data.result);
  }
}

async function getLogsFunc(argv) {
  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;



}

async function pushFunc(argv) {

  let playerUser = players[argv.playerName].username;
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
  //console.log(isFile);

  let files = [];
  if(!isFile) {
    console.log('getting files...');
    try {
      files = await getFiles(path);
    }
    catch (err) {
      console.log('Error getting files from directory!');
      console.log(err);
    }
  }

  if (isFile) {
    // if file, push file
    console.log('pushing file: ' + absPath);
    //console.log('1');
    //let fileStream = fs.createReadStream(path);
    //let fileStream = await createReadStreamFunc(path);
    //console.log(fileStream);
    //console.log('2');

    let form = new formData();
    //form.append('file', fileStream);

    //let fileToUpload = await fsp.readFile(path);
    let fileToUpload = fs.createReadStream(path);
    //console.log(fileToUpload);
    form.append("file", fileToUpload, {filename: path});
    requestOptions.body = form;
    //requestOptions.headers = form.getHeaders();
    
    

    //console.log('3');
    //console.log(requestOptions); 

    try {
      let response = await requestFetch(requestOptions);
      //console.log(response);
      console.log(response.data.result.results + ' uploaded: ' + response.data.result.success);
      //console.log(response.data.result.results)
    } catch (err) {
      console.log(err);
    }
  } else if (!isFile){
    
    // if directory, push directory
    //console.log('pushing directory');
    
    for (i = 0; i < files.length; i++) {
      
      //let fileStream = fs.createReadStream(files[i]);
      let fileToUpload = fs.createReadStream(files[i]);

      let form = new formData();
      form.append('file', fileToUpload, {filename: files[i]});
      requestOptions.body = form;

      console.log('Pushing ' + files[i]);

      try {
        let response = await requestFetch(requestOptions);
        console.log(response.data.result.results + ' uploaded: ' + response.data.result.success);
      } catch (err) {
        console.log(err);
      }
    }
  }
}

async function changePWFunc(argv) {

  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'PUT',
    url: 'http://' + playerIP + '/api/v1/control/dws-password',
    data: {
      password: argv.newPassword,
      previous_password: playerPW
    }
  };

  try {
    let response = await requestFetch(requestOptions);
    console.log('Password changed (player side): ' + response.data.result.success);
    //console.log(response);

    // update password in players.json
    fs.readFile('./bin/players.json', 'utf8', (error, data) => {
      if (error) {
        console.error('Error reading file: ', error);
        return;
      }
      // parse json object
      let JSONdata = JSON.parse(data);

      // add new player
      JSONdata[argv.playerName] = {
        ipAddress: playerIP,
        password: argv.newPassword
      }

      // write new json object to file
      let modifiedData = JSON.stringify(JSONdata, null, 2);
      fs.writeFile('./bin/players.json', modifiedData, 'utf8', (error) => {
        if (error) {
          console.error('Error writing file: ', error);
          return;
        }
        console.log('Password changed (locally): successful');
      });
    });

  } catch (err) {
    console.log(err);
  }

  

}

async function checkPWFunc(argv) {
  
  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerIP + '/api/v1/control/dws-password',
  };

  try {
    let response = await requestFetch(requestOptions);
    //console.log(response);
    //console.log(response.data.result.password);
    //console.log('Player has password set: ' + response.data.result.password.);
    console.log('Password is blank: ' + response.data.result.password.isBlank);
  } catch (err) {
    console.log(err);
  }
}

async function rebootFunc(argv) {

  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'PUT',
    url: 'http://' + playerIP + '/api/v1/control/reboot',
  };

  try {
    let response = await requestFetch(requestOptions);
    //console.log(response);
    console.log('Player rebooted: ' + response.data.result.success);
  } catch (err) {
    console.log(err);
  }

}

function addPlayerFunc(argv) {
  fs.readFile('./bin/players.json', 'utf8', (error, data) => {
    if (error) {
      console.error('Error reading file: ', error);
      return;
    }

    // parse json object
    let JSONdata = JSON.parse(data);

    // add new player
    JSONdata[argv.playerName] = {
      ipAddress: argv.ipAddress,
      password: argv.password,
      username: argv.username
    }

    // write new json object to file
    let modifiedData = JSON.stringify(JSONdata, null, 2);
    fs.writeFile('./bin/players.json', modifiedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing file: ', error);
        return;
      }
      console.log('Player added successfully');
    });
  });
}

function removePlayerFunc(argv) {
  fs.readFile('./bin/players.json', 'utf8', (error, data) => {
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
    fs.writeFile('./bin/players.json', modifiedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing file: ', error);
        return;
      }
      console.log('Player removed successfully');
    });
  });
}

async function getDeviceInfo(argv) {

  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerIP + '/api/v1/info',
  };
  try {
    let response = await requestFetch(requestOptions);
    console.log(response);
  } catch (err) {
    console.log(err);
  }
  

}

async function screenshotFunc(argv) {

  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let requestOptions = {
    method: 'POST',
    url: 'http://' + playerIP + '/api/v1/snapshot',
  };

  try {
    let response = await requestFetch(requestOptions);
    //console.log(response);
    console.log('Screenshot taken! Location: ' + response.data.result.filename);
  } catch (err) {
    console.log(err);
  }


}

// General functions
async function requestFetch(requestOptions) {
  try {
    let response = await fetch(requestOptions.url, requestOptions);
    let resData = await response.json();
    return resData;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function checkDir(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      }
      if (stats.isFile()) {
        //console.log('file');
        resolve(true);
      } else if (stats.isDirectory()) {
        //console.log('directory');
        resolve(false);
      } else {
        reject(new Error('Provided path is neither file nor directory'));
      }
    });
  });
}

async function getFiles(path) {

  try {
    let filesArr = [];
    let files = await fsp.readdir(path);

    let lastChar = path[path.length - 1];
    if (lastChar != '/') {
      filesArr = files.map(file => `${path}/${file}`);
    } else {
      filesArr = files.map(file => `${path}${file}`);
    }
    return filesArr;
  } catch (err) {
    console.error(err);
    throw err;
  }

}

function createReadStreamFunc(path) {
  console.log('createReadStreamFunc');
  return new Promise((resolve, reject) => {
    //let fileStream = createReadStreamPromise(path);
    console.log('in promise');
    let fileStream = fs.createReadStream(path);

    fileStream.on('open', () => {
      console.log('fileStream open');
    });

    fileStream.on('end', () => {
      resolve(fileStream);
      console.log('fileStream end');
    });

    fileStream.on('error', (err) => {
      reject(err);
    });

  });
} 


// parse the command line arguments
//yargs.parse();
yargs.argv;