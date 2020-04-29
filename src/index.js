const fs = require("fs");
const InputStream = require('./inputStream.js');
const TokenStream = require('./tokenStream.js');
const Parse = require('./parse.js');

const args = process.argv.splice(2);
const entryFilePath = args[0];

const code = fs.readFileSync(entryFilePath).toString();

const input = new InputStream(code);
const token = new TokenStream(input);
const { ast } = new Parse(token);

console.log(JSON.stringify(ast));


