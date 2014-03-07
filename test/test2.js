'use strict';
var Calc = require("../calculator");
var myexpr = new Calc("a+b");
var obj = {
    a: 1,
    b: 2
};
console.log(myexpr.calc(obj));
