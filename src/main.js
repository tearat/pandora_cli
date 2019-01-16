// Pandora
// CLI database
// v0.00001

const {Pandora} = require('./pandora');

const endpoint = './src/data/data.json';

let pandora = new Pandora(endpoint);

pandora.terminal();