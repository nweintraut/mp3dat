
var assert = require('assert');
var fs = require('fs');
var should = require('should');
var mp3dat = require('../index.js');
var mp3dat2 = mp3dat.spawnInstance();
var testFile = 'test/test.mp3';


assert(mp3dat, 'mp3dat failed to load');
assert(mp3dat.stat, 'there should be a stat method');
assert(mp3dat.stat instanceof Function, 'stat should be a Function');
// mp3dat.should.have.property('statStream');
// mp3dat.statStream.should.be.an.instanceof(Function);

mp3dat.stat({stream: fs.createReadStream(testFile), size: fs.statSync(testFile).size}, cb);
mp3dat2.stat(testFile, cb);

function cb(err, stats) {
    console.log(stats);
    assert.ifError(err);
    // expected properties
    
    assert(stats.duration, 'should be a truthy duration property');
    assert(stats.bitrate, 'should be a truthy bitrate property');
    assert(stats.filesize, 'should be a truthy filesize property');
    assert(stats.timestamp, 'should be a truthy timestamp property');
    assert(stats.timesig, 'should be a truthy timesig property');
    
    //expected types
    assert.equal(typeof stats.duration, 'object', 'duration should be an object type');
    assert(stats.duration instanceof Object, 'duration should be an instance of Object');
    assert(!isNaN(stats.bitrate), 'bitrate should be a number');
    assert(!isNaN(stats.filesize), 'filesize should be a number');
    assert(!isNaN(stats.timestamp), ' timestamp should be a number');
    assert(stats.timesig.match(/^\d+:\d+:\d+$/), 'timesig should be in HH:MM:SS format');
    // expected duration properties
    assert.notStrictEqual(stats.duration.hours,   undefined, 'should be a duration.hours property');
    assert.notStrictEqual(stats.duration.minutes, undefined, 'should be a duration.minutes property');
    assert.notStrictEqual(stats.duration.seconds, undefined, 'should be a duration.seconds property');
    
    // expected duration types
    assert(!isNaN(stats.duration.hours), 'duration.hours should be a number');
    
    
    // expected duration properties constraints
    assert(stats.duration.minutes < 60, 'duration.minutes should be no greater than 59');
    assert(stats.duration.seconds < 60, 'duration.seconds should be no greater than 59');
    assert(stats.duration.milliseconds < 1000, 'duration.milliseconds should be no greater than 999');
    
    console.log('All tests passed');
}