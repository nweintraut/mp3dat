var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
// half-byte(4bit) hex values to interpreted bitrates(bps)
//only MPEG-1 bitrates supported

function Mp3dat(f, size){
    var self = this;
    if (!(this instanceof Mp3dat)){
        return new Mp3dat();
    }
    EventEmitter.call(this);
    /*
    self.stat = function(f, cb) {
        fs.stat(f, function(err, fstats) {
            self.size = fstats.size;
            self.f = f;
            self._findBitRate(function(err, bitrate){  
                if(err){cb(err); return;}
                self._buildStats(cb);
            });
        });
    };
    */
    self.stats = {duration:{}};
}
util.inherits(Mp3dat, EventEmitter);
Mp3dat.prototype._bitrates = {
    1: 32000, 2: 40000, 3: 48000, 4: 56000, 5: 64000,
    6: 80000, 7: 96000, 8: 112000, 9: 128000, A: 160000, B: 192000,
    C: 224000, D: 256000, E: 320000 };

Mp3dat.prototype.spawnInstance = function(){
    return Mp3dat();
};
Mp3dat.prototype._magnitudes = ['hours', 'minutes', 'seconds', 'milliseconds'];

Mp3dat.prototype._pad = function(n){return n < 10 ? '0'+n : n};

Mp3dat.prototype._timesig = function() {
    var ts = '', self = this;
    self._magnitudes.forEach(function(mag, i){
        if(i<3) {
            ts += self._pad(self.stats.duration[mag]) + ((i<2) ? ':' : '');
        }
    });
    self.emit('timesig', ts);
    return ts;
};

Mp3dat.prototype._findBitRate = function(cb) {
    var self = this;
    var stream = self.stream || fs.createReadStream(self.f);
    stream
        .on('data', function(data){
           var i = 0;
           for (i; i < data.length; i += 2) {
               if (data.readUInt16LE(i) === 64511) {
                   self.bitrate = self._bitrates[data.toString('hex', i+2, i+3)[0]];
                   this.destroy();
                   self.emit('bitrate', self.bitrate);
                   cb(null);
                   break;
               }
           }
        })
        .on('end', function(){
            var err = new Error('could not find bitrate, is this definitely an MPEG-1 MP3?');
            self.emit('error', err);
            cb(err);
        });
};

Mp3dat.prototype._timeProcessor = function(time, counter, cb) {
    var self = this,
        timeArray = [],
        factor = (counter < 3) ? 60 : 1000, 
        magnitudes = self._magnitudes,
        duration = self.stats.duration;
    if(counter instanceof Function) {
        cb = counter;
        counter = 0;
        
    }
    if (counter) {
        timeArray = (factor * + ('0.' + time )).toString().split('.');
    }
    if (counter < magnitudes.length -1 ) {
        duration[magnitudes[counter]] = timeArray[0] || Math.floor(time);
        duration[magnitudes[counter]] = +duration[magnitudes[counter]];
        counter += 1;
        self._timeProcessor.call(self, timeArray[1] || time.toString().split('.')[1], counter, cb);
        return;
    }
    // round off the final magnitude (milliseconds)
    duration[magnitudes[counter]] = Math.round(timeArray.join('.'));
    cb(duration);
};
Mp3dat.prototype._buildStats = function(cb){
    var self = this, 
        hours = (self.size / (self.bitrate / 8) / 3600);
    self._timeProcessor(hours, function(duration) {
          self.stats = {
              duration: duration,
              bitrate: self.bitrate,
              filesize: self.size,
              timestamp: Math.round(hours * 3600000),
              timesig: self._timesig(duration, self.magnitudes)
          };
          self.emit('stats', self.stats);
        if (cb) {cb(null, self.stats);     } 
    });
};
Mp3dat.prototype._compile = function(err, fstatsOpts, cb) {
    var self = this;
    self.size = fstatsOpts.size;
    self.stream = fstatsOpts.stream;
    self._findBitRate(function(err, bitrate){
        if(err){cb(err); return;}
        self._buildStats(cb);
    });
};
Mp3dat.prototype.statStream = function(opts, cb) {
    var self = this,
        errTxt = 'First arg must be options object with stream and size',
        validOpts = ({}).toString.call(opts) === '[object Object]'
            && opts.stream
            && opts.size
            && 'pause' in opts.stream
            && !isNaN(+opts.size);
    if(!validOpts) {
        cb(new Error(errTxt));
        return;
    }
    self.size = opts.size;git
    self.f = opts.stream.path;
    self.stream = opts.stream;
    self._findBitRate(function(err, bitrate){
        if(err) {cb(err); return;}
        self._buildStats(cb);
    });
};

Mp3dat.prototype.stat = function(f, cb) {
    var self = this;
    var isOptsObj = ({}).toString.call(f) === '[object Object]';
    if(isOptsObj){
        var opts = f,
            validOpts = opts.stream && opts.size && 'pause' in opts.stream && !isNaN(+opts.size);
        var errTxt = 'First arg must be options object with stream and size';
        if(!validOpts) {cb(new Error(errTxt)); return;}
        self.f = opts.stream.path;
        self._compile(null, opts, cb);
        return self;
    }
    self.f = f;
    fs.stat(f, function(err, fstats){
        self._compile.call(self, err, fstats, cb);
    });
    return self;
    /*
    fs.stat(f, function(err, fstats){
        self.size = fstats.size;
        self.f = f;
        self._findBitRate(function(err, bitrate){
            if(err){cb(err); return;}
            self._buildStats(cb);
        });
    });
    */
};

module.exports = Mp3dat();
/*
function buildStats(bitrate, size, cb) {
    var magnitudes = ['hours', 'minutes', 'seconds', 'milliseconds'],
        duration = {},
        stats,
        hours = (size / (bitrate / 8) / 3600);
    (function timeProcessor(time, counter){['hours', 'minutes', 'seconds', 'milliseconds'],
        var timeArray = [],
            factor = (counter < 3) ? 60 : 1000;
        if (counter) {
            timeArray = (factor * + ('0.' + time)).toString().split('.');
        }
        if (counter < magnitudes.length -1 ) {
            duration[magnitudes[counter]] = timeArray[0] || Math.floor(time);
            duration[magnitudes[counter]] = + duration[magnitudes[counter]];
            counter += 1;
            timeProcessor(timeArray[1] || time.toString().split('.')[1], counter);
            return;
        }
        // round off the final magnitude
        duration[magnitudes[counter]] = Math.round(timeArray.join('.'));
    })(hours, 0);
    stats = {
        duration: duration,
        bitrate: bitrate,
        filesize: size,
        timestamp: Math.round(hours *3600000),
        timesig: ''
    };
    function pad(n){return n < 10 ? '0'+n : n}
    magnitudes.forEach(function(mag, i){
        if (i<3) {
            stats.timesig += pad(duration[mag]) + ((i<2) ? ':' : '');
        }
    });
    cb(null, stats);
}
function findBitRate(f, cb) {
    fs.createReadStream(f)
        .on('data', function(data){
            var i;
            for (i=0; i < data.length; i += 2) {
                if(data.readUInt16LE(i) === 64511) {
                    this.destroy();
                    cb(null, bitrates[data.toString('hex', i+2, i+ 3)[0]]);
                    break;
                }
            }   
        })
        .on('end', function(){
            cb(new Error('could not find bitrate, is this definitely an MPEG-1 MP3?'));
        });
}
exports.stat = function(f, cb){
    fs.stat(f, function(err, fstats){
       findBitRate(f, function(err, bitrate) {
           if(err) {cb(err); return;}
           buildStats(bitrate, fstats.size, cb);
       });
    });
};
*/