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

**Make sure to install the CLI before using the above command to edit players.json.**

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
| addPlayer | [x] | Add player configuration to players.json | bsc addPlayer [playerName] [ipAddress] [lDWS username] [lDWS password] |
| rmPlayer | [x] | Remove player configuration from players.json | bsc rmPlayer [playerName] |
| editPlayer | [] | Edit an already existing player's info |  |
| getDI | [x] | Get device info in the form of a JSON object | bsc getDI [playerName] | 
| push | [x] | Push file/files to a player. Specify a single file or a directory of files and the upload location (optional) | bsc push [playerName] [File/Directory] [location] |
| reboot | [x] | Reboot the specified player | bsc reboot [playerName] |
| checkPW | [x] | Check if lDWS password is enabled | bsc checkPW [playerName] |
| screenshot | [x] | Take a screenshot | bsc screenshot [playerName] |
| delFile | [] | Delete a file on the player |  | 
| setTime | [] | Set the player's time |  | 
| toggleDWS | [] | Toggles DWS on/off |  | 
| getLogs | [] | Gets logs from the player and puts them in a local file |  |
| facReset | [] | Factory resets the player |  |



