# BrightSign CLI API Tool
The purpose of this package is to allow users to communicate with the BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs through a simple CLI tool, `bsc`. 

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm i
```

Latest Local DWS REST API Documentation as of August 15, 2023.
[Local DWS APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs)

## Installing NPM Module from source
First, clone this repository to your preferred location. Once cloned, navigate to the directory that you stored this code in.

The following will need to be run to build the npm module. `bsc` will be built and ready to use. 

```bash
npm -g install
```

### Configuring Players Locally
For ease of use this CLI has introduced a locally stored player configuration object. This object stores relevant player information under a "playerName" (that you choose, independent of the player's name in BACon, bDeploy, or any other service where player names are required), allowing the player to be interacted with at the command line by just using the player name. This configuration object is stored in a hidden directory on your home directory path, or `~/.bsc/players.json`, and is automatically generated when you use the CLI.

When you first try and use a command, if you have not configured the CLI for at least one player, the command will not be run and instead you will be prompted to configure your first player. Simply enter the name you want to give to your player, the ip address, the username and the password of the player, and the player's storage device. Remember that by default, the player's username is 'admin' and the password is the serial number. Additionally, the CLI will automatically set the username to 'admin' and the storage device to 'sd' if those fields are left blank.

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

**Note** to use file upload, the password must not be set on the player. You can easily turn off the password using `setpw` or from the lDWS front end. This is a WIP and this doc will be updated when this functionality exists.

## Usage

For a list of commands and their usage, use `bsc --help`.

This CLI uses a player configuration object to interact with your player(s). To configure the CLI to interact with a player, refer to [configuring players locally](#configuring-players-locally). 

A list of commands and their structure can be seen by typing `bsc`, `bsc -h` or `bsc --help`. There's also a table of the currently supported features and their command structure below in the [features](#features) section.


## Features

| Feature | Implemented? | Function | Usage |
| --------- | ---- | ------------------------ | -------------------------------------- |
| addplayer | [x] | Add player configuration to players.json | bsc addplayer \<playerName> \<ipAddress> [lDWS username] [lDWS password] |
| rmplayer | [x] | Remove player configuration from players.json | bsc rmplayer \<playerName> |
| editplayer | [x] | Edit an already existing player's info | bsc editplayer \<playerName> -i [playerIP] -u [playerUsername] -p [playerPassword] |
| listPlayers | [x] | List players and their configuration in players.json | bsc listplayers |
| getdi | [x] | Get device info in the form of a JSON object | bsc getdi \<playerName> | 
| putfile | [x] | Put file/files on a player. Specify a single file or a directory of files and the upload location (optional). Note that this only works when the player does not have a password set. The location option is exclusively a directory, not the filename it will be stored as | bsc putfile \<playerName> \<File/Directory> [location] |
| getfiles | [x] | get the files on the player's SD card or in a certain directory | bsc getfiles \<playerName> [path] |
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
