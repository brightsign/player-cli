# BrightSign CLI API Tool

**NOTE**: the code in this branch assumes that there is no password set on the player. This is done for ease of development.

**NOTE**: This branch also assumes an sd card on the player. In the future there will be a storage type option in players.json, however this is not implemented yet. 

The purpose of this package is to allow users to communicate with the BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs through a simple CLI tool, `bsc`. 

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm i
```

Latest Local DWS REST API Documentation as of July 20, 2023.
[Local DWS APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs)

## Create players.json

You will need to create the players.json file. This can be done by deleting the '.example' from the end of the file in cli-src, or by creating a new players.json file in the same folder. Once this file is created, and the module is installed, you can populate this object yourself, or use the command line:
```
bsc addPlayer <playerName> <ipAddress> [username] [password]
```

**Make sure to install the CLI before using the above command to edit players.json.** [Install the CLI](#installing-npm-module-from-source)

## Installing NPM Module from source

The following will need to be run to build the npm module. `bsc` will be built and ready to use. 

```bash
npm -g install
```


## Usage

For a list of commands and their usage, use `bsc --help`.

This CLI uses a player configuration object to interact with your player(s). This configuration can be found in the players.json file currently. You can add and remove players from this object at the command line: 
```bash
bsc addPlayer [playerName] [ipAddress] [lDWS username] [lDWS password]
bsc rmPlayer [playerName]
```
### Features

| Feature | Implemented? | Function | Usage |
| --------- | ---- | ------------------------ | -------------------------------------- |
| addPlayer | [x] | Add player configuration to players.json | bsc addPlayer \<playerName> \<ipAddress> [lDWS username] [lDWS password] |
| rmPlayer | [x] | Remove player configuration from players.json | bsc rmPlayer \<playerName> |
| editPlayer | [] | Edit an already existing player's info |  |
| getDI | [x] | Get device info in the form of a JSON object | bsc getDI \<playerName> | 
| put | [x] | Put file/files on a player. Specify a single file or a directory of files and the upload location (optional) | bsc put \<playerName> \<File/Directory> [location] |
| reboot | [x] | Reboot the specified player | bsc reboot \<playerName> |
| checkPW | [x] | Check if lDWS password is enabled | bsc checkPW \<playerName> |
| screenshot | [x] | Take a screenshot | bsc screenshot \<playerName> |
| delFile | [x] | Delete a file on the player | bsc delFile \<playerName> \<File> | 
| setTime | [] | Set the player's time |  | 
| getTime | [] | Get the player's time |  | 
| toggleDWS | [] | Toggles DWS on/off |  | 
| getLogs | [x] | Gets logs from the player and puts them in a local file | bsc getLogs \<playerName> |
| facReset | [] | Factory resets the player |  |


## Raw Requests:
bsc also supports raw API requests:
```
bsc raw -i <targetIp> -p [targetPassword] -m <reqMethod> -r <reqRoute> -a [rawResponse]
```
For example:
```
bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="info"
bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="files/sd"
```
Push a file with raw command:
```
bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=PUT -r="files/sd" -f="PATH"
```

### Formatting Responses

Install the tool [jq](https://stedolan.github.io/jq/download/) to prettify the JSON response structures.

#### jq examples

Parse the keys:
```bash
bsc raw -a=true -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/info" | jq 'keys'
```

Prettify the entire response: 
```bash
bsc raw -a=true -i=192.168.128.101 -p=XAE28N000058 -m=GET -r="/info" | jq '.data.result'
```

Parse the model from /info
```bash
bsc raw -a=true -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/info" | jq '.data.result.model'
```
