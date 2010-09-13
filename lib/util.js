/**
 * Utility functions
 */

/*-----------------------------------------------
  Exports
-----------------------------------------------*/

if (exports) {
  exports.mix = mix;
  exports.merge = merge;
}


/*-----------------------------------------------
  Utility functions
-----------------------------------------------*/

function mix(target, source /*, overwrite */) {
  var overwrite = (arguments.length > 1) ? !!arguments[2] : true,
      keys = (typeof source === 'object') ? Object.keys(source) : [];
  keys.forEach(function(key) {
    if (overwrite || !(key in target)) {
      target[key] = source[key];
    }
  });
  return target;
}

function merge(/* objects */) {
  var args = Array.prototype.slice.call(arguments);
  var ret = args.shift();
  while (args.length) {
    ret = mix(ret, args.shift());
  }
  return ret;
}
