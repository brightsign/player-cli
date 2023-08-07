# BrightSign CLI API Tool

**NOTE**: the code in this branch assumes that there is no password set on the player. This is done for ease of development.

**NOTE**: This branch assumes an sd card on the player. In the future there will be a storage type option in players.json, however this is not implemented yet. 

The purpose of this package is to allow users to communicate with the BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs through a simple CLI tool, `bsc`. 

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm i
```

Latest Local DWS REST API Documentation as of July 20, 2023.
[Local DWS APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs)

## Installing NPM Module from source
First, clone this repository to your preferred location. Once cloned, navigate to the directory that you stored this code in.

The following will need to be run to build the npm module. `bsc` will be built and ready to use. 

```bash
npm -g install
```

When you first try and use a command, if you have not configured the CLI for at least one player, an error will be thrown. The first command that should be run is the simple `bsc` which will prompt you to configure your starting player.
```
bsc
```
Simply enter the name you want to give to your player, the ip address, and the username and the password of the player. Remember that by default, the player's username is 'admin' and the password is the serial number. 

**Note** to use file upload, the password must not be set on the player. You can easily turn off the password from the lDWS front end. 

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
| listPlayers | [x] | List players and their configuration in players.json | bsc listPlayers |
| getDI | [x] | Get device info in the form of a JSON object | bsc getDI \<playerName> | 
| put | [x] | Put file/files on a player. Specify a single file or a directory of files and the upload location (optional). Note that this only works when the player does not have a password set. | bsc put \<playerName> \<File/Directory> [location] |
| getFiles | [x] | get the files on the player's SD card or in a certain directory | bsc getFiles \<playerName> [path] |
| reboot | [x] | Reboot the specified player | bsc reboot \<playerName> |
| checkPW | [x] | Check if lDWS password is enabled | bsc checkPW \<playerName> |
| screenshot | [x] | Take a screenshot | bsc screenshot \<playerName> |
| delFile | [x] | Delete a file on the player | bsc delFile \<playerName> \<File> | 
| setTime | [x] | Set the player's time | bsc setTime \<playerName> \<timezone> \<time> \<date> [applyTimezone] | 
| getTime | [x] | Get the player's time | bsc getTime \<playerName> | 
| checkDWS | [x] | Check if the DWS is enabled or not | bsc checkDWS \<playerName> | 
| setDWS | [x] | Toggles DWS on/off | bsc setDWS \<playerName> \<on/off> | 
| getLogs | [x] | Gets logs from the player and puts them in a local file | bsc getLogs \<playerName> |
| facReset | [x] | Factory resets the player | bsc facReset \<playerName> |
| getReg | [x] | Gets the registry | bsc getReg \<playerName> [section] [key] |
| editReg | [x] | Edits certain sections of the registry | bsc editReg \<playerName> \<section> \<key> \<value> |


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
bsc raw -a=true -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="info" | jq 'keys'
```

Prettify the entire response: 
```bash
bsc raw -a=true -i=192.168.128.101 -p=XAE28N000058 -m=GET -r="info" | jq '.data.result'
```

Parse the model from /info
```bash
bsc raw -a=true -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="info" | jq '.data.result.model'
```
