function getDiPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
}

function addPlayerPositional(yargs) {
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
    yargs.positional('storage', {
        type: 'string',
        default: 'sd',
        describe: 'player storage type'
    });
}

function rmPlayerPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player2',
        describe: 'Player name'
    });
}

function editPlayerPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        describe: 'Player name'
    });
    yargs.option('i', { alias: 'ipAddress', describe: 'New IP address', type: 'string', demandOption: false });
    yargs.option('u', { alias: 'username', describe: 'New username', type: 'string', demandOption: false });
    yargs.option('p', { alias: 'password', describe: 'New password', type: 'string', demandOption: false });
    yargs.option('s', { alias: 'storage', describe: 'New storage type', type: 'string', demandOption: false });
    yargs.option('n', { alias: 'newName', describe: 'New player name', type: 'string', demandOption: false });
}

function rebootPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
}

function checkPWPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
}

function changePWPositional(yargs) {
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
}

function screenshotPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
}

function getLogsPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
}

function rawPositional(yargs) {
    yargs.option('i', { alias: 'targetIp', describe: 'IP Address of Target Player', type: 'string', demandOption: true });
    yargs.option('p', { alias: 'targetPassword', describe: 'Password of Target Player', type: 'string', demandOption: false });
    yargs.option('m', { alias: 'reqMethod', describe: 'Request method type', type: 'string', demandOption: true });
    yargs.option('r', { alias: 'reqRoutes', describe: 'Request url route', type: 'string', demandOption: true });
    yargs.option('a', { alias: 'rawResponse', describe: 'Raw HTTP REST Response', type: 'boolean', demandOption: false });
    yargs.option('f', { alias: 'file', describe: 'Path to file to push if pushing file', type: 'string', demandOption: false })
}

function delFilePositional(yargs) {
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
}

function putFilePositional(yargs) {
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
}

function getFilePositional(yargs) {
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
}

function getTimePositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });  
}

function setTimePositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'player name'
    });
    yargs.positional('timezone', {
        type: 'string',
        default: 'America/New_York',
        describe: 'Timezone'
    });
    yargs.positional('time', {
        type: 'string',
        default: '',
        describe: 'Time, hh:mm:ss'
    });
    yargs.positional('date', {
        type: 'string',
        default: '',
        describe: 'Date, YYYY-MM-DD'
    });
    yargs.positional('applyTimezone', {
        type: 'boolean',
        default: true,
        describe: 'Apply timezone to time'
    }); 
}

function checkDWSPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });

}

function setDWSPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
    yargs.positional('onOff', {
        type: 'string',
        default: 'on',
        describe: 'Turn DWS on or off'
    });   
}

function getRegPositional(yargs) {
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
}

function setRegPositional(yargs) {
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
    yargs.positional('value', {
        type: 'string',
        default: '',
        describe: 'Registry value'
    });
}

function setPowerSavePositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'player name'
    });
    yargs.positional('enabled', {
        type: 'string',
        describe: 'Power save enabled/disabled, true/false'
    });
    yargs.positional('connector', {
        type: 'string',
        describe: 'Chosen video output connector, hdmi'
    });
    yargs.positional('device', {
        type: 'string',
        describe: 'HDMI port number, 0-3'
    });

}

function getPowerSavePositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'player name'
    });
    yargs.positional('connector', {
        type: 'string',
        default: 'hdmi',
        describe: 'Chosen video output connector (hdmi)'
    });
    yargs.positional('device', {
        type: 'string',
        default: '0',
        describe: 'HDMI port number (0-3)'
    });
}

function facResetPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'player name'
    }); 
}

module.exports = {
    getDiPositional,
    addPlayerPositional,
    rmPlayerPositional,
    editPlayerPositional,
    rebootPositional,
    checkPWPositional,
    changePWPositional,
    screenshotPositional,
    getLogsPositional,
    rawPositional,
    delFilePositional,
    putFilePositional,
    getFilePositional,
    getTimePositional,
    setTimePositional,
    checkDWSPositional,
    setDWSPositional,
    getRegPositional,
    setRegPositional,
    setPowerSavePositional,
    getPowerSavePositional,
    facResetPositional
}