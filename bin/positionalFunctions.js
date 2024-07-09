function defaultPositional(yargs) {
    yargs.positional('playerName', {
        type: 'string',
        default: 'player1',
        describe: 'Player name'
    });
}

function getDiPositional(yargs) {
    defaultPositional(yargs);
}

function addPlayerPositional(yargs) {
    defaultPositional(yargs);

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
    defaultPositional(yargs);
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
    defaultPositional(yargs);
}

function checkPWPositional(yargs) {
    defaultPositional(yargs);
}

function changePWPositional(yargs) {
    defaultPositional(yargs);

    yargs.positional('newPassword', {
        type: 'string',
        default: '',
        describe: 'New password, surround in quotes'
    });
}

function screenshotPositional(yargs) {
    defaultPositional(yargs);
}

function getLogsPositional(yargs) {
    defaultPositional(yargs);
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
    defaultPositional(yargs);

    yargs.positional('file', {
        type: 'string',
        default: '',
        describe: 'Path to file on player'
    });
}

function putFilePositional(yargs) {
    defaultPositional(yargs);

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
    defaultPositional(yargs);

    yargs.positional('path', {
        type: 'string',
        default: '',
        describe: 'Path to get files from'
    });   
}

function getTimePositional(yargs) {
    defaultPositional(yargs);
}

function setTimePositional(yargs) {
    defaultPositional(yargs);

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
    defaultPositional(yargs);
}

function setDWSPositional(yargs) {
    defaultPositional(yargs);

    yargs.positional('onOff', {
        type: 'string',
        default: 'on',
        describe: 'Turn DWS on or off'
    });   
}

function getRegPositional(yargs) {
    defaultPositional(yargs);

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
    defaultPositional(yargs);

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
    defaultPositional(yargs);

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
    defaultPositional(yargs);

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
    defaultPositional(yargs);
}

function sendCecPositional(yargs) {
    defaultPositional(yargs);

    yargs.positional('command', {
        type: 'string',
        default: '',
        describe: 'CEC command, direct passthrough'
    });
}

function sendDisplayStandbyPositional(yargs) {
    defaultPositional(yargs);
}

function sendDisplayOnPositional(yargs) {
    defaultPositional(yargs);
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
    facResetPositional,
    sendCecPositional,
    sendDisplayOnPositional,
    sendDisplayStandbyPositional
}