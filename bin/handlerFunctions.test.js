const { describe, test, expect } = require("@jest/globals");
const { 
  generatePlayersJson,
  checkConfigExists,
  getConfigPath,
} = require("./handlerFunctions");
const { cwd } = require('process');
const { promises } = require('fs');
const path = require('path'); // for absolute path

const fsp = promises;

beforeAll(async () => {
    const defaultPlayer = JSON.stringify({"testPlayer": {username: 'admin', password: '', storage: 'sd'}}, null, 2);
    await fsp.mkdir(path.join('.bsc'), { recursive: true });
    await fsp.writeFile(path.join(cwd(), '.bsc', 'players.json'), defaultPlayer);
});

describe('checkConfigExists', () => {

});

describe('generatePlayersJson', () => {
    it('should return a JSON object', () => { 
        const players = generatePlayersJson();
        expect(players).toBeInstanceOf(Object);
    });
    
    it('should determine config file does exist', () => {
        const configFileExists = checkConfigExists();
        expect(configFileExists).toBeTruthy();
    });

    it('should determine config file path', () => {
      const configFilePath = getConfigPath();
      console.log(typeof configFilePath instanceof String);
      expect(configFilePath).toMatch(/.bsc\/players.json/);
    });
});

afterAll(async () => {
    await fsp.unlink(path.join(cwd(), '.bsc', 'players.json'));
});