var JsForth = require('../lib/jsForth.js');

//var stdin = process.openStdin();
//require('tty').setRawMode(true);
//
//stdin.on('keypress', function (chunk, key) {
//  process.stdout.write('Get Chunk: ' + chunk + '\n');
//  if (key && key.ctrl && key.name == 'c') process.exit();
//});

//process.stdin.setEncoding('utf8');
//process.stdin.setRawMode(true);

//process.stdin.on('readable', function() {
//  var chunk = process.stdin.read();
//  if (chunk !== null) {
//    if ( chunk[0] === '\u0003' ) {
//       process.exit();
//    }
//    process.stdout.write(chunk[0]);
//  }
//});

var fs = require('fs');
var data = fs.readFileSync('../lib/kernel.f');
var dPtr = 0;
var dDone = false;

var cOut = function (c) {
    var s = String.fromCharCode(c);
    process.stdout.write(s);
};

var lOut = function (arg) {
    process.stdout.write(arg);
}

var jsForth = new JsForth(lOut, cOut);

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
      var c = "";
      for (var i = 0; i < chunk.length; i++) {
          var w = String.fromCharCode(chunk[i]);
          c += w;
      };
      jsForth.pushIntoInputBuffer(c);
  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});

debugger;
var sss = "";
for (var i = 0; i < data.length; i++) {
    var ww = String.fromCharCode(data[i]);
    sss += ww;
};

jsForth.pushIntoInputBuffer(sss);
