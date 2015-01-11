var JsForth = require('../../lib/jsForth.js');
$(document).ready(function () {
    var t = $('#term').terminal(function(command, term) {
        term.echo(command);
    }, {
        greetings: 'jsForth',
        name: 'jsForth',
        height: 500,
        prompt: '',
        keypress: function (ev, term) {
            console.log(ev);
            var e = jQuery.Event("forthKey");
            t.trigger(e);
//            var c = String.fromCharCode(ev.charCode);
//            term.insert(c);
            return false;
        },
        keydown: function (ev, term) {
            if (ev.keyCode === 13) {
                term.insert('\n');
                return false;
            }
            return true;
    }});

    var cOut = function (c) {
        t.insert(String.fromCharCode(c));
    };
    var lOut = function (arg) {
        t.insert(arg);
    };
    var kIn = function () {
        t.resume();
        console.log('reading the key');
        t.pause();
        return ' ';
    };

    t.on("forthKey", function () {
        console.log("event was there");
    });

//    t.pause();

    console.log("STARTING THE BEAST");
//  var jsForth = new JsForth(lOut, cOut, kIn);
});
