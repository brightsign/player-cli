# BrightSign CLI API Tool

The purpose of this package is to allow users to communicate with the BrightSign's Local DWS (Diagnostic Web Server) REST HTTP APIs through a simple CLI tool, `bsc`. 

It is assumed you have the requirements for doing basic node.js development already installed.  To support this example, you also need to run the following in this folder:

```bash
npm i
```

Latest Local DWS REST APO Documentation as of May 5th, 2023.
[Local DWS APIs](https://brightsign.atlassian.net/wiki/spaces/DOC/pages/1172734089/Local+DWS+APIs)

## Installing NPM Module from source

The following will need to be run to build the npm module. `bsc` will be built and ready to use. 

```bash
npm -g install
bsc
```

## Usage

Note: By default, `bsc` will return the response `{data: {result: {...}}}`. To retrieve the raw HTTP Response add the `-a=true` argument.

Example 1:
```bash
bsc -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/info"
```

Example 1:
```bash
bsc -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/files/sd"
```

## Formatting Responses

Install the tool [jq](https://stedolan.github.io/jq/download/) to prettify the JSON response structures.

### jq examples

Parse the keys:
```bash
bsc -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/info" | jq 'keys'
```

Prettify the entire response: 
```bash
bsc -i=192.168.128.101 -p=XAE28N000058 -m=GET -r="/info" | jq '.data.result'
```

Parse the model from /info
```bash
bsc -i=192.168.128.101 -p=ABC01A000001 -m=GET -r="/info" | jq '.data.result.model'
```