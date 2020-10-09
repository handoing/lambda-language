const keywords = ' let if then else lambda λ true false ';

function is_keyword(x) {
  return keywords.indexOf(' ' + x + ' ') >= 0;
}
function is_digit(ch) {
  return /[0-9]/i.test(ch);
}
function is_id_start(ch) {
  return /[a-zλ_]/i.test(ch);
}
function is_id(ch) {
  return is_id_start(ch) || '?!-<>=0123456789'.indexOf(ch) >= 0;
}
function is_op_char(ch) {
  return '+-*/%=&|<>!'.indexOf(ch) >= 0;
}
function is_punc(ch) {
  return ',;(){}[]'.indexOf(ch) >= 0;
}
function is_whitespace(ch) {
  return ' \t\n'.indexOf(ch) >= 0;
}

class TokenStream {
  constructor(input) {
    this.input = input;
    this.current = null;
  }
  next() {
    const tok = this.current;
    this.current = null;
    return tok || this.read_next();
  }
  peek() {
    return this.current || (this.current = this.read_next());
  }
  eof() {
    return this.peek() == null;
  }
  croak(msg) {
    this.input.croak(msg);
  }
  read_while(predicate) {
    let str = '';
    let input = this.input;
    while (!input.eof() && predicate(input.peek())) str += input.next();
    return str;
  }
  read_number() {
    let has_dot = false;
    let number = this.read_while(function (ch) {
      if (ch == '.') {
        if (has_dot) return false;
        has_dot = true;
        return true;
      }
      return is_digit(ch);
    });
    return { type: 'num', value: parseFloat(number) };
  }
  read_ident() {
    let id = this.read_while(is_id);
    return {
      type: is_keyword(id) ? 'kw' : 'var',
      value: id,
    };
  }
  read_escaped(end) {
    let escaped = false,
      str = '';
    let input = this.input;
    input.next();
    while (!input.eof()) {
      let ch = input.next();
      if (escaped) {
        str += ch;
        escaped = false;
      } else if (ch == '\\') {
        escaped = true;
      } else if (ch == end) {
        break;
      } else {
        str += ch;
      }
    }
    return str;
  }
  read_string() {
    return { type: 'str', value: this.read_escaped('"') };
  }
  skip_comment() {
    this.read_while(function (ch) {
      return ch != '\n';
    });
    this.input.next();
  }
  read_next() {
    let input = this.input;
    this.read_while(is_whitespace);
    if (input.eof()) return null;
    let ch = input.peek();
    if (ch == '#') {
      this.skip_comment();
      return this.read_next();
    }
    if (ch == '"') return this.read_string();
    if (is_digit(ch)) return this.read_number();
    if (is_id_start(ch)) return this.read_ident();
    if (is_punc(ch))
      return {
        type: 'punc',
        value: input.next(),
      };
    if (is_op_char(ch))
      return {
        type: 'op',
        value: this.read_while(is_op_char),
      };
    input.croak("Can't handle character: " + ch);
  }
}

module.exports = TokenStream;
