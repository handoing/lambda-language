const fs = require("fs");
const InputStream = require('./inputStream.js');
const TokenStream = require('./tokenStream.js');
const Parse = require('./parse.js');
const Environment = require('./environment.js');
const { evaluate } = require('./evaluate.js');

const args = process.argv.splice(2);
const entryFilePath = args[0];

const code = fs.readFileSync(entryFilePath).toString();

const input = new InputStream(code);
const token = new TokenStream(input);
const { ast } = new Parse(token);

console.log(JSON.stringify(ast, null, 2));

const globalEnv = new Environment();

globalEnv.def("print", function(val) {
  console.log(val);
});

globalEnv.def("fibJS", function fibJS(n){
  if (n < 2) return n;
  return fibJS(n - 1) + fibJS(n - 2);
});

globalEnv.def("time", function(fn){
  var t1 = Date.now();
  var ret = fn();
  var t2 = Date.now();
  console.log("Time: " + (t2 - t1) + "ms");
  return ret;
});

console.log('输出:');
evaluate(ast, globalEnv);


