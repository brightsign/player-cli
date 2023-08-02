#!/usr/bin/env node

// The version of code stored in this branch explicitly assumes that the player 
// does NOT have a lDWS password set. Using this CLI with a player that has a
// lDWS password set will NOT WORK


const yargs = require('yargs');
const fs = require('fs');
const fsp = fs.promises;
const formData = require('form-data');
let currentPath = require('path'); // for absolute path
//const players = require('./players.json');
const fetch = require('node-fetch');
const os = require('os');
const readline = require('readline');
const fetchDigest = require('digest-fetch');

// Create player object on download
const CONFIG_FILE_PATH = currentPath.join(os.homedir(), '.bsc', 'players.json');
const players = require(CONFIG_FILE_PATH);

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
yargs.command('setPW <playerName> [newPassword]', 'Change player lDWS password, enter "" for no password', (yargs) => {
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
yargs.command('getLogs <playerName>', 'Get logs', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, getLogsFunc);

// Edit Registry

// Raw command
yargs.command('raw', 'allow for raw input', (yargs) => {
  yargs.option('i', { alias: 'targetIp', describe: 'IP Address of Target Player', type: 'string', demandOption: true });
  yargs.option('p', { alias: 'targetPassword', describe: 'Password of Target Player', type: 'string', demandOption: false });
  yargs.option('m', { alias: 'reqMethod', describe: 'Request method type', type: 'string', demandOption: true });
  yargs.option('r', { alias: 'reqRoutes', describe: 'Request url route', type: 'string', demandOption: true });
  yargs.option('a', { alias: 'rawResponse', describe: 'Raw HTTP REST Response', type: 'boolean', demandOption: false });
  yargs.option('f', { alias: 'file', describe: 'Path to file to push if pushing file', type: 'string', demandOption: false })
}, handleRawRequestFunc);

// delete file
yargs.command('delFile <playerName> <file>', 'Delete a file', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
  yargs.positional('file', {
    type: 'string',
    default: '',
    describe: 'Path to file on player'
  });
}, deleteFileFunc);

// getTime 
yargs.command('getTime <playerName>', 'Get player time', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, getTimeFunc);

// getFiles
yargs.command('getFiles <playerName> [path]', 'Get files on player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
  yargs.positional('path', {
    type: 'string',
    default: '',
    describe: 'Path to get files from'
  });
}, getFilesFunc);

// check DWS
yargs.command('checkDWS <playerName>', 'Check if player has a DWS password', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'Player name'
  });
}, checkDWSFunc);

// get registry
yargs.command('getReg <playerName> [section] [key]', 'Get registry values', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'player name'
  });
  yargs.positional('section', {
    type: 'string',
    default: '',
    describe: 'Registry section'
  });
  yargs.positional('key', {
    type: 'string',
    default: '',
    describe: 'Registry key'
  });
},getRegFunc);

// Factory reset
yargs.command('facReset <playerName>', 'Factory reset player', (yargs) => {
  yargs.positional('playerName', {
    type: 'string',
    default: 'player1',
    describe: 'player name'
  });
}, factoryResetFunc);


// Handle commands
async function factoryResetFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let requestOptions = {
    method: 'PUT',
    url: 'http://' + playerData[1] + '/api/v1/control/reboot',
  }
  requestOptions.body = { factory_reset: true };

  // send request
  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(response);
  } catch (err) {
    console.log(err);
  }
}

async function getRegFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
  let section = argv.section;
  let key = argv.key;
  let requestOptions;

  if (section == '') {
    requestOptions = {
      method: 'GET',
      url: 'http://' + playerData[1] + '/api/v1/registry',
    };
  } else {
    requestOptions = {
      method: 'GET',
      url: 'http://' + playerData[1] + '/api/v1/registry/' + section + '/' + key,
    };
  }

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(response.data.result.value);
  } catch (error) {
    console.log(error);
  }
}

async function checkDWSFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerData[1] + '/api/v1/control/local-dws',
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    if (response.data.result.value) {
      console.log('DWS is enabled')
    } else {
      console.log('DWS is disabled')
    }
  } catch (error) {
    console.log(error);
  }
}

async function getFilesFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
  let playerPath = argv.path;

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerData[1] + '/api/v1/files/sd' + playerPath,
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(response.data.result.files);
  } catch (error) {
    console.log(error);
  }
}

async function getTimeFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerData[1] + '/api/v1/time',
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(response.data.result);
  } catch (error) {
    console.log(error);
  }
}

async function deleteFileFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
  let playerPath = argv.file;

  let requestOptions = {
    method: 'DELETE',
    url: 'http://' + playerData[1] + '/api/v1/files/sd/' + playerPath,
  }

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(playerPath + ' deleted: ' + response.data.result.success);
  }
  catch (error) {
    console.log(error);
  }
}

async function getLogsFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerIP + '/api/v1/logs',
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(response.data.result);
  } catch (error) {
    console.log(error);
  }
}


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

  try {
    let response = await requestFetch(requestOptions, 'admin', targetPasswordRaw);
  } catch (error) {
    console.log(error);
  }
  if(rawResponseRaw) {
    console.log(response);
  } else {
    console.log(response.data.result);
  }
}

async function pushFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

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

    let form = new formData();
    let fileToUpload = fs.createReadStream(path);
    form.append("file", fileToUpload, {filename: path});
    requestOptions.body = form;
 
    try {
      let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
      console.log(response.data.result.results + ' uploaded: ' + response.data.result.success);
    } catch (err) {
      console.log(err);
    }
  } else if (!isFile){
    
    // if directory, push directory
    //console.log('pushing directory'); 
    for (i = 0; i < files.length; i++) {

      let fileToUpload = fs.createReadStream(files[i]);

      let form = new formData();
      form.append('file', fileToUpload, {filename: files[i]});
      requestOptions.body = form;

      console.log('Pushing ' + files[i]);

      try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log(response.data.result.results + ' uploaded: ' + response.data.result.success);
      } catch (err) {
        console.log(err);
      }
    }
  }
}

async function changePWFunc(argv) {
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

  let requestOptions = {
    method: 'PUT',
    url: 'http://' + playerIP + '/api/v1/control/dws-password',
    data: {
      password: argv.newPassword,
      previous_password: playerPW
    }
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log('Password changed (player side): ' + response.data.result.success);
    //console.log(response);

    // update password in players.json
    fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
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
      fs.writeFile(CONFIG_FILE_PATH, modifiedData, 'utf8', (error) => {
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
  
  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  // For next version:
  // If password is set on player and not locally, this will return an error from requestFetch
  // that should be handled within this function -> if certain error, then password is set on player
  // so: 
  /*
    1. find out what error is returned when password is set on player and is not set, or set wrong, locally
      a. call that error "authError", return as a boolean that is true if error is authError
    2. if that error, then password is set on player and wrong/null locally
    3. if that error AND password is set locally, then local password is wrong
      a. if (authError && players[argv.playername].password !== '') -> password is wrong
    4. if that error AND password not set locally -> must either turn player password off or set a password locally
      a. if (authError && players[argv.playername].password == '') -> password is not set locally
    5. if no error AND return object says password is blank (true), then password is not set on player
      a. if (!authErro && response.data.result.password.isBlank) -> password is not set on player
    6. if no error AND return object says password is not blank (false), then password is set on player and correct locally
      a. if (!authError && !response.data.result.password.isBlank) -> password is set on player and correct locally
  */

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerIP + '/api/v1/control/dws-password',
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    //console.log(response);
    //console.log(response.data.result.password);
    //console.log('Player has password set: ' + response.data.result.password.);
    console.log('Password is blank: ' + response.data.result.password.isBlank);
  } catch (err) {
    console.log(err);
  }
}

async function rebootFunc(argv) {

  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

  let requestOptions = {
    method: 'PUT',
    url: 'http://' + playerIP + '/api/v1/control/reboot',
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    //console.log(response);
    console.log('Player rebooted: ' + response.data.result.success);
  } catch (err) {
    console.log(err);
  }
}

function addPlayerFunc(argv) {
  fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
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
    fs.writeFile(CONFIG_FILE_PATH, modifiedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing file: ', error);
        return;
      }
      console.log('Player added successfully');
    });
  });
}

function removePlayerFunc(argv) {
  fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
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
    fs.writeFile(CONFIG_FILE_PATH, modifiedData, 'utf8', (error) => {
      if (error) {
        console.error('Error writing file: ', error);
        return;
      }
      console.log('Player removed successfully');
    });
  });
}

async function getDeviceInfo(argv) {

  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

  let requestOptions = {
    method: 'GET',
    url: 'http://' + playerIP + '/api/v1/info',
  };
  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    console.log(response);
  } catch (err) {
    console.log(err);
  }
}

async function screenshotFunc(argv) {

  // get player data from argv
  let playerData = await pullData(argv);
  // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW

  let playerUser = playerData[0];
  let playerIP = playerData[1];
  let playerPW = playerData[2];

  let requestOptions = {
    method: 'POST',
    url: 'http://' + playerIP + '/api/v1/snapshot',
  };

  try {
    let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
    //console.log(response);
    console.log('Screenshot taken! Location: ' + response.data.result.filename);
  } catch (err) {
    console.log(err);
  }
}

// General functions
function generatePlayersJson() {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    //console.log('Players config file already exists');
    return;
  }

  let playersDefault = {};
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter player name: ', (playerName) => {
    playersDefault[playerName] = {};
    rl.question('Enter player IP address: ', (ipAddress) => {
      playersDefault[playerName].ipAddress = ipAddress;
      rl.question('Enter player username: ', (username) => {
        playersDefault[playerName].username = username;
        rl.question('Enter player password: ', (password) => {
          playersDefault[playerName].password = password;
          rl.close();
          let playersDefaultString = JSON.stringify(playersDefault, null, 2);

          fs.mkdirSync(currentPath.join(os.homedir(), '.bsc'), { recursive: true });

          fs.writeFileSync(CONFIG_FILE_PATH, playersDefaultString, (err) => {
            if (err) throw err;
            console.log('Players config file created');
          });
        });
      });
    });
  });
}

async function pullData(argv) {
  let playerUser = players[argv.playerName].username;
  let playerIP = players[argv.playerName].ipAddress;
  let playerPW = players[argv.playerName].password;

  let returnArr = [playerUser, playerIP, playerPW];
  return returnArr;
}

async function requestFetch(requestOptions, user, pass) {
  
  if (pass !== "") {
    console.log('Password set, using digest auth')
    let digestClient = new fetchDigest(user, pass);
    try {  
      let response = await digestClient.fetch(requestOptions.url, requestOptions);
      let resData = await response.json();
      return resData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  } else {
    console.log('No password set, using no auth')
    try {
      let response = await fetch(requestOptions.url, requestOptions);
      let resData = await response.json();
      return resData;
    } catch (err) {
      console.error(err);
      throw err;
    }
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

function main() {
  generatePlayersJson();
}

// parse the command line arguments
//yargs.parse();
main();
yargs.argv;