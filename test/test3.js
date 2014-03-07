'use strict';
var Calc = require("../calculator");
var myexpr = new Calc("(a+b) * (c - d)");
var obj = {
    a: 1,
    b: 2,
    c: 3,
    d: 4
};
console.log(myexpr.calc(obj));
