Calculator
==========

A nodejs calculator module

!!! this module is totally not tested, don't use in serious  project. !!!

Pull request welcome.

goodluck && have fun.


Usage
=====

1. As a very simple calculator

```javascript
    'use strict';
    var Calc = require("../calculator");
    var myexpr = new Calc("1+2");
    console.log(myexpr.calc());
```

2. Calc with simple object parameters

```javascript
    'use strict';
    var Calc = require("../calculator");
    var myexpr = new Calc("a+b");
    var obj = {
        a: 1,
        b: 2
    };
    console.log(myexpr.calc(obj));
```

3. Expression can be much complex

```javascript
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
```

4. Support bool expression

```javascript
    'use strict';
    var Calc = require("../calculator");
    var myexpr = new Calc("(a+b) == (c - d)");
    var obj = {
        a: 1,
        b: 2,
        c: 3,
        d: 4
    };
    console.log(myexpr.calc(obj));
```

4. Support array expression

```javascript
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
```

5. support complex object

```javascript
    'use strict';
    var Calc = require("../calculator");
    var myexpr = new Calc("((a+b) == (c - d)) && (e in [1,2,3,4]) && (f.e in f.arr)");
    var obj = {
        a: 1,
        b: 2,
        c: 3,
        d: 0,
        e: 4,
        f: {
            arr: [1, 2, 3, 4],
            e  : 1
        }
    };
    console.log(myexpr.calc(obj));
```

Operator Support
================

```text
        '(' 
        ')' 
        '.' 
        '^' 
        '*' 
        '%' 
        '/' 
        '+' 
        '-' 
        '-n'
        '=='
        '!='
        '>' 
        '<' 
        '>='
        '<='
        '@' 
        '&&',
        '||'
        'in'
```

Data Type Support
=================

* int
* float
* string
* bool
* array
* object
* undefine
