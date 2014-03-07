'use strict';
var Calc = require('../calculator.js');
//var filter = new Calc('(obj.value in ["b", 200]) && ("abc" in obj.arr)');
var filter = new Calc('obj.value in [100, 200]');
console.log(filter.match({
    obj: {
        name: {
            str: "abc"
        },
        value : 200,
        v : 2,
        arr : [100, 200, "abc"]
    }
}));

// var filter = new Calc('((id == "*") && ((code==100) || (code==200)))');
// console.log(filter.match({id: "*", code: 200}));
