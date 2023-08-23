const fs = require('fs');
const fsp = fs.promises;
const formData = require('form-data');
let currentPath = require('path'); // for absolute path
//const players = require('./players.json');
const fetch = require('node-fetch');
const os = require('os');
const readline = require('readline');
const fetchDigest = require('digest-fetch');
const statusCodes = require('http-status');
const { argv } = require('process');
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

// Handle commands
// edit player
function editPlayer(argv) {
  
    let playerName = argv.playerName;
    let playerSetUser = argv.username;
    let playerSetPass = argv.password;
    let playerSetIP = argv.ipAddress;
  
    fs.readFile(CONFIG_FILE_PATH, 'utf8', (error, data) => {
        if (error) {
            console.error('Error reading players.json: ', error);
        }

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
            JSONdata[playerName].storage = argv.storage;
        }

        // stringify the new json object
        let newJSONdata = JSON.stringify(JSONdata, null, 2);
        // write to the file
        fs.writeFile(CONFIG_FILE_PATH, newJSONdata, 'utf8', (error) => {
        if (error) {
            console.error('Error writing file: ', error);
            return;
        }
        console.log('Player edited successfully');
        });
    });
}
  
// list players
function listPlayers() {
    try {
        playersJson = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
        players = JSON.parse(playersJson);
        console.log(players);
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
    // create body
    let rawBody = JSON.stringify({ "value": argv.value });

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/registry/' + argv.section + '/' + argv.key,
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    }

    // send request
    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log(response);
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
    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/reboot',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    }

    // send request
    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log(response);
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
    let timezone = argv.timezone;
    let setDate = argv.date;
    let setTime = argv.time;
    let applyTimezoneBool = argv.applyTimezone;

    // check if time and date are in correct format
    // regex is a way to specify a pattern of characters to be matched in a string
    // time format is hh:mm:ss, date format is YYYY-MM-DD
    const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    const dateFormatRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
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
    }

    // set the time on the player
    let rawBody = JSON.stringify({
        "time": setTime + ' ' + timezone,
        "date": setDate,
        "applyTimezone": applyTimezoneBool
    });

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/time',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    }

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log('Time set successfully: ' + response.data.result);
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
    let onOff = argv.onOff;
    let rawBody;

    if (onOff == 'on') {
        rawBody = JSON.stringify({"enable": true});
        setDWSsubFunc(playerData, rawBody, onOff);
    } else if (onOff == 'off') {
        rawBody = JSON.stringify({"enable": false});
        confirmDangerousCommand('This may disable access to the player DWS APIs, limiting CLI capability (as of 8/10/23, using this command will disable local DWS APIs).', setDWSsub, playerData, rawBody, onOff);
    } else {
        console.log('Invalid on/off value');
        return;
    }
}

// set DWS sub function
async function setDWSsub(playerData, rawBody, onOff) {
    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/local-dws',
        headers: { 'Content-Type': 'application/json' },
        body: rawBody
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
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
    } catch (err) {
        errorHandler(err);
    }
}

// get files func
async function getFilesCom(argv) {
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

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + playerPath,
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log(response.data.result.files);
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

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/time',
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
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

    let requestOptions = {
        method: 'DELETE',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + playerPath,
    }

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log(playerPath + ' deleted: ' + response.data.result.success);
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

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/logs',
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
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

    if (fileRaw != null) {
        let form = new formData();
        let fileToUpload = fs.createReadStream(fileRaw);
        console.log('Uploading file: ', fileRaw);
        form.append("file", fileToUpload, {filename: fileRaw});
        requestOptions.body = form;
    }

    try {
        let response = await requestFetch(requestOptions, 'admin', targetPasswordRaw);
    } catch (err) {
        errorHandler(err);
    }
    if(rawResponseRaw) {
        console.log(response);
    } else {
        console.log(response.data.result);
    }
}

// put file function
async function push(argv) {
    // get player data from argv
    let playerData;
    try {
        playerData = await pullData(argv);
        // playerData[0] = playerUser, [1] = playerIP, [2] = playerPW
    } catch (err) {
        errorHandler(err);
        return;
    }

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/files/' + playerData[3] + '/' + argv.location
    };

    // check if file or directory
    let path = argv.FileDirectory;
    let absPath = currentPath.resolve(path);
    let isFile;

    try {
        isFile = await checkDir(path);
    } catch (err) {
        errorHandler(err);
    }

    if (isFile === true) {
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
            errorHandler(err);
        }
    } else if (isFile === false){
        
        console.log('getting files...');
        try {
            files = await getFiles(path);
        } catch (err) {
            console.log('Error getting files from directory!');
            console.error(err);
        }

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
                errorHandler(err);
            }
        }
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

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log('Password changed (player side): ' + response.data.result.success);
        //console.log(response);
    } catch (err) {
        errorHandler(err);
    }

    try {
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

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/control/dws-password',
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        //console.log(response);
        //console.log(response.data.result.password);
        //console.log('Player has password set: ' + response.data.result.password.);
        console.log('Password is blank: ' + response.data.result.password.isBlank);
        if (response.data.result.password.isBlank && (playerData[2] == '' || playerData[2] == undefined)) {
            console.log('No password set locally, no password on player, you are good to go!')
        } else if (!response.data.result.password.isBlank && (playerData[2] !== '' || playerData[2] !== undefined)) {
            console.log('Password is set on the player, and your local password is set correctly, you are good to go!')
        } else if (response.data.result.password.isBlank && (playerData[2] !== '' || playerData[2] !== undefined)) {
            console.log('Password is not set on the player, but you have a password set locally. This will continue to work, but consider changing your password locally to be blank.')
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

    let requestOptions = {
        method: 'PUT',
        url: 'http://' + playerData[1] + '/api/v1/control/reboot',
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        //console.log(response);
        console.log('Player rebooted: ' + response.data.result.success);
    } catch (err) {
        errorHandler(err);
    }
}

// add player locally function
function addPlayer(argv) {
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
            username: argv.username,
            storage: argv.storage
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

// remove player locally function
function removePlayer(argv) {
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

    let requestOptions = {
        method: 'GET',
        url: 'http://' + playerData[1] + '/api/v1/info',
    };
    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        console.log(response.data.result);
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

    let requestOptions = {
        method: 'POST',
        url: 'http://' + playerData[1] + '/api/v1/snapshot',
    };

    try {
        let response = await requestFetch(requestOptions, playerData[0], playerData[2]);
        //console.log(response);
        console.log('Screenshot taken! Location: ' + response.data.result.filename);
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
                rl.question('Enter player storage type: ', resolve);
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

// request fetch function
async function requestFetch(requestOptions, user, pass) {
    let succReturnContentType = 'application/json; charset=utf-8';

    try {
        if (pass !== "" && typeof pass !== "undefined") {
            //console.log('Password set, using digest auth')
            //console.log(user);
            if (typeof user === "undefined" || user === "") {
                user = "admin";
            }
            let digestClient = new fetchDigest(user, pass);
            let response = await digestClient.fetch(requestOptions.url, requestOptions);
            //console.log(response.headers);
            
            if (response.headers.get('content-type') == succReturnContentType) { //indicates successful response -> errors will be returned as plain text
                if (response.status >= miscErrorInfo.successMin && response.status <= miscErrorInfo.successMax) {
                    let resData = await response.json();
                    return resData;
                } else {
                    throw new ApiError('Response Error', response.status, response.headers.get('content-type'));
                } 
            } 
            else {
                //console.log(response);
                throw new ApiError('Unexpected content type in response', response.status, response.headers.get('content-type'));
            }
            
        } else {
            //console.log('No password set, using no auth')
            
            let response = await fetch(requestOptions.url, requestOptions);
            //console.log(response.headers);
            //console.log(response.headers.get('content-type'));

            if (response.headers.get('content-type') == succReturnContentType) { //indicates successful response -> errors will be returned as plain text
                if (response.status >= miscErrorInfo.successMin && response.status <= miscErrorInfo.successMax) {
                    let resData = await response.json();
                    return resData;
                } else {
                    throw new ApiError('Response Error', response.status, response.headers.get('content-type'));
                } 
            } 
            else {
                //console.log(response);
                throw new ApiError('Unexpected content type in response', response.status, response.headers.get('content-type'));
            }
        }
    } catch (err) {
        throw err;
    }
}

// check if location is directory function
async function checkDir(path) {
    try {
        const stats = await fsp.stat(path);
        if (stats.isFile()) {
            return true;
        } else if (stats.isDirectory()) {
            return false;
        } else {
            throw new Error('Provided path is neither file nor directory');
        }
    } catch (err) {
        throw err;
    }
}

// get files in directory function
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
        if (rawArgs.includes('putfile')) {
            console.log('Example putfile usage: ');
            console.log('Push file: bsc putfile playerName <pathToFileLocally> [directoryOnPlayer]');
            console.log('Push directory: bsc putfile playerName <pathToDirectoryLocally> [directoryOnPlayer]');
            console.log('Please note that the \'locationOnPlayer\' argument is a DIRECTORY on the player, not the file name that you want to push to. If you do not specify a directory location, the file will be pushed to the root directory of the player storage.');
        }
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
    getFilesCom,
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