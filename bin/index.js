#!/usr/bin/env node

const yargs = require('yargs');
const AxiosDigestAuth = require('@mhoc/axios-digest-auth').default;

// Set up CLI
const options = yargs
  .usage('Usage: bsc -i <targetIp> -p <targetPassword> -m <reqMethod> -r <reqRoute>')
  .usage('')
  .usage('       Examples:')
  .usage('       bsc -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="/info"')
  .usage('       bsc -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="/files/sd"')
  .option('i', { alias: 'targetIp', describe: 'IP Address of Target Player', type: 'string', demandOption: true })
  .option('p', { alias: 'targetPassword', describe: 'Password of Target Player', type: 'string', demandOption: false })
  .option('m', { alias: 'reqMethod', describe: 'Request method type', type: 'string', demandOption: true })
  .option('r', { alias: 'reqRoutes', describe: 'Request url route', type: 'string', demandOption: true })
  .option('a', { alias: 'raw', describe: 'Raw HTTP REST Response', type: 'boolean', demandOption: false })
  // .option('s', { alias: 'dest', describe: 'Target Destination. e.g., sd/myfolder/', type: 'string', demandOption: false })
  // .option('f', { alias: 'file', describe: 'File name or source file path to upload to target player', type: 'string', demandOption: true })
  .argv;

// CLI Arguments
let ipAddress = options.i;
let targetPassword = options.p;
let requestMethod = options.m;
let requestRoute = options.r;
let rawResponse = options.a;

// PUT e.g., /files/sd + file blob. 
// let destDirectory = options.s;
// let filePath = options.f;

let axiosDigestAuthInst;

async function prepareAxios () {
    if (axiosDigestAuthInst == null || axiosDigestAuthInst === undefined) {
        const options = {
            username: 'admin',
            password: targetPassword,
        };
        axiosDigestAuthInst = new AxiosDigestAuth(options);
    }
};

async function requestAxios (requestOptions) {
    let response;

    prepareAxios();

    requestOptions.url = `http://${ipAddress}/api/v1` + requestOptions.url;
    response = await axiosDigestAuthInst.request(requestOptions);
    if (rawResponse) {
      console.log(response);
    } else {
      console.log(JSON.stringify(response.data));
    }
    return response.data?.data.result || response.data.result;
};

async function main() {
  try {
    let response = await requestAxios({method: `${requestMethod}`, url: `${requestRoute}`});
    // console.log(JSON.stringify(response));
  } catch (e) {
    console.log(JSON.stringify(e));
  }
}

if (require.main === module) {
	main();
}