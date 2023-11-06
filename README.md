# BrightSign CLI API Tool

<p align="center">
   <a href="https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs"><img src="./readmeMedia/PoweredByPurple.jpg" alt="Powered by Purple!" width="400" height="194"></a>
</p>

The purpose of this package is to allow users to communicate with the [BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs) through a simple CLI tool, `bsc`. 

## Table of Contents

- [Use Cases](#use-cases)
- [Installation](#installation)
    - [NPM](#npm)
    - [Build from Source](#build-from-source)
    - [Check Installation](#check-installation)
- [Configuring Players Locally](#configuring-players-locally)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Features](#features)
- [Raw Requests:](#raw-requests)
- [Formatting Responses](#formatting-responses)
    - [jq examples](#jq-examples)


## Use Cases

- Interact with a BrightSign player on your local network
- Push files to a player
- Edit registry settings of a player
- Get device info, registry dumps, logs and files from a player
- Get and set a player's time
- Reboot or factory reset a player
- Change the DWS password of a player
- Other miscellaneous features that the DWS frontend provides, but from the command line

## Installation

`bsc` is available as an npm package, and can also be built from the code in this repository. 

### NPM

This CLI is available on npm. To install it, run the following command:
```bash
npm install -g @brightsign/bsc
```

### Build from Source

First, clone this repository to your preferred location. Once cloned, navigate to the directory that you stored this code in.

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm install
```

The following will need to be run to build the npm module. `bsc` will be built and ready to use. 

```bash
npm -g install
```

### Check Installation

After installing, run `bsc --help` without arguments to see usage options: 
```
Built-in command usage: bsc <command> [options]
Raw usage: bsc raw -i <targetIp> -p [targetPassword] -m <reqMethod> -r
<reqRoute> -a [rawResponse]

Raw Request Examples:
bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="info"
bsc raw -i=192.168.128.148 -p=ABC01A000001 -m=GET -r="files/sd"

Commands:
  bsc getdi <playerName>                    Get Device Info
  bsc addplayer <playerName> <ipAddress>    Add a player
  [username] [password] [storage]
  bsc rmplayer <playerName>                 remove a player
  bsc editplayer <playerName>               Update a player
  bsc listplayers                           List all players
  bsc reboot <playerName>                   Reboot a player
  bsc checkpw <playerName>                  Check if player has a lDWS password
  bsc setpw <playerName> [newPassword]      Change player lDWS password, enter
                                            "" for no password
  bsc screenshot <playerName>               Take a screenshot
  bsc getlogs <playerName>                  Get logs
  bsc raw                                   allow for raw input
  bsc delfile <playerName> <file>           Delete a file
  bsc putfile <playerName> <FileDirectory>  Put files on a player
  [location]
  bsc getfiles <playerName> [path]          Get files on player
  bsc gettime <playerName>                  Get player time
  bsc settime <playerName> <timezone>       Set player time
  <time> <date> [applyTimezone]
  bsc checkdws <playerName>                 Check if player has DWS enabled
  bsc setdws <playerName> <onOff>           set DWS on/off
  bsc getreg <playerName> [section] [key]   Get registry values
  bsc setreg <playerName> <section> <key>   Edit registry values
  <value>
  bsc facreset <playerName>                 Factory reset player

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```

### Configuring Players Locally

For ease of use this CLI has introduced a locally stored player configuration object. This object stores relevant player information under a "playerName" (that you choose, independent of the player's name in BACon, bDeploy, or any other service where player names are required), allowing the player to be interacted with at the command line by just using the player name. This configuration object is stored in a hidden directory on your home directory path, or `~/.bsc/players.json`, and is automatically generated when you use the CLI.

When you first try and use a command, if you have not configured the CLI for at least one player, the command will not be run and instead you will be prompted to configure your first player. Simply enter the name you want to give to your player, the ip address, the username and the password of the player, and the player's storage device. Remember that by default, the player's digest authentication username is 'admin' and the password is the serial number. Additionally, the CLI will automatically set the username to 'admin' and the storage device to 'sd' if those fields are left blank.

Once the CLI has generated the player configuration object, you can freely add, remove and edit the players stored within it. To add a new player, use:
```
bsc addplayer <playerName> <ipAddress> [username] [password] [storage]
```

You can remove players from your configuration with: 
```
bsc rmplayer <playerName>
```

And you can edit a player's properties with:
```
bsc editplayer <playerName> -p password -i ipaddress -u username -s storage
```
Note here that none of the options are required but all can be changed at once.

Finally, to view your configuration file and the properties of each player, use:
```
bsc listplayers
```

#### Example players.json

```json
{
  "exampleName": {
    "ipAddress": "sss.sss.sss.sss",
    "username": "admin",
    "password": "password",
    "storage": "sd"
  }
}
```

#### Locally stored players.json

If you store a hidden file called `.players.json` in your current working directory, the CLI will prioritize that over the player storage stored in `~/.bsc`. This allows for easier organization of players and a much less cluttered players.json main file. 

**Note** to use file upload, the password must not be set on the player. You can easily turn off the password using `setpw` or from the lDWS front end. This is a WIP and this doc will be updated when this functionality exists.

## Usage

This CLI uses a player configuration object to interact with your player(s). To configure the CLI to interact with a player, refer to [configuring players locally](#configuring-players-locally). 

A list of commands and their structure can be seen by typing `bsc`, `bsc -h` or `bsc --help`. There's also a table of the currently supported features and their command structure below in the [features](#features) section. All commands (except `raw` and `listplayers`) use a 'playerName'. This is the name that you set in players.json. Some commands use 'positionals', or options that must be in a certain spot. These positionals are shown in the 'help' section and on the features table. Positionals listed with <> are required and ones with [] are optional. Certain commands also have options. Options are not defined by position but rather by a tag, for example `bsc editplayer playerName -i newIP`. In that example the new IP address is the option, defined by '-i'. Options can be in whatever order you want. For information on a command and its options, use `bsc command` with no positionals or options. 

## Troubleshooting

Sometimes you will run into errors while using this CLI. The CLI has built in error handling that should give you information on the error you encountered as well as troubleshooting tips. However, the error handler does not have info on every possible error, so you may run into errors that are not handled. If this is the case, there are certain troubleshooting steps that you can walk through to hopefully fix your problem. 

1. Check that you can communicate with the player
    1. Is the player on? Is the DWS on?
    2. Is the player on the same LAN as you?
    3. When you make a request with the CLI, does it show in the player's logs?
2. Check your local player info
    1. Use `bsc listplayers`. Does that info look right?
    2. Use `bsc checkpw playerName`. This will return information about your local password and the password on the player
    3. Did you input the correct playerName?
3. Check the Github issues page
    1. Maybe others have ran into this before
4. If none of these work, and your own troubleshooting methods also fail, please open a Github issue and/or a Jira issue (under the PE project, linked to PE-52) with reproduction steps. 

**Note**: We ask that if you encounter an error that is not handled by the error handler (if the error is an API error, the error handler will tell you if it doesn't have info on your error. If it's another type of error, that error will be printed on you command line) that you open a Github issue and report it. This will allow the dev team to implement error handling around your error. 

## Features

| Feature | Implemented? | Function | Usage |
| --------- | ---- | ------------------------ | -------------------------------------- |
| addplayer | [x] | Add player configuration to players.json | bsc addplayer \<playerName> \<ipAddress> [lDWS username] [lDWS password] |
| rmplayer | [x] | Remove player configuration from players.json | bsc rmplayer \<playerName> |
| editplayer | [x] | Edit an already existing player's info | bsc editplayer \<playerName> -i [playerIP] -u [playerUsername] -p [playerPassword] |
| listPlayers | [x] | List players and their configuration in players.json | bsc listplayers |
| getdi | [x] | Get device info in the form of a JSON object | bsc getdi \<playerName> | 
| putfile | [x] | Put file/files on a player. Specify a single file or a directory of files and the upload location (optional). Note that this only works when the player does not have a password set. The location option is exclusively a directory, not the filename it will be stored as | bsc putfile \<playerName> \<File/Directory> [location] |
| getfiles | [x] | get the files on the player's storage or in a certain directory | bsc getfiles \<playerName> [path] |
| delfile| [x] | Delete a file on the player | bsc delfile \<playerName> \<path> |
| reboot | [x] | Reboot the specified player | bsc reboot \<playerName> |
| checkpw | [x] | Check if lDWS password is enabled | bsc checkpw \<playerName> |
| setpw | [x] | Change the DWS password, both locally and on the player | bsc setpw \<playerName> [newPassword] |
| screenshot | [x] | Take a screenshot | bsc screenshot \<playerName> |
| raw | [x] | Make API requests 'raw', not using the locally configured players | bsc raw -i \<targetIP> -p [targetPassword] -m \<requestMethod> -r \<requestRoute> -a [rawResponseBool] -f [file] |
| settime | [x] | Set the player's time | bsc settime \<playerName> \<timezone> \<time> \<date> [applyTimezone] | 
| gettime | [x] | Get the player's time | bsc gettime \<playerName> | 
| checkdws | [x] | Check if the DWS is enabled or not | bsc checkdws \<playerName> | 
| setdws | [x] | Toggles DWS on/off | bsc setDWS \<playerName> \<on/off> | 
| getlogs | [x] | Gets logs from the player and puts them in a local file | bsc getlogs \<playerName> |
| facreset | [x] | Factory resets the player | bsc facreset \<playerName> |
| getreg | [x] | Gets the registry | bsc getreg \<playerName> [section] [key] |
| setreg | [x] | Edits certain sections of the registry | bsc editreg \<playerName> \<section> \<key> \<value> |

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
