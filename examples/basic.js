var mp3dat = require('../index.js');
mp3dat.stat('../test/test.mp3', function(err, stats){
    console.log(stats);
});