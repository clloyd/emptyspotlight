/* */ 
(function(process) {
  describe('EventEmitter', function tests() {
    'use strict';
    var EventEmitter = require("./index").EventEmitter,
        assume = require("assume");
    it('inherits when used with require(util).inherits', function() {
      function Beast() {}
      require("util").inherits(Beast, EventEmitter);
      var moop = new Beast(),
          meap = new Beast();
      assume(moop).is.instanceOf(Beast);
      assume(moop).is.instanceof(EventEmitter);
      moop.listeners();
      meap.listeners();
      moop.on('data', function() {
        throw new Error('I should not emit');
      });
      meap.emit('data', 'rawr');
      meap.removeListener('foo');
      meap.removeAllListeners();
    });
    describe('EventEmitter#emit', function() {
      it('should return false when there are not events to emit', function() {
        var e = new EventEmitter();
        assume(e.emit('foo')).equals(false);
        assume(e.emit('bar')).equals(false);
      });
      it('emits with context', function(done) {
        var e = new EventEmitter(),
            context = 'bar';
        e.on('foo', function(bar) {
          assume(bar).equals('bar');
          assume(this).equals(context);
          done();
        }, context).emit('foo', 'bar');
      });
      it('emits with context, multiple arguments (force apply)', function(done) {
        var e = new EventEmitter(),
            context = 'bar';
        e.on('foo', function(bar) {
          assume(bar).equals('bar');
          assume(this).equals(context);
          done();
        }, context).emit('foo', 'bar', 1, 2, 3, 4, 5, 6, 7, 8, 9, 0);
      });
      it('can emit the function with multiple arguments', function() {
        var e = new EventEmitter();
        for (var i = 0; i < 100; i++) {
          (function(j) {
            for (var i = 0,
                args = []; i < j; i++) {
              args.push(j);
            }
            e.once('args', function() {
              assume(arguments.length).equals(args.length);
            });
            e.emit.apply(e, ['args'].concat(args));
          })(i);
        }
      });
      it('can emit the function with multiple arguments, multiple listeners', function() {
        var e = new EventEmitter();
        for (var i = 0; i < 100; i++) {
          (function(j) {
            for (var i = 0,
                args = []; i < j; i++) {
              args.push(j);
            }
            e.once('args', function() {
              assume(arguments.length).equals(args.length);
            });
            e.once('args', function() {
              assume(arguments.length).equals(args.length);
            });
            e.once('args', function() {
              assume(arguments.length).equals(args.length);
            });
            e.once('args', function() {
              assume(arguments.length).equals(args.length);
            });
            e.emit.apply(e, ['args'].concat(args));
          })(i);
        }
      });
      it('emits with context, multiple listeners (force loop)', function() {
        var e = new EventEmitter();
        e.on('foo', function(bar) {
          assume(bar).equals('bar');
          assume(this).equals('bar');
        }, 'bar');
        e.on('foo', function(bar) {
          assume(bar).equals('bar');
          assume(this).equals('foo');
        }, 'foo');
        e.emit('foo', 'bar');
      });
      it('emits with different contexts', function() {
        var e = new EventEmitter(),
            pattern = '';
        function writer() {
          pattern += this;
        }
        e.on('write', writer, 'foo');
        e.on('write', writer, 'baz');
        e.once('write', writer, 'bar');
        e.once('write', writer, 'banana');
        e.emit('write');
        assume(pattern).equals('foobazbarbanana');
      });
      it('should return true when there are events to emit', function(done) {
        var e = new EventEmitter();
        e.on('foo', function() {
          process.nextTick(done);
        });
        assume(e.emit('foo')).equals(true);
        assume(e.emit('foob')).equals(false);
      });
      it('receives the emitted events', function(done) {
        var e = new EventEmitter();
        e.on('data', function(a, b, c, d, undef) {
          assume(a).equals('foo');
          assume(b).equals(e);
          assume(c).is.instanceOf(Date);
          assume(undef).equals(undefined);
          assume(arguments.length).equals(3);
          done();
        });
        e.emit('data', 'foo', e, new Date());
      });
      it('emits to all event listeners', function() {
        var e = new EventEmitter(),
            pattern = [];
        e.on('foo', function() {
          pattern.push('foo1');
        });
        e.on('foo', function() {
          pattern.push('foo2');
        });
        e.emit('foo');
        assume(pattern.join(';')).equals('foo1;foo2');
      });
    });
    describe('EventEmitter#listeners', function() {
      it('returns an empty array if no listeners are specified', function() {
        var e = new EventEmitter();
        assume(e.listeners('foo')).is.a('array');
        assume(e.listeners('foo').length).equals(0);
      });
      it('returns an array of function', function() {
        var e = new EventEmitter();
        function foo() {}
        e.on('foo', foo);
        assume(e.listeners('foo')).is.a('array');
        assume(e.listeners('foo').length).equals(1);
        assume(e.listeners('foo')).deep.equals([foo]);
      });
      it('is not vulnerable to modifications', function() {
        var e = new EventEmitter();
        function foo() {}
        e.on('foo', foo);
        assume(e.listeners('foo')).deep.equals([foo]);
        e.listeners('foo').length = 0;
        assume(e.listeners('foo')).deep.equals([foo]);
      });
    });
    describe('EventEmitter#once', function() {
      it('only emits it once', function() {
        var e = new EventEmitter(),
            calls = 0;
        e.once('foo', function() {
          calls++;
        });
        e.emit('foo');
        e.emit('foo');
        e.emit('foo');
        e.emit('foo');
        e.emit('foo');
        assume(e.listeners('foo').length).equals(0);
        assume(calls).equals(1);
      });
      it('only emits once if emits are nested inside the listener', function() {
        var e = new EventEmitter(),
            calls = 0;
        e.once('foo', function() {
          calls++;
          e.emit('foo');
        });
        e.emit('foo');
        assume(e.listeners('foo').length).equals(0);
        assume(calls).equals(1);
      });
      it('only emits once for multiple events', function() {
        var e = new EventEmitter(),
            multi = 0,
            foo = 0,
            bar = 0;
        e.once('foo', function() {
          foo++;
        });
        e.once('foo', function() {
          bar++;
        });
        e.on('foo', function() {
          multi++;
        });
        e.emit('foo');
        e.emit('foo');
        e.emit('foo');
        e.emit('foo');
        e.emit('foo');
        assume(e.listeners('foo').length).equals(1);
        assume(multi).equals(5);
        assume(foo).equals(1);
        assume(bar).equals(1);
      });
      it('only emits once with context', function(done) {
        var e = new EventEmitter(),
            context = 'foo';
        e.once('foo', function(bar) {
          assume(this).equals(context);
          assume(bar).equals('bar');
          done();
        }, context).emit('foo', 'bar');
      });
    });
    describe('EventEmitter#removeListener', function() {
      it('should only remove the event with the specified function', function() {
        var e = new EventEmitter();
        function bar() {}
        e.on('foo', function() {});
        e.on('bar', function() {});
        e.on('bar', bar);
        assume(e.removeListener('foo', bar)).equals(e);
        assume(e.listeners('foo').length).equals(1);
        assume(e.listeners('bar').length).equals(2);
        assume(e.removeListener('foo')).equals(e);
        assume(e.listeners('foo').length).equals(0);
        assume(e.listeners('bar').length).equals(2);
        assume(e.removeListener('bar', bar)).equals(e);
        assume(e.listeners('bar').length).equals(1);
        assume(e.removeListener('bar')).equals(e);
        assume(e.listeners('bar').length).equals(0);
      });
      it('should only remove once events when using the once flag', function() {
        var e = new EventEmitter();
        function foo() {}
        e.on('foo', foo);
        assume(e.removeListener('foo', function() {}, true)).equals(e);
        assume(e.listeners('foo').length).equals(1);
        assume(e.removeListener('foo', foo, true)).equals(e);
        assume(e.listeners('foo').length).equals(1);
        assume(e.removeListener('foo', foo)).equals(e);
        assume(e.listeners('foo').length).equals(0);
        e.on('foo', foo);
        e.once('foo', foo);
        assume(e.removeListener('foo', function() {}, true)).equals(e);
        assume(e.listeners('foo').length).equals(2);
        assume(e.removeListener('foo', foo, true)).equals(e);
        assume(e.listeners('foo').length).equals(1);
        e.once('foo', foo);
        assume(e.removeListener('foo', foo)).equals(e);
        assume(e.listeners('foo').length).equals(0);
      });
    });
    describe('EventEmitter#removeAllListeners', function() {
      it('removes all events for the specified events', function() {
        var e = new EventEmitter();
        e.on('foo', function() {
          throw new Error('oops');
        });
        e.on('foo', function() {
          throw new Error('oops');
        });
        e.on('bar', function() {
          throw new Error('oops');
        });
        e.on('aaa', function() {
          throw new Error('oops');
        });
        assume(e.removeAllListeners('foo')).equals(e);
        assume(e.listeners('foo').length).equals(0);
        assume(e.listeners('bar').length).equals(1);
        assume(e.listeners('aaa').length).equals(1);
        assume(e.removeAllListeners('bar')).equals(e);
        assume(e.removeAllListeners('aaa')).equals(e);
        assume(e.emit('foo')).equals(false);
        assume(e.emit('bar')).equals(false);
        assume(e.emit('aaa')).equals(false);
      });
      it('just nukes the fuck out of everything', function() {
        var e = new EventEmitter();
        e.on('foo', function() {
          throw new Error('oops');
        });
        e.on('foo', function() {
          throw new Error('oops');
        });
        e.on('bar', function() {
          throw new Error('oops');
        });
        e.on('aaa', function() {
          throw new Error('oops');
        });
        assume(e.removeAllListeners()).equals(e);
        assume(e.listeners('foo').length).equals(0);
        assume(e.listeners('bar').length).equals(0);
        assume(e.listeners('aaa').length).equals(0);
        assume(e.emit('foo')).equals(false);
        assume(e.emit('bar')).equals(false);
        assume(e.emit('aaa')).equals(false);
      });
    });
    describe('#setMaxListeners', function() {
      it('is a function', function() {
        var e = new EventEmitter();
        assume(e.setMaxListeners).is.a('function');
      });
      it('returns self when called', function() {
        var e = new EventEmitter();
        assume(e.setMaxListeners()).to.equal(e);
      });
    });
  });
})(require("process"));
