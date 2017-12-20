import bunyan from 'bunyan'

function Stream () {}
Stream.prototype.write = function (rec) {
  console.log('%c%s %c%s %c%s %c%s %O',
      'color:green;',
      rec.time.toISOString(),
      'color:red;',
      rec.name,
      'color:blue;',
      bunyan.nameFromLevel[rec.level],
      'color:black;',
      rec.msg,
      rec.extra)
}

export const logger = bunyan.createLogger({name: 'exchange', streams: [{level: 'trace', stream: new Stream(), type: 'raw'}]})
