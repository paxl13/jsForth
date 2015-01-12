$(document).ready(function () {
    var JsForth = require('../../lib/jsForth.js');
    var kernelF = require('fs').readFileSync(__dirname + '/../../lib/kernel.f', 'utf8');

    console.log("STARTING THE BEAST");
    var jsForth = null;

    var t = $('#term').terminal(function(command, term) {
        jsForth.pushIntoInputBuffer(command + '\n');
    }, {
        greetings: 'jsForth',
        name: 'jsForth',
        height: 500,
        prompt: 'forth> '
    });

    var cOut = function (c) {
//        t.insert(String.fromCharCode(c));
        t.echo(String.fromCharCode(c));
    };
    var lOut = function (arg) {
        t.echo(arg);
    };

    jsForth = new JsForth(lOut, cOut);
    jsForth.pushIntoInputBuffer(kernelF);
});
