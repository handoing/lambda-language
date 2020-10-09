var STACKLEN;

function GUARD(f, args) {
  if (--STACKLEN < 0) throw new Continuation(f, args);
}

function Continuation(f, args) {
  this.f = f;
  this.args = args;
}

function Execute(f, args) {
  while (true)
    try {
      STACKLEN = 200;
      return f.apply(null, args);
    } catch (ex) {
      if (ex instanceof Continuation) (f = ex.f), (args = ex.args);
      else throw ex;
    }
}

function evaluate(exp, env, callback) {
  GUARD(evaluate, arguments);
  switch (exp.type) {
    case 'num':
    case 'str':
    case 'bool':
      callback(exp.value);
      return;

    case 'var':
      callback(env.get(exp.value));
      return;

    case 'assign':
      if (exp.left.type != 'var') throw new Error('Cannot assign to ' + JSON.stringify(exp.left));
      evaluate(exp.right, env, function CC(right) {
        GUARD(CC, arguments);
        callback(env.set(exp.left.value, right));
      });
      return;

    case 'binary':
      evaluate(exp.left, env, function CC(left) {
        GUARD(CC, arguments);
        evaluate(exp.right, env, function CC(right) {
          GUARD(CC, arguments);
          callback(apply_op(exp.operator, left, right));
        });
      });
      return;

    case 'let':
      (function loop(env, i) {
        GUARD(loop, arguments);
        if (i < exp.vars.length) {
          var v = exp.vars[i];
          if (v.def) {
            evaluate(v.def, env, function CC(value) {
              GUARD(CC, arguments);
              var scope = env.extend();
              scope.def(v.name, value);
              loop(scope, i + 1);
            });
          } else {
            var scope = env.extend();
            scope.def(v.name, false);
            loop(scope, i + 1);
          }
        } else {
          evaluate(exp.body, env, callback);
        }
      })(env, 0);
      return;

    case 'lambda':
      callback(make_lambda(env, exp));
      return;

    case 'if':
      evaluate(exp.cond, env, function CC(cond) {
        GUARD(CC, arguments);
        if (cond !== false) evaluate(exp.then, env, callback);
        else if (exp.else) evaluate(exp.else, env, callback);
        else callback(false);
      });
      return;

    case 'prog':
      (function loop(last, i) {
        GUARD(loop, arguments);
        if (i < exp.prog.length)
          evaluate(exp.prog[i], env, function CC(val) {
            GUARD(CC, arguments);
            loop(val, i + 1);
          });
        else {
          callback(last);
        }
      })(false, 0);
      return;

    case 'call':
      evaluate(exp.func, env, function CC(func) {
        GUARD(CC, arguments);
        (function loop(args, i) {
          GUARD(loop, arguments);
          if (i < exp.args.length)
            evaluate(exp.args[i], env, function CC(arg) {
              GUARD(CC, arguments);
              args[i + 1] = arg;
              loop(args, i + 1);
            });
          else {
            func.apply(null, args);
          }
        })([callback], 0);
      });
      return;

    default:
      throw new Error("I don't know how to evaluate " + exp.type);
  }
}

function apply_op(op, a, b) {
  function num(x) {
    if (typeof x != 'number') throw new Error('Expected number but got ' + x);
    return x;
  }
  function div(x) {
    if (num(x) == 0) throw new Error('Divide by zero');
    return x;
  }
  switch (op) {
    case '+':
      return num(a) + num(b);
    case '-':
      return num(a) - num(b);
    case '*':
      return num(a) * num(b);
    case '/':
      return num(a) / div(b);
    case '%':
      return num(a) % div(b);
    case '&&':
      return a !== false && b;
    case '||':
      return a !== false ? a : b;
    case '<':
      return num(a) < num(b);
    case '>':
      return num(a) > num(b);
    case '<=':
      return num(a) <= num(b);
    case '>=':
      return num(a) >= num(b);
    case '==':
      return a === b;
    case '!=':
      return a !== b;
  }
  throw new Error("Can't apply operator " + op);
}

function make_lambda(env, exp) {
  if (exp.name) {
    env = env.extend();
    env.def(exp.name, lambda);
  }
  function lambda(callback) {
    GUARD(lambda, arguments);
    var names = exp.vars;
    var scope = env.extend();
    for (var i = 0; i < names.length; ++i)
      scope.def(names[i], i + 1 < arguments.length ? arguments[i + 1] : false);
    evaluate(exp.body, scope, callback);
  }
  return lambda;
}

module.exports = {
  evaluate,
  Execute,
};
