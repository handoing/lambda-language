const fs = require('fs');
const InputStream = require('./inputStream.js');
const TokenStream = require('./tokenStream.js');
const Parse = require('./parse.js');
const Environment = require('./environment.js');
const { evaluate, Execute } = require('./evaluate.js');

const args = process.argv.splice(2);
const entryFilePath = args[0];

const code = fs.readFileSync(entryFilePath).toString();

const input = new InputStream(code);
const token = new TokenStream(input);
const { ast } = new Parse(token);

console.log(JSON.stringify(ast, null, 2));

const globalEnv = new Environment();

globalEnv.def('print', function (k, val) {
  console.log(val);
  k(false);
});

globalEnv.def('halt', function (k) {});

globalEnv.def('sleep', function (k, milliseconds) {
  setTimeout(function () {
    Execute(k, [false]);
  }, milliseconds);
});

globalEnv.def('twice', function (k, a, b) {
  k(a);
  k(b);
});

globalEnv.def('time', function (k, fn) {
  var t1 = Date.now();
  fn(function (ret) {
    var t2 = Date.now();
    console.log('Time: ' + (t2 - t1) + 'ms');
    k(ret);
  });
});

globalEnv.def('CallCC', function (k, f) {
  f(k, function CC(discarded, ret) {
    k(ret);
  });
});

console.log('输出:');
Execute(evaluate, [
  ast,
  globalEnv,
  function (result) {
    console.log('*** Result:', result);
  },
]);
