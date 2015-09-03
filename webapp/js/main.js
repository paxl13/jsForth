$(document).ready(function () {
    var JsForth = require('../../lib/jsForth.js');
    var kernelF = require('fs').readFileSync(__dirname + '/../../lib/kernel.f', 'utf8');
    var console = require('fs').readFileSync(__dirname + '/../../lib/console.f', 'utf8');
    var mandel = require('fs').readFileSync(__dirname + '/../../lib/mandelbroth.f', 'utf8');

    var jsForth = null;

    var bufferedStr = ""

    var outputBufferedStr = function () {
        t.echo(bufferedStr);
        bufferedStr = "";
    };

    var t = $('#term').terminal(function(command, term) {
        jsForth.pushIntoInputBuffer(command + '\n');
        if (bufferedStr !== "") {
            outputBufferedStr();
        }
    }, {
        greetings: 'starting jsForth...',
        name: 'jsForth',
        height: 500,
        prompt: 'forth> '
    });

    var cOut = function (c) {
        if (c === 13) {
            outputBufferedStr();
        } else {
            bufferedStr += String.fromCharCode(c)
        };
    };
    var lOut = function (arg) {
        t.echo(arg);
    };

    jsForth = new JsForth(lOut, cOut);
    t.echo("Loading forth kernel...");
    jsForth.pushIntoInputBuffer(kernelF);
    jsForth.pushIntoInputBuffer(console);
    jsForth.pushIntoInputBuffer(mandel);
});
