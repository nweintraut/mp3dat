// to use try :
// cat ../test/test.mp3 | node stdin_stream.js 82989
// the argument (82969) is the size in bytes of the mp3

if(!process.argv[2]) {
    process.stderr.write('\nNeed mp3 size in bytes\n\n');
    process.exit();
}
var mp3dat = require('./lib');
process.stdin.resume();
mp3dat.stat({stream : process.stdin, size: process.argv[2]});



