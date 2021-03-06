var dgram = require('dgram');
var async = require('async');

function Measure(client, address, debug) {
  if (!client) throw new Error('Measures class: client could not be empty.');
  if (typeof(client) !== 'string') throw new Error('Measures class: client must be a string.');
  if (typeof(address) !== 'object') throw new Error('Measures class: address must be an object.');
  if (!address || !Object.keys(address).length) throw new Error('Measures class: address object could not be empty.');
  if (!address.host || !address.port) throw new Error('Measures class: address.host or address.port is empty.');
  if (typeof(address.host) !== 'string') throw new Error('Measures class: address.host must be a string.');
  if (typeof(address.port) !== 'number') throw new Error('Measures class: address.port must be an integer.');

  var q = async.queue(function (task, cb) {
    var socket = dgram.createSocket('udp4');
    socket.send(task.buffer, 0, task.buffer.length,
      address.port, address.host,
      function (err) {
        socket.close();
        if (task.callback) task.callback(err);
        cb();
      }
    );
  }, 2);

  q.drain = function () {
    if (debug) console.log('[measuresjs-debug]', 'all messages have been sent.');
  };

  this.metrify = function (metric, counter, dms, cb) {
    if (!metric) return cb(new Error('Measures.count: metric object could not be empty.'));
    if (typeof(metric) !== 'string') return cb(new Error('Measures.count: metric must be a string.'));

    var message = {
      client: client,
      metric: metric,
      count: counter || 1
    };

    var dimensions = dms || {};

    Object.keys(message).forEach(function (prop) {
      dms[prop] = message[prop];
    });

    var buffer = new Buffer(JSON.stringify(dms));

    q.push({buffer: buffer, callback: cb}, function (err) {
      if (debug) {
        (err) ? console.log(err) : console.log('[measuresjs-debug]', 'metrics sent.');
      }
    });
  };
};

module.exports = Measure;
