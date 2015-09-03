var keypress = require('keypress');
var JsForth = require('../lib/jsForth.js');
var fs = require('fs');

var sourceFiles = process.argv.splice(2, 99);
sourceFiles.unshift('../lib/kernel.f');

console.log(sourceFiles);

var inputStream = "";

sourceFiles.forEach(function(fileName) {
  console.log('Reading', fileName);

  try {
  var data = fs.readFileSync(fileName);
  } catch (e) {
    console.error(fileName, 'not found');
    console.error('Exiting!');
    process.exit();
  };

  for (var i = 0; i < data.length; i++) {
      var charCode = String.fromCharCode(data[i]);
      inputStream += charCode;
  };
});

var jsForth = new JsForth(
  function lOut(arg) {
    process.stdout.write(arg);
  }
  , function cOut(c) {
    var s = String.fromCharCode(c);
    if (c == 13) {
      process.stdout.write('\n');
    }
    process.stdout.write(s);
  }
);

keypress(process.stdin);

process.stdin.on('keypress', function(ch, key) {

  if (key && key.ctrl && key.name == 'c') {
    process.stdin.pause();
  }

//  if (key && key.name == 'return') {
//    process.stdout.write('\n');
//    ch += '\n';
//  }

//  console.log('pushing', ch);
  jsForth.pushIntoInputBuffer(ch);
});

process.stdin.setRawMode(true);
process.stdin.resume();

// process.stdin.on('readable', function() {
//   var chunk = process.stdin.read();
//   if (chunk !== null) {
//       var c = "";
//       for (var i = 0; i < chunk.length; i++) {
//           var w = String.fromCharCode(chunk[i]);
//           c += w;
//       };
//       jsForth.pushIntoInputBuffer(c);
//   }
// });

jsForth.pushIntoInputBuffer(inputStream);
