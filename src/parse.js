const PRECEDENCE = {
  "=": 1,
  "||": 2,
  "&&": 3,
  "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
  "+": 10, "-": 10,
  "*": 20, "/": 20, "%": 20,
};
const FALSE = { type: "bool", value: false };

class Parse {
  constructor(input) {
    this.input = input;
    this.ast = this.parse_toplevel();
  }
  is_punc(ch) {
    let tok = this.input.peek();
    return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
  }
  is_kw(kw) {
    let tok = this.input.peek();
    return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
  }
  is_op(op) {
    let tok = this.input.peek();
    return tok && tok.type == "op" && (!op || tok.value == op) && tok;
  }
  skip_punc(ch) {
    if (this.is_punc(ch)) this.input.next();
    else this.input.croak("Expecting punctuation: \"" + ch + "\"");
  }
  skip_kw(kw) {
    if (this.is_kw(kw)) this.input.next();
    else this.input.croak("Expecting keyword: \"" + kw + "\"");
  }
  skip_op(op) {
    if (this.is_op(op)) this.input.next();
    else this.input.croak("Expecting operator: \"" + op + "\"");
  }
  unexpected() {
    this.input.croak("Unexpected token: " + JSON.stringify(this.input.peek()));
  }
  maybe_binary(left, my_prec) {
    let tok = this.is_op();
    if (tok) {
        let his_prec = PRECEDENCE[tok.value];
        if (his_prec > my_prec) {
            this.input.next();
            return this.maybe_binary({
                type     : tok.value == "=" ? "assign" : "binary",
                operator : tok.value,
                left     : left,
                right    : this.maybe_binary(this.parse_atom(), his_prec)
            }, my_prec);
        }
    }
    return left;
  }
  delimited(start, stop, separator, parser) {
    let self = this;
    let a = [], first = true;
    this.skip_punc(start);
    while (!this.input.eof()) {
        if (this.is_punc(stop)) break;
        if (first) first = false; else this.skip_punc(separator);
        if (this.is_punc(stop)) break;
        a.push(parser.call(self));
    }
    this.skip_punc(stop);
    return a;
  }
  parse_call(func) {
    return {
        type: "call",
        func: func,
        args: this.delimited("(", ")", ",", this.parse_expression),
    };
  }
  parse_varname() {
    let name = this.input.next();
    if (name.type != "var") this.input.croak("Expecting variable name");
    return name.value;
  }
  parse_vardef() {
    let name = this.parse_varname(), def;
    if (this.is_op("=")) {
        this.input.next();
        def = this.parse_expression();
    }
    return { name: name, def: def };
  }
  parse_let() {
    this.skip_kw("let");
    if (this.input.peek().type == "var") {
        const name = this.input.next().value;
        const defs = this.delimited("(", ")", ",", this.parse_vardef);
        return {
            type: "call",
            func: {
                type: "lambda",
                name: name,
                vars: defs.map(function(def) { return def.name }),
                body: this.parse_expression(),
            },
            args: defs.map(function(def){ return def.def || FALSE })
        };
    }
    return {
        type: "let",
        vars: this.delimited("(", ")", ",", this.parse_vardef),
        body: this.parse_expression(),
    };
  }
  parse_if() {
    this.skip_kw("if");
    let cond = this.parse_expression();
    if (!this.is_punc("{")) this.skip_kw("then");
    let then = this.parse_expression();
    let ret = {
        type: "if",
        cond: cond,
        then: then,
    };
    if (this.is_kw("else")) {
      this.input.next();
        ret.else = this.parse_expression();
    }
    return ret;
  }
  parse_lambda() {
    return {
        type: "lambda",
        name: this.input.peek().type == "var" ? this.input.next().value : null,
        vars: this.delimited("(", ")", ",", this.parse_varname),
        body: this.parse_expression()
    };
  }
  parse_bool() {
    return {
        type  : "bool",
        value : this.input.next().value == "true"
    };
  }
  maybe_call(expr) {
    expr = expr();
    return this.is_punc("(") ? this.parse_call(expr) : expr;
  }
  parse_atom() {
    return this.maybe_call(() => {
        if (this.is_punc("(")) {
            this.input.next();
            let exp = this.parse_expression();
            this.skip_punc(")");
            return exp;
        }
        if (this.is_punc("{")) return this.parse_prog();
        if (this.is_kw("let")) return this.parse_let();
        if (this.is_kw("if")) return this.parse_if();
        if (this.is_kw("true") || this.is_kw("false")) return this.parse_bool();
        if (this.is_kw("lambda") || this.is_kw("λ")) {
            this.input.next();
            return this.parse_lambda();
        }
        let tok = this.input.next();
        if (tok.type == "var" || tok.type == "num" || tok.type == "str")
            return tok;
        this.unexpected();
    });
  }
  parse_toplevel() {
    let prog = [];
    while (!this.input.eof()) {
        prog.push(this.parse_expression());
        if (!this.input.eof()) this.skip_punc(";");
    }
    return { type: "prog", prog: prog };
  }
  parse_prog() {
    let prog = this.delimited("{", "}", ";", this.parse_expression);
    if (prog.length == 0) return FALSE;
    if (prog.length == 1) return prog[0];
    return { type: "prog", prog: prog };
  }
  parse_expression() {
    return this.maybe_call(() => {
      return this.maybe_binary(this.parse_atom(), 0);
    });
  }
}

module.exports = Parse;