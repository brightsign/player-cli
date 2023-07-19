# BrightSign CLI API Tool

The purpose of this package is to allow users to communicate with the BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs through a simple CLI tool, `bsc`. 

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm i
```

Latest Local DWS REST API Documentation as of July 20, 2023.
[Local DWS APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs)

## Installing NPM Module from source

The following will need to be run to build the npm module. `bsc` will be built and ready to use. 

```bash
npm -g install
bsc --help
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
| push | [] | Push file/files to a player. Specify a single file or a directory of files and the upload location (optional) | bsc push [playerName] [File/Directory] [location] |
| reboot | [x] | Reboot the specified player | bsc reboot [playerName] |
| checkPW | [x] | Check if lDWS password is enabled | bsc checkPW [playerName] |
| screenshot | [x] | Take a screenshot | bsc screenshot [playerName] |
| delFile | [] | Delete a file on the player |  | 
| setTime | [] | Set the player's time |  | 
| toggleDWS | [] | Toggles DWS on/off |  | 
| getLogs | [] | Gets logs from the player and puts them in a local file |  |



