'use strict';
/*jslint vars:true, plusplus:true, node:true*/
/*
  reference: http://zh.wikipedia.org/wiki/%E8%B0%83%E5%BA%A6%E5%9C%BA%E7%AE%97%E6%B3%95
  reference: http://zh.wikipedia.org/wiki/%E9%80%86%E6%B3%A2%E5%85%B0%E8%A1%A8%E7%A4%BA%E6%B3%95
*/
function Calculator(expr, v) {
    this.s_idle          = 1;
    this.s_string_single = 2;
    this.s_string_double = 3;
    this.s_array         = 4;
    this.s_number_int    = 5;
    this.s_number_float  = 6;
    this.s_comment       = 7;
    this.s_name          = 8;
    this.c_white_space   = [' ', '\r', '\n'];
    this.c_prefix        = '_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.c_digital       = '0123456789';
    this.c_comment       = '#';
    this.expr            = expr;
    this.rp              = null;
    this.error           = false;
    this.debug           = true;

    this.c_operator_prefix = '^().*%/+-=!><@&|i';
    this.operators = {
        '('  : {"priority": 1, "dir": "ltr", "opers" : 0},
        ')'  : {"priority": 1, "dir": "ltr", "opers" : 0},
        '.'  : {"priority": 1, "dir": "ltr", "opers" : 2, "calc": this.calc_dot},
        '^'  : {"priority": 3, "dir": "rtl", "opers" : 2, "calc": this.calc_power},
        '*'  : {"priority": 3, "dir": "ltr", "opers" : 2, "calc": this.calc_times},
        '%'  : {"priority": 3, "dir": "ltr", "opers" : 2, "calc": this.calc_div_int},
        '/'  : {"priority": 3, "dir": "ltr", "opers" : 2, "calc": this.calc_div},
        '+'  : {"priority": 4, "dir": "ltr", "opers" : 2, "calc": this.calc_plus},
        '-'  : {"priority": 4, "dir": "ltr", "opers" : 2, "calc": this.calc_sub},
        '-n' : {"priority": 4, "dir": "rtl", "opers" : 1, "calc": this.calc_neg},
        '==' : {"priority": 7, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_eq},
        '!=' : {"priority": 1, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_ne},
        '>'  : {"priority": 6, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_gt},
        '<'  : {"priority": 6, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_lt},
        '>=' : {"priority": 6, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_ge},
        '<=' : {"priority": 6, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_le},
        '@'  : {"priority": 6, "dir": "ltr", "opers" : 2, "calc": this.calc_string_match},
        '&&' : {"priority": 11, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_and},
        '||' : {"priority": 12, "dir": "ltr", "opers" : 2, "calc": this.calc_bool_or},
        'in' : {"priority": 13, "dir": "ltr", "opers" : 2, "calc": this.calc_array_in}
    };
    try {
        var tokens  = this.pass1(this.expr, this.vars);
        this.rp = this.pass2(tokens);
    } catch (error) {
        this.error = true;
        this.rp = '';
    }
    this.result = null;
}

Calculator.prototype.calc = function (v) {
    if (!v) { v = {}; }
    this.vars = v;
    var rp = this.rp.concat();
    var result;
    try {
        result  = this.pass3(rp);
    } catch (error) {
        result = {type: "value", data_type: "bool", token: "false"};
    }

    switch (result.data_type) {
    case 'int':
        this.result = parseInt(result.token, 10);
        break;
    case 'float':
        this.result = parseFloat(result.token, 10);
        break;
    case 'bool':
        this.result = result.token === 'true';
        break;
    default:
        this.result = result.token;
    }
    return this.result;
};
Calculator.prototype.match = function (v) {
    return this.match(v);
};
Calculator.prototype.throw_error = function (err, ch, pos) {
    this.error = true;
    throw new Error(err + ":[ " + ch + " ]  at:" + pos);
};
Calculator.prototype.ensure = function (expr) {
    if (!expr) { throw new Error(expr); }
};
Calculator.prototype.get_var = function (token, obj) {
    if (!obj) {
        obj   = this.vars;
    }
    var result;
    this.ensure(token.data_type === 'name');
    var v = obj[token.token];
    switch (typeof v) {
    case "string":
        result = {"type": "value", "data_type" : "string", "token": v};
        break;
    case "number":
        var re = new RegExp(/^(-|\+)?\d+$/);
        if (re.test(v.toString())) {
            result = {"type": "value", "data_type" : "int", "token": v};
        } else {
            result = {"type": "value", "data_type" : "float", "token": v};
        }
        break;
    case "boolean":
        result = {"type": "value", "data_type" : "bool", "token": v};
        break;
    case "object":
        if (Array.isArray(v)) {
            result = {"type": "value", "data_type" : "array", "token": v};
        } else {
            result = {"type": "value", "data_type" : "object", "token": v};
        }
        break;
    default:
        result = {"type": "value", "data_type" : "undefine", "token": "undefine"};
    }
    if (this.debug) { console.log(token.token, '=', result.token); }
    return result;
};
Calculator.prototype.calc_dot = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    v1 = t1.token;
    this.ensure((t1.data_type === 'object') && (t2.data_type === 'name'));
    v2 = t2.token;
    result = this.get_var(t2, t1.token);
    v = result.token;
    if (this.debug) { console.log(v1, '.', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_plus = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    if ((['float', 'int'].indexOf(t1.data_type) !== -1)
                || (['float', 'int'].indexOf(t2.data_type) !== -1)) {
        if ((t1.data_type === 'float') || (t2.data_type === 'float')) {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 + v2;
            result = {
                "type"      : "value",
                "data_type" : "float",
                "token"     : v.toString()
            };
        } else {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 + v2;
            result = {
                "type"      : "value",
                "data_type" : "int",
                "token"     : v.toString()
            };
        }
    } else if ((t1.data_type === 'string') || (t2.data_type === 'string')) {
        v1 = t1.token;
        v2 = t2.token;
        v  = v1 + v2;
        result = {
            "type"      : "value",
            "data_type" : "string",
            "token"     : v.toString()
        };
    } else {
        this.throw_error('unexcept  data type', t1, t2);
    }
    if (this.debug) { console.log(v1, '+', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_times = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    if ((['float', 'int'].indexOf(t1.data_type) !== -1)
                || (['float', 'int'].indexOf(t2.data_type) !== -1)) {
        if ((t1.data_type === 'float') || (t2.data_type === 'float')) {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 * v2;
            result = {
                "type"      : "value",
                "data_type" : "float",
                "token"     : v.toString()
            };
        } else {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 * v2;
            result = {
                "type"      : "value",
                "data_type" : "int",
                "token"     : v.toString()
            };
        }
    } else {
        this.throw_error('unexcept  data type', t1, t2);
    }
    if (this.debug) { console.log(v1, '*', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_power = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    var i;
    if ((['float', 'int'].indexOf(t1.data_type) !== -1)
                || (['int'].indexOf(t1.data_type) !== -1)) {
        if (t1.data_type === 'float') {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v = 1;
            for (i = 0; i < v2; i++) {
                v  = v * v1;
            }
            result = {
                "type"      : "value",
                "data_type" : "float",
                "token"     : v.toString()
            };
        } else {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v = 1;
            for (i = 0; i < v2; i++) {
                v  = v * v1;
            }
            result = {
                "type"      : "value",
                "data_type" : "int",
                "token"     : v.toString()
            };
        }
    } else {
        this.throw_error('unexcept  data type', t1, t2);
    }
    if (this.debug) { console.log(v1, '^', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_div = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    if ((['float', 'int'].indexOf(t1.data_type) !== -1)
                || (['float', 'int'].indexOf(t2.data_type) !== -1)) {
        if ((t1.data_type === 'float') || (t2.data_type === 'float')) {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 / v2;
            result = {
                "type"      : "value",
                "data_type" : "float",
                "token"     : v.toString()
            };
        } else {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 / v2;
            result = {
                "type"      : "value",
                "data_type" : "float",
                "token"     : v.toString()
            };
        }
    } else {
        this.throw_error('unexcept  data type', t1, t2);
    }
    if (this.debug) { console.log(v1, '/', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_div_int = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    if (['float', 'int'].indexOf(t1.data_type) !== -1) {
        this.ensure(['float', 'int'].indexOf(t2.data_type) !== -1);
        v1 = parseFloat(t1.token, 10);
        v2 = parseFloat(t2.token, 10);
        v  = v1 / v2 | 0;
        result = {
            "type"      : "value",
            "data_type" : "int",
            "token"     : v.toString()
        };
    } else {
        this.throw_error('unexcept  data type', t1, t2);
    }
    if (this.debug) { console.log(v1, '%', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_sub = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    if ((['float', 'int'].indexOf(t1.data_type) !== -1)
                || (['float', 'int'].indexOf(t2.data_type) !== -1)) {
        if ((t1.data_type === 'float') || (t2.data_type === 'float')) {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 - v2;
            result = {
                "type"      : "value",
                "data_type" : "float",
                "token"     : v.toString()
            };
        } else {
            v1 = parseFloat(t1.token, 10);
            v2 = parseFloat(t2.token, 10);
            v  = v1 - v2;
            result = {
                "type"      : "value",
                "data_type" : "int",
                "token"     : v.toString()
            };
        }
    } else {
        this.throw_error('unexcept  data type', t1, t2);
    }
    if (this.debug) { console.log(v1, '-', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_neg = function (token, params) {
    var t1 = params[0];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (['float', 'int'].indexOf(t1.data_type) !== -1) {
        v1 = parseFloat(t1.token, 10);
        v  = -v1;
        result = {
            "type"      : "value",
            "data_type" : t1.data_type,
            "token"     : v.toString()
        };
    } else {
        this.throw_error('unexcept  data type', t1);
    }
    if (this.debug) { console.log('-', v1, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_eq = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    v1 = t1.token.toString();
    v2 = t2.token.toString();
    v  = v1 === v2;
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '==', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_ne = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    try {
        v1 = parseFloat(t1.token);
        v2 = parseFloat(t2.token);
        v = v1 !== v2;
    } catch (error) {
        v1 = t1.token.toString();
        v2 = t2.token.toString();
        v  = v1 !== v2;
    }
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '!=', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_gt = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    try {
        v1 = parseFloat(t1.token);
        v2 = parseFloat(t2.token);
        v = v1 > v2;
    } catch (error) {
        v1 = t1.token.toString();
        v2 = t2.token.toString();
        v  = v1 > v2;
    }

    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '>', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_lt = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    try {
        v1 = parseFloat(t1.token);
        v2 = parseFloat(t2.token);
        v = v1 < v2;
    } catch (error) {
        v1 = t1.token.toString();
        v2 = t2.token.toString();
        v  = v1 < v2;
    }
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '<', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_ge = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    try {
        v1 = parseFloat(t1.token);
        v2 = parseFloat(t2.token);
        v = v1 >= v2;
    } catch (error) {
        v1 = t1.token.toString();
        v2 = t2.token.toString();
        v  = v1 >= v2;
    }
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '>=', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_le = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    try {
        v1 = parseFloat(t1.token);
        v2 = parseFloat(t2.token);
        v = v1 <= v2;
    } catch (error) {
        v1 = t1.token.toString();
        v2 = t2.token.toString();
        v  = v1 <= v2;
    }
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '<=', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_string_match = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    this.ensure(t1.data_type === 'string' && t2.data_type === 'string');
    v1 = t1.token;
    v2 = t2.token;
    v = v1.match(v2);
    if (v) {
        v = true;
    } else {
        v = false;
    }
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '@', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_and = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    this.ensure(t1.data_type === 'bool' && t2.data_type === 'bool');
    v1 = t1.token.toString() === 'true';
    v2 = t2.token.toString() === 'true';
    v  = v1 && v2;
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '&&', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_array_in = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    this.ensure(['string', 'int', 'float'].indexOf(t1.data_type) !== -1
                && t2.data_type === 'array');
    v1 = t1.token.toString();
    v2 = t2.token;
    v  = v2.indexOf(v1);
    if (v < 0) {
        v  = v2.indexOf(v1.toString());
    }
    if (v < 0) {
        v  = v2.indexOf(parseFloat(v1, 10));
    }
    v = v >= 0;
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, 'in', v2, '=', v); }
    return result;
};
Calculator.prototype.calc_bool_or = function (token, params) {
    var t1 = params[0];
    var t2 = params[1];
    var v, v1, v2, result;
    this.ensure((t1.type === 'value') && (t2.type === 'value'));
    if (t1.data_type === 'name') {
        t1 = this.get_var(t1);
    }
    if (t2.data_type === 'name') {
        t2 = this.get_var(t2);
    }
    this.ensure(t1.data_type === 'bool' && t2.data_type === 'bool');
    v1 = t1.token.toString() === 'true';
    v2 = t2.token.toString() === 'true';
    v  = v1 || v2;
    result = {
        "type"      : "value",
        "data_type" : "bool",
        "token"     : v.toString()
    };
    if (this.debug) { console.log(v1, '||', v2, '=', v); }
    return result;
};
Calculator.prototype.pass1 = function (expr) {
    expr = expr + ' ';
    var stack = [];
    var token = '';
    var state = this.s_idle;
    var pos   = 0;
    var last_is_white_space = false;
    while (pos < expr.length) {
        var ch = expr[pos];
        switch (state) {
        case this.s_idle:
            if (this.c_white_space.indexOf(ch) !== -1) {
                // white space, nothing to do
                pos++;
            } else if (ch === '"') {
                token = '';
                state = this.s_string_double;
                pos++;
            } else if (ch === "'") {
                token = '';
                state = this.s_string_single;
                pos++;
            } else if (ch === '[') {
                token = '';
                state = this.s_array;
                pos++;
            } else if (this.c_digital.indexOf(ch) !== -1) {
                token = ch;
                state = this.s_number_int;
                pos++;
            } else if (this.c_prefix.indexOf(ch) !== -1) {
                token = ch;
                state = this.s_name;
                pos++;
            } else if (this.c_comment.indexOf(ch) !== -1) {
                token = '';
                state = this.s_comment;
                pos++;
            } else if (this.c_operator_prefix.indexOf(ch) !== -1) {
                if (ch === '(') {
                    stack.push({"type": "left_brace", "token": ch});
                } else if (ch === ')') {
                    stack.push({"type": "right_brace", "token": ch});
                } else {
                    var ch2 = expr[pos + 1];
                    if (this.operators[ch]) {
                        stack.push({"type": "operator", "token": ch});
                    } else if (this.operators[ch + ch2]) {
                        stack.push({"type": "operator", "token": ch + ch2});
                        pos++;
                    }
                }
                if (ch === '-') {
                    var last_token = stack[stack.length - 2];
                    if (last_token && (["right_brace", "value"].indexOf(last_token.type) === -1)) {
                        stack[stack.length - 1].token = '-n';
                    }
                }
                token = '';
                pos++;
            } else {
                this.throw_error('unexcept char:', ch, pos);
            }
            break;
        case this.s_number_int:
            if (this.c_digital.indexOf(ch) !== -1) {
                token = token + ch;
                pos++;
            } else if (ch === '.') {
                token = token + ch;
                state = this.s_number_float;
            } else {
                stack.push({"type": "value", "data_type" : "int", "token": token});
                state = this.s_idle;
            }
            break;
        case this.s_number_float:
            if (this.c_digital.indexOf(ch) !== -1) {
                token = token + ch;
                pos++;
            } else {
                stack.push({"type": "value", "data_type" : "float", "token": token});
                state = this.s_idle;
            }
            break;
        case this.s_string_single:
            if (ch === "'") {
                stack.push({"type": "value", "data_type" : "string", "token": token});
                state = this.s_idle;
                pos++;
            } else {
                token = token + ch;
                pos++;
            }
            break;
        case this.s_string_double:
            if (ch === '"') {
                stack.push({"type": "value", "data_type" : "string", "token": token});
                state = this.s_idle;
                pos++;
            } else {
                token = token + ch;
                pos++;
            }
            break;
        case this.s_array:
            if (ch === ']') {
                token = token.replace(/"/g, "");
                token = token.split(',');
                var i;
                for (i = 0; i < token.length; i++) {
                    token[i] = token[i].trim();
                }
                stack.push({"type": "value", "data_type" : "array", "token": token});
                state = this.s_idle;
                pos++;
            } else {
                token = token + ch;
                pos++;
            }
            break;
        case this.s_comment:
            if (ch === '#') {
                stack.push({"type": "comment", "token": token});
                token = '';
                state = this.s_idle;
                pos++;
            } else {
                token = token + ch;
                pos++;
            }
            break;
        case this.s_name:
            if (this.c_prefix.indexOf(ch) !== -1) {
                token = token + ch;
                pos++;
            } else if (this.c_digital.indexOf(ch) !== -1) {
                token = token + ch;
                pos++;
            } else if (ch === '.') {
                stack.push({"type": "value", "data_type": "name", "token": token});
                stack.push({"type": "operator", "token": ch});
                token = '';
                state = this.s_idle;
                pos++;
            } else if (['true', 'false'].indexOf(token) !== -1) {
                stack.push({"type": "value", "data_type": "bool", "token": token});
                token = '';
                pos++;
                state = this.s_idle;
            } else if (token === 'in') {
                stack.push({"type": "operator", "token": token});
                token = '';
                pos++;
                state = this.s_idle;
            } else {
                stack.push({"type": "value", "data_type": "name", "token": token});
                token = '';
                state = this.s_idle;
            }
            break;
        }
    }
    return stack;
};
Calculator.prototype.pass2 = function (tokens) {
    var output = [];
    var stack  = [];
    var token;
    var pos = 0;
    while (pos < tokens.length) {
        token = tokens[pos];
        switch (token.type) {
        case "value":
            output.push(token);
            pos++;
            break;
        case "operator":
            var o1 = token;
            var o2 = null;
            if (stack.length > 0) {
                o2 = stack[stack.length - 1];
            }
            var p1 = null;
            var p2 = null;
            var o1_dir = '';
            var o2_dir = '';
            if (o2) {
                p1 = this.operators[o1.token].priority;
                p2 = this.operators[o2.token].priority;
                o1_dir = this.operators[o1.token].dir;
                o2_dir = this.operators[o2.token].dir;
            }
            while (o2 && (o2.type === 'operator') && (((o1_dir === 'ltr') && (p1 >= p2))
                                                      || ((o1_dir === 'rtl') && (p1 > p2)))) {
                output.push(stack.pop());
                if (stack.length > 0) {
                    o2 = stack[stack.length - 1];
                } else {
                    o2 = null;
                }
                if (o2) {
                    p2 = this.operators[o2.token].priority;
                }
            }
            stack.push(o1);
            pos++;
            break;
        case "left_brace":
            stack.push(token);
            pos++;
            break;
        case "right_brace":
            token = stack.pop();
            while ((stack.length > 0) && (token.type !== "left_brace")) {
                output.push(token);
                token = stack.pop();
            }
            if (token.type !== "left_brace") {
                this.throw_error('missing left brace', token, pos);
            }
            pos++;
            break;
        }
    }
    if (stack.length > 0) {
        token = stack[stack.length - 1];
        if (token.type === 'left_brace') {
            this.throw_error('mismatch brace', token, 'end');
        } else {
            while (stack.length > 0) {
                output.push(stack.pop());
            }
        }
    }
    return output.reverse();
};
Calculator.prototype.do_token_calc = function (token, params) {
    params.reverse();
    return this.operators[token.token].calc.bind(this)(token, params);
};
Calculator.prototype.pass3 = function (stack) {
    var result = [];
    var token;
    while (stack.length > 0) {
        token = stack.pop();
        if (token.type === 'value') {
            result.push(token);
        } else if (token.type === 'operator') {
            if (result.length < this.operators[token.token].opers) {
                this.throw_error('not enough operator');
            } else {
                var i;
                var params = [];
                var param_num = this.operators[token.token].opers;
                for (i = 0; i < param_num; i++) {
                    params.push(result.pop());
                }
                var v = this.do_token_calc(token, params);
                result.push(v);
            }
        }
    }
    return result[0];
};
Calculator.prototype.get_rpolish_string = function () {
    if (!this.rp) { return ""; }
    var i;
    var result = '';
    for (i = 0; i < this.rp.length; i++) {
        result = result + this.rp[i].token;
    }
    return result;
};

module.exports = Calculator;
