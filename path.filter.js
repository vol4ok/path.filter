var AndRule, BasenameRule, DirRule, ExtRule, Filter, NotRule, OrRule, RegexpRule, basename, existsSync, extname, fs, path, _,
  __slice = Array.prototype.slice;

fs = require('fs');

_ = require('underscore');

path = require('path');

extname = path.extname, basename = path.basename, existsSync = path.existsSync;

/*
* Basic regexp rule
* @class RegexpRule
*/

RegexpRule = (function() {

  RegexpRule.prototype.NAME = 'regexp';

  RegexpRule.prototype.ALIASES = ['re'];

  function RegexpRule(filter, regexp) {
    this.filter = filter;
    this.regexp = regexp;
  }

  RegexpRule.prototype.test = function(target) {
    return this.regexp.test(target);
  };

  return RegexpRule;

})();

/*
* Match file ext
* @class ExtRule
*/

ExtRule = (function() {

  ExtRule.prototype.NAME = 'ext';

  function ExtRule() {
    var ext, exts, filter, _i, _len;
    filter = arguments[0], exts = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this.filter = filter;
    this.exts = {};
    for (_i = 0, _len = exts.length; _i < _len; _i++) {
      ext = exts[_i];
      this.exts[this._rd(ext)] = true;
    }
  }

  ExtRule.prototype._rd = function(e) {
    if (e[0] && e[0] === '.') {
      return e.slice(1);
    } else {
      return e;
    }
  };

  ExtRule.prototype.test = function(target) {
    var targetExt;
    targetExt = this._rd(extname(target));
    return this.exts[targetExt] != null;
  };

  return ExtRule;

})();

/*
* Basename of file regexp match
* @class BasenameRule
*/

BasenameRule = (function() {

  BasenameRule.prototype.NAME = 'basename';

  function BasenameRule(filter, regexp) {
    this.filter = filter;
    this.regexp = regexp;
  }

  BasenameRule.prototype.test = function(target) {
    return this.regexp.test(basename(target));
  };

  return BasenameRule;

})();

/*
* is file or directory check
* @class DirRule
*/

DirRule = (function() {

  DirRule.prototype.NAME = 'dir';

  function DirRule(filter) {
    this.filter = filter;
  }

  DirRule.prototype.test = function(target) {
    debugger;    if (!existsSync(target)) return false;
    return fs.lstatSync(target).isDirectory();
  };

  return DirRule;

})();

/*
* implement logical and
* @class AndRule
*/

AndRule = (function() {

  AndRule.prototype.NAME = 'and';

  function AndRule() {
    var filter, rule, rules, _i, _len, _ref;
    filter = arguments[0], rules = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this.filter = filter;
    this.rules = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      rule = rules[_i];
      this.rules.push((_ref = this.filter).createRule.apply(_ref, rule));
    }
  }

  AndRule.prototype.test = function(target) {
    var rule, _i, _len, _ref;
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      if (!rule.test(target)) return false;
    }
    return true;
  };

  return AndRule;

})();

/*
* implement logical or
* @class OrRule
*/

OrRule = (function() {

  OrRule.prototype.NAME = 'or';

  function OrRule() {
    var filter, rule, rules, _i, _len, _ref;
    filter = arguments[0], rules = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    this.filter = filter;
    this.rules = [];
    for (_i = 0, _len = rules.length; _i < _len; _i++) {
      rule = rules[_i];
      this.rules.push((_ref = this.filter).createRule.apply(_ref, rule));
    }
  }

  OrRule.prototype.test = function(target) {};

  OrRule.prototype.test = function(target) {
    var rule, _i, _len, _ref;
    _ref = this.rules;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      if (!rule.test(target)) return true;
    }
    return false;
  };

  return OrRule;

})();

/*
* implement logical not
* @class NotRule
*/

NotRule = (function() {

  NotRule.prototype.NAME = 'not';

  function NotRule(filter, rule) {
    var _ref;
    this.filter = filter;
    this.rule = (_ref = this.filter).createRule.apply(_ref, rule);
  }

  NotRule.prototype.test = function(target) {
    return !this.rule.test(target);
  };

  return NotRule;

})();

/*
* Parse rules and check targets
* @class Filter
*/

Filter = (function() {

  Filter.prototype.defaults = {
    allow: [],
    deny: [],
    rulesClasses: [RegexpRule, ExtRule, BasenameRule, DirRule, AndRule, OrRule, NotRule]
  };

  /**
  * @constructor
  * @param {Object} options
  * @param {Array} options.rulesClasses
  * @param {Array} options.allow
  * @param {Array} options.deny
  */

  function Filter(options) {
    var c, o, r, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
    if (options == null) options = {};
    o = _.defaults(options, this.defaults);
    this._allow = [];
    this._deny = [];
    this.rulesClasses = {};
    _ref = o.rulesClasses;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      c = _ref[_i];
      this.regilsterRuleClass(c);
    }
    _ref2 = o.allow;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      r = _ref2[_j];
      this.allow(r);
    }
    _ref3 = o.deny;
    for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
      r = _ref3[_k];
      this.deny(r);
    }
  }

  /**
  * @public
  * @param {Object} ruleClass
  */

  Filter.prototype.regilsterRuleClass = function(ruleClass) {
    var alias, _i, _len, _ref;
    if (this["default"] == null) {
      this["default"] = ruleClass.prototype.NAME.toLowerCase();
    }
    this.rulesClasses[ruleClass.prototype.NAME.toLowerCase()] = ruleClass;
    if (_.isArray(ruleClass.prototype.ALIASES)) {
      _ref = ruleClass.prototype.ALIASES;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        alias = _ref[_i];
        this.rulesClasses[alias.toLowerCase()] = ruleClass;
      }
    }
    return this;
  };

  /**
  * @public
  * @param {String} rule — rule class NAME
  * @param {Any} - args... — arguments list
  */

  Filter.prototype.createRule = function() {
    var args, rule;
    rule = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(this.rulesClasses[rule.toLowerCase()], [this].concat(__slice.call(args)), function() {});
  };

  /**
  * Add array with allow rules
  * @public
  * @param {String} rule — rule class NAME
  * @param {Any} - args... — arguments list
  */

  Filter.prototype.allow = function() {
    this._allow.push(this.createRule.apply(this, arguments));
    return this;
  };

  /**
  * Add array with deny rules
  * @public
  * @param {String} rule — rule class NAME
  * @param {Any} - args... — arguments list
  */

  Filter.prototype.deny = function() {
    this._deny.push(this.createRule.apply(this, arguments));
    return this;
  };

  /**
  * Add array with allow rules
  * @public
  * @param {Array} list
  */

  Filter.prototype.allowList = function(list) {
    var rule, _i, _len;
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      rule = list[_i];
      this._allow.push(this.createRule.apply(this, rule));
    }
    return this;
  };

  /**
  * Add array with deny rules 
  * @public
  * @param {Array} list
  */

  Filter.prototype.denyList = function(list) {
    var rule, _i, _len;
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      rule = list[_i];
      this._deny.push(this.createRule.apply(this, rule));
    }
    return this;
  };

  /**
  * @public
  * @param {String} target
  */

  Filter.prototype.test = function(target) {
    var rule, _i, _j, _len, _len2, _ref, _ref2;
    _ref = this._deny;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rule = _ref[_i];
      if (rule.test(target)) return false;
    }
    _ref2 = this._allow;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      rule = _ref2[_j];
      if (rule.test(target)) return true;
    }
    return false;
  };

  return Filter;

})();

module.exports = Filter;
