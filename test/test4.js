'use strict';
var Calc = require("../calculator");
var myexpr = new Calc("((a+b) == (c - d)) && (e in [1,2,3,4])");
var obj = {
    a: 1,
    b: 2,
    c: 3,
    d: 0,
    e: 4
};
console.log(myexpr.calc(obj));
