const fs = require('fs');
const fsp = fs.promises;
const FormData = require('form-data');
let currentPath = require('path'); // for absolute path
//const players = require('./players.json');
const fetch = require('node-fetch');
const os = require('os');
const readline = require('readline');
const fetchDigest = require('digest-fetch');
const statusCodes = require('http-status');
const crypto = require('crypto');
const { argv } = require('process');
const { log } = require('console');
const CONFIG_FILE_PATH = currentPath.join(os.homedir(), '.bsc', 'players.json');

// Define error types
const errorTypes = {
    wrongPW: 0,
    wrongUser: 1,
    wrongIP: 2,
    invalidURL: 3,
    unknownError: 4,
    badRequest: 5,
    notFound: 6,
    badPlayerName: 7,
    unreachable: 8,
}

const miscErrorInfo = {
    internalErrorMin: 500,
    internalErrorMax: 599,
    successMin: 200,
    successMax: 299,
    unreachableType: 'system',
    unreachableNo: 'EHOSTUNREACH',
}

class ApiError extends Error {
    constructor(message, status, contentType) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.contentType = contentType;
    }
}

class playerNameError extends Error {
    constructor(message, type) {
        super(message);
        this.name = 'playerNameError';
        this.type = type;
    }
}

function computeDigestHeader({
  wwwAuthenticateHeader,
  username,
  password,
  method,
  url,
}) {
  const authParams = wwwAuthenticateHeader
    .match(/(realm|qop|nonce|opaque)="([^"]+)"/gi)
    .reduce((params, match) => {
      const [_, key, value] = match.match(/([^=]+)="([^"]+)"/i);
      params[key.toLowerCase()] = value;
      return params;
    }, {});

  const nc = '00000001';
  const cnonce = crypto.randomBytes(8).toString('hex');

  const { realm, nonce, qop, opaque } = authParams;

  const hash = (data) => crypto.createHash('md5').update(data).digest('hex');

  const ha1 = hash(`${username}:${realm}:${password}`);
  const ha2 = hash(`${method.toUpperCase()}:${url}`);
  const response = hash(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);

  return `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${url}", response="${response}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", opaque="${opaque}"`;
}

// Handle commands
// edit player
function editPlayer(argv) {
  
    // check if player exists
    const players = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    if (typeof players[argv.playerName] === "undefined") {
        errorHandler(new playerNameError('Player not found', errorTypes.badPlayerName));
    }

    let playerName = argv.playerName;
    let playerSetUser = argv.username;
    let playerSetPass = argv.password;
    let playerSetIP = argv.ipAddress;
    let playerSetStorage = argv.storage;

    logIfOption('Editing player ' + playerName, argv.verbose);
    logIfOption('Opening players.json', argv.verbose);
  
    fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading players.json: ', error);
        }
        
        logIfOption('players.json opened successfully', argv.verbose);
        
        // parse the json
        let JSONdata = JSON.parse(data);
        // craft the json object that will replace the old one
        if (argv.ipAddress) {
            console.log('New IP address inputted');
            JSONdata[playerName].ipAddress = playerSetIP;
        }
        if (argv.password) {
            console.log('new password inputted');
            JSONdata[playerName].password = playerSetPass;
        }
        if (argv.username) {
            console.log('new username inputted');
            JSONdata[playerName].username = playerSetUser;
        }
        if (argv.storage) {
            console.log('new storage inputted');
            JSONdata[playerName].storage = playerSetStorage;
        }
        if (argv.newName) {
            console.log('new player name inputted');
            JSONdata[argv.newName] = JSONdata[playerName];
            delete JSONdata[playerName];
            playerName = argv.newName;
        }

        logIfOption('New JSON object created', argv.verbose);
        logIfOption('Stringifying new JSON object and writing to players.json', argv.verbose);

        // stringify the new json object
        let newJSONdata = JSON.stringify(JSONdata, null, 2);
        // write to the file
        fs.writeFile(CONFIG_FILE_PATH, newJSONdata, 'utf8', (error) => {
            if (error) {
                console.error('Error writing file: ', error);
                return;
            }
            logIfOption('New JSON object written to players.json', argv.verbose);
            console.log('Player edited successfully');
        });
    });
}
  
// list players
async function listPlayers() {
    try {
        const localFilePath = currentPath.join(process.cwd(), '.players.json');
        let localConfigExists = await fsp.access(localFilePath).then(() => true).catch(() => false);
        
        if (localConfigExists) {
            playersJson = fs.readFileSync(localFilePath, 'utf8');
            players = JSON.parse(playersJson);
            console.log(players);
        } else {
            playersJson = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
            players = JSON.parse(playersJson);
            console.log(players);
        }

        
    } catch (err) {
        console.error('Error reading or parsing players.json: ', err);
    }
}

// edit registry function
async function editReg(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Editing registry values on ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);
    logIfOption('Setting => Section: ' + argv.section + ', key: ' + argv.key + ', value: ' + argv.value, argv.verbose);

    // create body
    let rawBody = JSON.stringify({ "value": argv.value });

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/registry/' + argv.section + '/' + argv.key,
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    }

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    // send request
    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log('Registry setting changed: ' + response.data.result.success);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// factory reset function
async function factoryReset(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Factory resetting ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let rawBody = JSON.stringify({ "factory_reset": true });

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/reboot',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    }

    logIfOption('Setting special body for factory reset...', argv.verbose);
    logIfOption('Body set', argv.verbose);
    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    // send request
    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log('Factory reset: ' + response.data.result.success);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// set time function
async function setTime(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Setting time on ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let timezone = argv.timezone;
    let setDate = argv.date;
    let setTime = argv.time;
    let applyTimezoneBool = argv.applyTimezone;

    logIfOption('Setting => Timezone: ' + timezone + ', date: ' + setDate + ', time: ' + setTime + ', applyTimezone: ' + applyTimezoneBool, argv.verbose);

    // check if time and date are in correct format
    // regex is a way to specify a pattern of characters to be matched in a string
    // time format is hh:mm:ss, date format is YYYY-MM-DD
    const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    const dateFormatRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    
    logIfOption('Checking if time and date are in correct format', argv.verbose);

    if (setTime !== '' && setDate !== '' && !timeFormatRegex.test(setTime) && !dateFormatRegex.test(setDate)) {
        console.log('Date and time entered in wrong format, please use hh:mm:ss and YYYY-MM-DD respectively');
        return;
    } else if (setTime != '' && !timeFormatRegex.test(setTime)) {
        // time not entered correctly
        console.log('Time not entered correctly, please enter in format hh:mm:ss');
        return;
    } else if (setDate != '' && !dateFormatRegex.test(setDate)) {
        // date not entered correctly
        console.log('Date not entered correctly, please enter in format YYYY-MM-DD');
        return;
    } else {
        console.log('Time and date entered correctly');
    }

    // set the time on the player
    let rawBody = JSON.stringify({
        "time": setTime + ' ' + timezone,
        "date": setDate,
        "applyTimezone": applyTimezoneBool
    });

    logIfOption('Creating request body', argv.verbose);

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/time',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    }

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log('Time set successfully: ' + response.data.result);
        } else if (argv.rawdata) {
            console.log(response.data);
        }
    }
    catch (err) {
        errorHandler(err);
    }
}

// get registry function
async function getReg(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }
    let section = argv.section;
    let key = argv.key;
    let requestOptions;

    logIfOption('Getting registry values from ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);
    

    if (section == '') {
        logIfOption('No section provided, getting all registry values', argv.verbose);
        requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/registry',
        };
    } else {
        logIfOption('Section provided, getting registry values for section: ' + section + ' and key: ' + key, argv.verbose);
        requestOptions = {
            method: 'GET',
            url: 'http://' + playerData[1] + '/api/v1/registry/' + section + '/' + key,
        };
    }

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log(response.data.result.value);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// set DWS function
async function setDWS(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Setting DWS for ' + argv.playerName + ' to ' + argv.onOff, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);
    
    let onOff = argv.onOff;
    let rawBody;

    logIfOption('Checking on/off value', argv.verbose);

    if (onOff == 'on') {
        logIfOption('Setting DWS to on', argv.verbose)
        rawBody = JSON.stringify({"enable": true});
        setDWSsub(playerData, rawBody, onOff, argv);
    } else if (onOff == 'off') {
        logIfOption('Setting DWS to off', argv.verbose)
        rawBody = JSON.stringify({"enable": false});
        confirmDangerousCommand('This may disable access to the player DWS APIs, limiting CLI capability (as of 8/10/23, using this command will disable local DWS APIs).', setDWSsub, playerData, rawBody, onOff);
    } else {
        console.log('Invalid on/off value');
        return;
    }
}

// set DWS sub function
async function setDWSsub(playerData, rawBody, onOff, argv) {
    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/local-dws',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            if (response.data.result.success && response.data.result.reboot && onOff == 'on') {
                console.log('DWS turned on, player rebooting');
            } else if (response.data.result.success && response.data.result.reboot && onOff == 'off') {
                console.log('DWS turned off, player rebooting');
            } else if (response.data.result.success && !response.data.result.reboot && onOff == 'on') {
                console.log('DWS turned on');
            } else if (response.data.result.success && !response.data.result.reboot && onOff == 'off') {
                console.log('DWS turned off');
            } else {
                console.log('set DWS failed');
            }
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// check DWS function
async function checkDWS(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Checking if DWS is enabled on ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/control/local-dws',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            if (response.data.result.value) {
                console.log('DWS is enabled')
            } else {
                console.log('DWS is disabled')
            }
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// get files func
async function getFilesCommand(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }
    let playerPath = argv.path;

    logIfOption('Getting files from ' + playerPath, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + playerPath,
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log(response.data.result.files);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// get time func
async function getTime(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Getting time on ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose)

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/time',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        console.log(response.data.result);
    } catch (err) {
        errorHandler(err);
    }
}

// delete file func
async function deleteFile(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }
    let playerPath = argv.file;

    logIfOption('Deleting file ' + playerPath, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose)

    let requestOptions = {
        method: 'DELETE',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + playerPath,
    }

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose)

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log(playerPath + ' deleted: ' + response.data.result.success);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    }
    catch (err) {
        errorHandler(err);
    }
}

// grab logs function
async function getLogs(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Getting logs from ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/logs',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        console.log(response.data.result);
    } catch (err) {
        errorHandler(err);
    }
}

// handle raw request function
async function handleRawRequest(argv) {
    console.log('Handling Raw Request');
    let ipAddressRaw = argv.i;
    let targetPasswordRaw = argv.p ? argv.p : '';
    let requestMethodRaw = argv.m;
    let requestRouteRaw = argv.r;
    let rawResponseRaw = argv.a;
    let fileRaw = argv.f;

    let requestOptions = {
        method: requestMethodRaw,
        url: 'http://' + ipAddressRaw + '/api/v1/' + requestRouteRaw,
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url + ' on ' + ipAddressRaw, argv.verbose);
    logIfOption('Full URL: ' + requestOptions.url, argv.verbose);

    if (fileRaw != null) {
        let form = new FormData();
        let fileToUpload = fs.createReadStream(fileRaw);
        console.log('Uploading file: ', fileRaw);
        form.append("file", fileToUpload, {filename: fileRaw});
        requestOptions.body = form;

        logIfOption('Uploading file: ' + fileRaw, argv.verbose);
        logIfOption('FormData created and request being sent', argv.verbose);
    }

    try {
        let response = await requestFetch(requestOptions, 'admin', targetPasswordRaw);
        logIfOption('Response received! => ', argv.verbose);
        if(rawResponseRaw) {
            console.log(response);
        } else {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// put file function
async function pushFile(file, destination, playerData, isRawData, isVerbose) {
    logIfOption(`Pushing file: ${file}`, isVerbose);

    const requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + destination,
    };

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file));
    requestOptions.body = formData;
    requestOptions.headers = formData.getHeaders();

    try {
        const response = await requestFetch(
            requestOptions,
            playerData[0],
            playerData[2],
            file
        );
        
        if (!isRawData) {
            console.log(`File ${response.data.result.results} uploaded: ${response.data.result.success}`);
        } else if (isRawData) {
            let resString = JSON.stringify(response.data.result);
            logIfOption(resString, isRawData);
        }
    } catch (err) {
        errorHandler(err);
    }
}

async function pushDir(path, destination, playerData, isRawData, isVerbose){
    const files = await getFiles(path);
    for (const file of files) {
        let fullPath = appendFilePath(path, file);

        const isFile = await checkDir(fullPath)
        if(isFile) {
            await pushFile(fullPath, destination, playerData, isRawData, isVerbose);
        }
        else {
            let subDestination = appendFilePath(destination, file);
            if(!await directoryExists(subDestination, playerData, isRawData, isVerbose)) {
                await createDirectory(subDestination, playerData, isRawData, isVerbose);
            }
            await pushDir(fullPath, subDestination, playerData, isRawData, isVerbose);
        }
    }
}

// put file function
async function createDirectory(destination, playerData, isRawData, isVerbose) {
    logIfOption(`Creating Directory: ${destination}`, isVerbose);

    //ensure it ends with a slash
    destination += destination[destination.length - 1] != '/' ? '/' : '';

    const requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + destination,
    };

    try {
        const response = await requestFetch(
            requestOptions,
            playerData[0],
            playerData[2]
        );

        if (!isRawData) {
            console.log(`Directory ${destination} created: ${response.data.result.success}`);
        } else if (isRawData) {
            let resString = JSON.stringify(response.data.result);
            logIfOption(resString, isRawData);
        }
    } catch (err) {
        errorHandler(err);
    }
}

async function directoryExists(path, playerData, isRawData, isVerbose) {
    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + path,
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, isVerbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', isVerbose);
        if (!isRawData) {
            logIfOption(response.data.result.files, isVerbose);
        } else if (isRawData) {
            logIfOption(response.data.result, isVerbose);
        }

        if(response.data.result.files !== undefined) {
            logIfOption(`Directory ${path} already exists`, isVerbose);
            return true;
        }
        else {
            logIfOption(`Path ${path} exists but is not a directory`, isVerbose);
            return false;
        }
    } catch (err) {
        if(err instanceof ApiError) {
            if(err.status === 404) {
                logIfOption(`Directory ${path} does not exist`, isVerbose);
                return false;
            }
        }
        errorHandler(err);
    }
}

function appendFilePath(path, file) {
    let lastChar = path[path.length - 1];
    return path + (lastChar != '/' ? '/' : '') + file;
}

async function push(argv){
    try {
        const playerData = await pullData(argv); // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
        const path = argv.FileDirectory;
        const absPath = currentPath.resolve(path);
        // check if file or directory
        const isFile = await checkDir(path);

        const destination = argv.location.length ? argv.location : 'sd';

        if (isFile) {
            await pushFile(absPath, destination, playerData, argv.rawdata, argv.verbose);
            return;
        }
        else {
            if(!await directoryExists(destination, playerData, argv.rawdata, argv.verbose)) {
                await createDirectory(destination, playerData, argv.rawdata, argv.verbose);
            }
            await pushDir(absPath, destination, playerData, argv.rawdata, argv.verbose);
            return;
        }
    } catch (err) {
        console.log('An error occurred:', err);
        errorHandler(err);
    }
}

async function checkDir(path) {
    try {
        const stats = await fsp.stat(path);
        return stats.isFile();
    } catch (err) {
        throw new Error('Failed to check if the path is a file or directory.');
    }
}

// change password function
async function changePW(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Setting the password of ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', previous password: ' + playerData[2], argv.verbose)

    let rawBody = JSON.stringify({
        "password": argv.newPassword,
        "previous_password": playerData[2]
    });

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/dws-password',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);
    logIfOption('Previous password: ' + playerData[2] + ', new password: ' + argv.newPassword, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        if (!argv.rawdata) {
            console.log('Password changed (player side): ' + response.data.result.success);
        } else if (argv.rawdata) {
            console.log(response.data.result)
        }
    } catch (err) {
        errorHandler(err);
    }

    try {
        logIfOption('Changing password in players.json', argv.verbose);
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
                ipAddress: playerData[1],
                username: playerData[0] || 'admin',
                password: argv.newPassword,
                storage: playerData[3] || 'sd'
            }

            // write new json object to file
            let modifiedData = JSON.stringify(JSONdata, null, 2);
            fs.writeFile(CONFIG_FILE_PATH, modifiedData, 'utf8', (error) => {
                if (error) {
                    console.error('Error writing file: ', error);
                    return;
                }
                if (!argv.rawdata) {
                    console.log('Password changed (locally): successful');
                }
            });
        });
    } catch (err) {
        console.log('Error changing password in players.json: ', err);
    }
}

// check password function
async function checkPW(argv) {

    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Checking password of ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/control/dws-password',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        //console.log(response);
        //console.log(response.data.result.password);
        //console.log('Player has password set: ' + response.data.result.password.);
        
        if (!argv.rawdata) {
            console.log('Password is blank: ' + response.data.result.password.isBlank);
            if (response.data.result.password.isBlank && (playerData[2] == '' || playerData[2] == undefined)) {
                console.log('No password set locally, no password on player, you are good to go!')
            } else if (!response.data.result.password.isBlank && (playerData[2] !== '' || playerData[2] !== undefined)) {
                console.log('Password is set on the player, and your local password is set correctly, you are good to go!')
            } else if (response.data.result.password.isBlank && (playerData[2] !== '' || playerData[2] !== undefined)) {
                console.log('Password is not set on the player, but you have a password set locally. This will continue to work, but consider changing your password locally to be blank.')
            }
        } else if (argv.rawdata) {
            console.log(response.data.result)
        }

    } catch (err) {
        let errorType = checkpwErrorHandler(err);
        if (errorType == errorTypes.wrongPW && (playerData[2] !== '' || playerData[2] !== undefined)) {
            console.log('Your local password is wrong. Remember that the default password is the player serial number.');
        } else if (errorType == errorTypes.wrongPW && (playerData[2] == '' || playerData[2] == undefined)) {
            console.log('Your local password is not set, however the player has a password set');
        }
    }
}

// reboot function
async function reboot(argv) {

    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Rebooting ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/reboot',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);

        //console.log(response);
        if (!argv.rawdata) {
            console.log('Player rebooted: ' + response.data.result.success);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// add player locally function
function addPlayer(argv) {
    logIfOption('Adding player locally', argv.verbose);
    logIfOption('Adding player ' + argv.playerName + ' with IP address ' + argv.ipAddress + ',  password ' + argv.password + 'and storage: ' + argv.storage + ' to players.json', argv.verbose);
    logIfOption('Opening players.json', argv.verbose);

    fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading file: ', error);
            return;
        }
        logIfOption('File opened successfully', argv.verbose);
        logIfOption('Parsing JSON data', argv.verbose);

        // parse json object
        let JSONdata = JSON.parse(data);

        // add new player
        JSONdata[argv.playerName] = {
            ipAddress: argv.ipAddress,
            password: argv.password,
            username: argv.username,
            storage: argv.storage
        }

        logIfOption('JSON data parsed successfully', argv.verbose);
        logIfOption('Writing new JSON data to file', argv.verbose);

        // write new json object to file
        let modifiedData = JSON.stringify(JSONdata, null, 2);
        fs.writeFile(CONFIG_FILE_PATH, modifiedData, 'utf8', (error) => {
        if (error) {
            console.error('Error writing file: ', error);
            return;
        }
        logIfOption('Data written to file successfully', argv.verbose);
        console.log('Player added successfully');
        });
    });
}

// remove player locally function
function removePlayer(argv) {

    logIfOption('Removing player ' + argv.playerName + ' from players.json', argv.verbose);
    logIfOption('Removing player locally', argv.verbose);
    logIfOption('Opening players.json', argv.verbose);

    fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
        if (error) {
        console.error('Error reading file: ', error);
        return;
        }

        logIfOption('File opened successfully', argv.verbose);
        logIfOption('Parsing JSON data', argv.verbose);

        // parse json object
        let JSONdata = JSON.parse(data);

        logIfOption('JSON data parsed successfully', argv.verbose);
        logIfOption('Removing player from JSON data', argv.verbose);

        // remove player
        delete JSONdata[argv.playerName];

        logIfOption('Player removed from JSON data', argv.verbose);
        logIfOption('Writing new JSON data to file', argv.verbose);

        // write new json object to file
        let modifiedData = JSON.stringify(JSONdata, null, 2);
        fs.writeFile(CONFIG_FILE_PATH, modifiedData, 'utf8', (error) => {
            if (error) {
                console.error('Error writing file: ', error);
                return;
            }

            logIfOption('Data written to file successfully', argv.verbose);

            console.log('Player removed successfully');
        });
    });
}

// get device info function
async function getDeviceInfo(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Getting device info for ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/info',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        let resString = JSON.stringify(response.data.result);
        
        logIfOption(resString, argv.rawdata);
        logIfOption(response.data.result, !argv.rawdata);
    } catch (err) {
        errorHandler(err);
    }
}

// screenshot function
async function screenshot(argv) {

    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    logIfOption('Taking screenshot on ' + argv.playerName, argv.verbose);
    logIfOption('      IP address: ' + playerData[1] + ', username: ' + playerData[0] + ', password: ' + playerData[2], argv.verbose);

    let requestOptions = {
        method: 'POST',
        url: 'http://' + playerData[1] + '/api/v1/snapshot',
    };

    logIfOption('Sending ' + requestOptions.method + ' request to ' + requestOptions.url, argv.verbose);

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        logIfOption('Response received! => ', argv.verbose);
        //console.log(response);
        if (!argv.rawdata) {
            console.log('Screenshot taken! Location: ' + response.data.result.filename);
        } else if (argv.rawdata) {
            console.log(response.data.result);
        }
    } catch (err) {
        errorHandler(err);
    }
}

// General functions
// confirm dangerous command
function confirmDangerousCommand(prompt, callback) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
  
    rl.question(`${prompt} (Type 'Y' to confirm): `, (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'y') {
            callback();
        } else {
            console.log('Operation cancelled.');
        }
    });
}

// generate players.json file if it doesn't exist
async function generatePlayersJson() {
    let fileExists = await fsp.access(CONFIG_FILE_PATH).then(() => true).catch(() => false);
    try {
        if (fileExists === true) {
            //console.log('Players config file already exists');
            return;
        }

        let playersDefault = {};
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const getPlayerName = () => {
            return new Promise((resolve) => {
                rl.question('Enter player name: ', resolve);
            });
        };
        const getPlayerIP = () => {
            return new Promise((resolve) => {
                rl.question('Enter player IP address: ', resolve);
            });
        };
        const getUsername = () => {
            return new Promise((resolve) => {
                rl.question('Enter player username: ', resolve);
            });
        };
        const getPassword = () => {
            return new Promise((resolve) => {
                rl.question('Enter player password: ', resolve);
            });
        };
        const getStorage = () => {
            return new Promise((resolve) => {
                rl.question('Enter player storage type (sd/ssd): ', resolve);
            });
        };

        await getPlayerName()
            .then((playerName) => {
                playersDefault[playerName] = {};
                return getPlayerIP();
            })
            .then((ipAddress) => {
                const playerName = Object.keys(playersDefault)[0];
                playersDefault[playerName].ipAddress = ipAddress;
                return getUsername();
            })
            .then((username) => {
                const playerName = Object.keys(playersDefault)[0];
                if (username === '') {
                    playersDefault[playerName].username = 'admin';
                } else {
                    playersDefault[playerName].username = username;
                }
                return getPassword();
            })
            .then((password) => {
                const playerName = Object.keys(playersDefault)[0];
                playersDefault[playerName].password = password;
                return getStorage();
            })
            .then((storage) => {
                const playerName = Object.keys(playersDefault)[0];
                if (storage === '') {
                    playersDefault[playerName].storage = 'sd';
                } else {
                    playersDefault[playerName].storage = storage;
                }
                rl.close();
                console.log(playersDefault);
            })
            .catch((error) => {
                console.error(error);
                rl.close();
            });
        const playersDefaultString = JSON.stringify(playersDefault, null, 2);

        await fsp.mkdir(currentPath.join(os.homedir(), '.bsc'), { recursive: true });
        await fsp.writeFile(CONFIG_FILE_PATH, playersDefaultString);

        console.log('Players config file generated successfully');

    } catch (err) {
        console.error('Error generating players.json, ', err);
    }
}

// get player info from players.json
async function pullData(argv) {

    // First, check for .players.json file in local directory
    // if that exists, use it
    // if not, use CONFIG_FILE_PATH
    const localFilePath = currentPath.join(process.cwd(), '.players.json');

    let localConfigExists = await fsp.access(localFilePath).then(() => true).catch(() => false);
    if (localConfigExists) {
        const players = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
        if (typeof players[argv.playerName] === "undefined") {
            throw new playerNameError('Player not found', errorTypes.badPlayerName);
        } else {
            let playerUser = players[argv.playerName].username;
            let playerIP = players[argv.playerName].ipAddress;
            let playerPW = players[argv.playerName].password;
            let playerStorage = players[argv.playerName].storage;

            let returnArr = [playerUser, playerIP, playerPW, playerStorage];
            return returnArr;
        }
    } else {
        const players = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
        if (typeof players[argv.playerName] === "undefined") {
            throw new playerNameError('Player not found', errorTypes.badPlayerName);
        } else {
            let playerUser = players[argv.playerName].username;
            let playerIP = players[argv.playerName].ipAddress;
            let playerPW = players[argv.playerName].password;
            let playerStorage = players[argv.playerName].storage;

            let returnArr = [playerUser, playerIP, playerPW, playerStorage];
            return returnArr;
        }
    }
}

// request fetch function
async function requestFetch(requestOptions, user, pass, filePath) {
  const { url, ...options } = requestOptions;
  let succReturnContentType = 'application/json; charset=utf-8';

  try {
    let response = await fetch(url, options);
    if (response.status === 401 && response.headers.has('www-authenticate')) {
      const wwwAuthenticateHeader = response.headers.get('www-authenticate');
      const digestHeader = await computeDigestHeader({
        wwwAuthenticateHeader,
        username: user,
        password: pass,
        method: options.method,
        url,
      });

      let headers = {
        ...options.headers,
        Authorization: digestHeader,
      };

      let body = options.body;

      if (filePath) {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        headers = {
          ...formData.getHeaders(),
          Authorization: digestHeader,
        };
        body = formData;
      }

      response = await fetch(url, {
        method: options.method,
        headers: headers,
        body: body,
      });
    }

    if (response.headers.get('content-type') === succReturnContentType) {
      if (response.ok) {
        return await response.json();
      } else {
        throw new ApiError(
          'Response Error',
          response.status,
          response.headers.get('content-type')
        );
      }
    } else {
      throw new ApiError(
        'Unexpected content type in response',
        response.status,
        response.headers.get('content-type')
      );
    }
  } catch (err) {
    throw err;
  }
}

// get files in directory function
async function getFiles(path) {
    try {
        let filesArr = [];
        return await fsp.readdir(path);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// check if config exists function
function checkConfigExists() {
    let exists;
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        console.log('Players config file does not exist, creating...');
        exists = false;
        return exists;
    } else {
        exists = true;
        return exists;
    }
}

function errorHandler(err) {
    //console.log(err);
    /*
    if (rawflag) {
        console.error(err);
    }
    */
    if (err.status == statusCodes.UNAUTHORIZED) {
        //console.log(err)
        console.log('\n');
        //console.log('You have encountered an authorization error. This is most likely because your local password is incorrect, please check it and, if necessary, change it with the "editplayer" command. Example usage: bsc editplayer playerName -p playerPassword \n', err);
        //console.log('For more info on your password, use the checkpw command')
        console.log('Bad Auth: ', err);
    } else if (err.status == statusCodes.BAD_REQUEST) {
        //console.log(err)
        console.log('\n');
        //console.log('A bad request has  been sent. If you are not using the "raw" command, please open a github issue. If you are using "raw", please check your request options. \n', err);
        console.log('Bad Request: ', err);
    } else if (err.status == statusCodes.NOT_FOUND) {
        //console.log(err)
        console.log('\n');
        //console.log('What you are looking for could not be found. If you are not using the "raw" command, please open a github issue. If you are using "raw", please check your request options. \n', err);
        console.log('Not Found: ', err);
    } else if (err.status >= miscErrorInfo.internalErrorMin && err.status <= miscErrorInfo.internalErrorMax) {
        //console.log(err)
        console.log('\n');
        //console.log('You have encountered a server side error. If the problem persists, please open a github issue.', err);
        console.log('Internal Server Error: ', err);
    } else if (err.type == errorTypes.badPlayerName) {
        console.log('Player name is invalid. Please check your player name and try again. \n', err);
    } else if (err.type == statusCodes.unreachableType && err.errno == statusCodes.unreachableNo) {
        //console.log('Your player is unreachable. Please check your locally configured IP and your/the player\'s internet access, and try again. \n', err);
        console.log('Unreachable: ', err);
    } else if (err.type = statusCodes.NOT_FOUND) {
        //console.log('The resource you have attempted to interact with could not be found.\n', err);
        console.log('Not Found: ', err);
    }
    else {
        console.log('You have encountered an unknown error, please troubleshoot your issue (check player information locally, check if DWS is on, check if player is connected to internet, etc.)');
        console.error(err);
    }
}

// checkpw error handler
function checkpwErrorHandler(err) {
    if (err.status = statusCodes.UNAUTHORIZED) {
        return errorTypes.wrongPW;
    } else {
        console.log('Unknown error, please try again');
        return errorTypes.unknownError;
    }
}

// check if help was called for specific commands, if so give extra info
function helpChecker() {
    //console.log('help checker');
    //console.log(process.argv.slice(2))

    const rawArgs = process.argv.slice(2);
    const isHelpInvoked = rawArgs.includes('--help') || rawArgs.includes('-h') || rawArgs.includes('help');

    if (isHelpInvoked) {
        if (rawArgs.includes('editplayer')) {
            console.log('Example editplayer usage: ');
            console.log('Set new password: bsc editplayer playerName -p playerPassword');
            console.log('Set new username: bsc editplayer playerName -u playerUsername');
            console.log('Set new IP and storage type: bsc editplayer playerName -i playerIP -s playerStorageType');
        }
        else if (rawArgs.includes('putfile')) {
            console.log('Example putfile usage: ');
            console.log('Push file: bsc putfile playerName <pathToFileLocally> [directoryOnPlayer]');
            console.log('Push directory: bsc putfile playerName <pathToDirectoryLocally> [directoryOnPlayer]');
            console.log('Please note that the \'locationOnPlayer\' argument is a DIRECTORY on the player, not the file name that you want to push to. If you do not specify a directory location, the file will be pushed to the root directory of the player storage.');
        }
        else if (rawArgs.includes('raw')){
            // give examples of raw usage
            console.log('Raw usage: bsc raw -i <targetIp> -p [targetPassword] -m <reqMethod> -r <reqRoute> -a [rawResponse] -f [fileToUpload]');
            console.log('Raw Request Examples:');
            console.log('bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="info"');
            console.log('bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="files/sd"');
        }
        else if (rawArgs.includes('addplayer')) {
            console.log('Example player addition: ');
            console.log('bsc addplayer <playerName> <playerIP> [playerPassword] [playerUsername] [playerStorageType]');
            console.log('Defaults: playerPassword = blank, playerUsername = admin, playerStorageType = sd');
            console.log('Storage types are: sd, ssd')
        }
        else if (rawArgs.includes('rmplayer')) {
            console.log('Example player removal: ');
            console.log('bsc rmplayer <playerName>');
        }
        else if (rawArgs.includes('getfiles')) {
            console.log('Example getfiles usage: ');
            console.log('bsc getfiles <playerName> [pathOnPlayer]');
            console.log('By default, the path is the root directory of the player storage.');
            console.log('The path option is specifically for directories on the player, not files.');
        }
        else if (rawArgs.includes('settime')) {
            console.log('Example settime usage: ');
            console.log('bsc settime <playerName> <timezone> <time> <date> [applyTimezone]');
            console.log('Timezone is in three letter format, such as EST or PST');
            console.log('Time is in format of HH:MM:SS');
            console.log('Date is in format of YYYY-MM-DD');
            console.log('applyTimezone is a boolean, and is optional. If not specified, it will default to true. When true, the specified timezone will be applied. When false, UTC will be used.');
        }
        else if (rawArgs.includes('setdws')) {
            console.log('Example setdws usage: ');
            console.log('bsc setdws <playerName> <onOff>');
            console.log('onOff is literally "on" or "off". Note that turning off dws will turn off the APIs that this CLI interacts with, so you will not be able to use this CLI to interact with the player until DWS is turned back on.');
        }
        else if (rawArgs.includes('getreg')) {
            console.log('Example getreg usage: ');
            console.log('bsc getreg <playerName> [section] [key]');
            console.log('Section and key are optional. If not specified, all sections and keys will be returned.');
            console.log('To get networking registry: bsc getreg playername networking');
        }
        else if (rawArgs.includes('setreg')) {
            console.log('Example setreg usage: ');
            console.log('bsc setreg <playerName> <section> <key> <value>');
            console.log('Set bbhf to false: bsc setreg playername networking bbhf false')
        }
    }
}

function logIfOption(msg, option) {
    if (option) {
        console.log(msg);
    }
}

module.exports = {
    editPlayer, 
    listPlayers, 
    editReg, 
    factoryReset,
    setTime,
    getReg,
    setDWS,
    checkDWS,
    getFilesCommand,
    getTime,
    deleteFile,
    getLogs,
    handleRawRequest,
    push,
    changePW,
    checkPW,
    reboot,
    addPlayer,
    removePlayer,
    getDeviceInfo,
    screenshot,
    generatePlayersJson,
    checkConfigExists,
    helpChecker
};