/* */ 
require("./lib/npo.src");
function makePromise() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(42);
    }, 100);
  });
}
function finished(msg) {
  console.log(msg);
}
function emptyObjectProperties(o) {
  Object.getOwnPropertyNames(o).forEach(function(key) {
    if (typeof o[key] != "function") {
      o[key] = void 0;
    }
  });
}
function invokeMethods(o) {
  Object.getOwnPropertyNames(o).forEach(function(key) {
    if (typeof o[key] == "function") {
      try {
        o[key](Math.random());
      } catch (e) {}
    }
  });
}
var p1 = makePromise();
Object.freeze(p1);
p1.then(finished);
var p2 = makePromise();
emptyObjectProperties(p2);
p2.then(finished);
var p3 = makePromise();
invokeMethods(p3);
p3.then(finished);
