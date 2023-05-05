# BrightSign Node CLI Local DWS APIs

The purpose of this module is to allow users to communicate with the BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs.

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm i
```

Latest Local DWS REST APO Documentation as of May 5th, 2023.
[Local DWS APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs)

## Installing NPM Module from source

The following will need to be run to build the npm module: 

```bash
npm -g install
```

## Usage

Example 1:
```bash
bsc -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/info"
```

Example 1:
```bash
bsc -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/files/sd"
```