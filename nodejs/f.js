var JsForth = require('../lib/jsForth.js');

//var stdin = process.openStdin();
//require('tty').setRawMode(true);
//
//stdin.on('keypress', function (chunk, key) {
//  process.stdout.write('Get Chunk: ' + chunk + '\n');
//  if (key && key.ctrl && key.name == 'c') process.exit();
//});

process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);

//process.stdin.on('readable', function() {
//  var chunk = process.stdin.read();
//  if (chunk !== null) {
//    if ( chunk[0] === '\u0003' ) {
//       process.exit();
//    }
//    process.stdout.write(chunk[0]);
//  }
//});

var cOut = function (c) {
    var s = String.fromCharCode(c);
    process.stdout.write(s);
};

var lOut = function (arg) {
    console.log(arg);
};

var kIn = function () {
    process.stdin.resume();
    var fs = require('fs');
    var response = fs.readSync(process.stdin.fd, 100, 0, "utf8");
    process.stdin.pause();

    var c = response[0].charCodeAt(0);
    return c;
}

var jsForth = new JsForth(lOut, cOut, kIn);
console.log("Will never reach that point");
