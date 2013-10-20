var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.TRUSTED_SITE = true;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      if(doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if(isDeps) {
          return false
        }else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      doc.write('\x3cscript type\x3d"text/javascript" src\x3d"' + src + '"\x3e\x3c/' + "script\x3e");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call((value));
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1E9 >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return(fn.call.apply(fn.bind, arguments))
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ \x3d 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.getMsgWithFallback = function(a, b) {
  return a
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "\x3cbr /\x3e" : "\x3cbr\x3e")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "\x26amp;").replace(goog.string.ltRe_, "\x26lt;").replace(goog.string.gtRe_, "\x26gt;").replace(goog.string.quotRe_, "\x26quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("\x26") != -1) {
      str = str.replace(goog.string.amperRe_, "\x26amp;")
    }
    if(str.indexOf("\x3c") != -1) {
      str = str.replace(goog.string.ltRe_, "\x26lt;")
    }
    if(str.indexOf("\x3e") != -1) {
      str = str.replace(goog.string.gtRe_, "\x26gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "\x26quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "\x26")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"\x26amp;":"\x26", "\x26lt;":"\x3c", "\x26gt;":"\x3e", "\x26quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"\x26";
      case "lt":
        return"\x3c";
      case "gt":
        return"\x3e";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " \x26#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return(value)
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return(value)
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if(f.call(opt_obj, element, index, arr)) {
      ++count
    }
  }, opt_obj);
  return count
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && Object.prototype.hasOwnProperty.call(arr2, "callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element
  });
  return ret
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if(opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end
  }
  if(step * (end - start) < 0) {
    return[]
  }
  if(step > 0) {
    for(var i = start;i < end;i += step) {
      array.push(i)
    }
  }else {
    for(var i = start;i > end;i += step) {
      array.push(i)
    }
  }
  return array
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if(Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result)
  }
  return result
};
goog.object.isImmutableView = function(obj) {
  return!!Object.isFrozen && Object.isFrozen(obj)
};
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.object");
goog.require("goog.string.StringBuffer");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.set_print_fn_BANG_ = function set_print_fn_BANG_(f) {
  return cljs.core._STAR_print_fn_STAR_ = f
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "flush-on-newline", "flush-on-newline", 4338025857), cljs.core._STAR_flush_on_newline_STAR_, new cljs.core.Keyword(null, "readably", "readably", 4441712502), cljs.core._STAR_print_readably_STAR_, new cljs.core.Keyword(null, "meta", "meta", 1017252215), cljs.core._STAR_print_meta_STAR_, new cljs.core.Keyword(null, "dup", "dup", 1014004081), cljs.core._STAR_print_dup_STAR_], true)
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.not_native = null;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.array_QMARK_ = function array_QMARK_(x) {
  return x instanceof Array
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return typeof n === "number"
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  return goog.isString(x)
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  var ty = cljs.core.type.call(null, obj);
  var ty__$1 = cljs.core.truth_(function() {
    var and__3941__auto__ = ty;
    if(cljs.core.truth_(and__3941__auto__)) {
      return ty.cljs$lang$type
    }else {
      return and__3941__auto__
    }
  }()) ? ty.cljs$lang$ctorStr : goog.typeOf(obj);
  return new Error(["No protocol method ", proto, " defined for type ", ty__$1, ": ", obj].join(""))
};
cljs.core.type__GT_str = function type__GT_str(ty) {
  var temp__4090__auto__ = ty.cljs$lang$ctorStr;
  if(cljs.core.truth_(temp__4090__auto__)) {
    var s = temp__4090__auto__;
    return s
  }else {
    return[cljs.core.str(ty)].join("")
  }
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$core$IFn$_invoke$arity$1 = make_array__1;
  make_array.cljs$core$IFn$_invoke$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6087__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6087 = function(array, i, var_args) {
      var idxs = null;
      if(arguments.length > 2) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6087__delegate.call(this, array, i, idxs)
    };
    G__6087.cljs$lang$maxFixedArity = 2;
    G__6087.cljs$lang$applyTo = function(arglist__6088) {
      var array = cljs.core.first(arglist__6088);
      arglist__6088 = cljs.core.next(arglist__6088);
      var i = cljs.core.first(arglist__6088);
      var idxs = cljs.core.rest(arglist__6088);
      return G__6087__delegate(array, i, idxs)
    };
    G__6087.cljs$core$IFn$_invoke$arity$variadic = G__6087__delegate;
    return G__6087
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$core$IFn$_invoke$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$core$IFn$_invoke$arity$2 = aget__2;
  aget.cljs$core$IFn$_invoke$arity$variadic = aget__3.cljs$core$IFn$_invoke$arity$variadic;
  return aget
}();
cljs.core.aset = function() {
  var aset = null;
  var aset__3 = function(array, i, val) {
    return array[i] = val
  };
  var aset__4 = function() {
    var G__6089__delegate = function(array, idx, idx2, idxv) {
      return cljs.core.apply.call(null, aset, array[idx], idx2, idxv)
    };
    var G__6089 = function(array, idx, idx2, var_args) {
      var idxv = null;
      if(arguments.length > 3) {
        idxv = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6089__delegate.call(this, array, idx, idx2, idxv)
    };
    G__6089.cljs$lang$maxFixedArity = 3;
    G__6089.cljs$lang$applyTo = function(arglist__6090) {
      var array = cljs.core.first(arglist__6090);
      arglist__6090 = cljs.core.next(arglist__6090);
      var idx = cljs.core.first(arglist__6090);
      arglist__6090 = cljs.core.next(arglist__6090);
      var idx2 = cljs.core.first(arglist__6090);
      var idxv = cljs.core.rest(arglist__6090);
      return G__6089__delegate(array, idx, idx2, idxv)
    };
    G__6089.cljs$core$IFn$_invoke$arity$variadic = G__6089__delegate;
    return G__6089
  }();
  aset = function(array, idx, idx2, var_args) {
    var idxv = var_args;
    switch(arguments.length) {
      case 3:
        return aset__3.call(this, array, idx, idx2);
      default:
        return aset__4.cljs$core$IFn$_invoke$arity$variadic(array, idx, idx2, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aset.cljs$lang$maxFixedArity = 3;
  aset.cljs$lang$applyTo = aset__4.cljs$lang$applyTo;
  aset.cljs$core$IFn$_invoke$arity$3 = aset__3;
  aset.cljs$core$IFn$_invoke$arity$variadic = aset__4.cljs$core$IFn$_invoke$arity$variadic;
  return aset
}();
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$core$IFn$_invoke$arity$1 = into_array__1;
  into_array.cljs$core$IFn$_invoke$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__3502__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$core$IFn$_invoke$arity$1 = _invoke__1;
  _invoke.cljs$core$IFn$_invoke$arity$2 = _invoke__2;
  _invoke.cljs$core$IFn$_invoke$arity$3 = _invoke__3;
  _invoke.cljs$core$IFn$_invoke$arity$4 = _invoke__4;
  _invoke.cljs$core$IFn$_invoke$arity$5 = _invoke__5;
  _invoke.cljs$core$IFn$_invoke$arity$6 = _invoke__6;
  _invoke.cljs$core$IFn$_invoke$arity$7 = _invoke__7;
  _invoke.cljs$core$IFn$_invoke$arity$8 = _invoke__8;
  _invoke.cljs$core$IFn$_invoke$arity$9 = _invoke__9;
  _invoke.cljs$core$IFn$_invoke$arity$10 = _invoke__10;
  _invoke.cljs$core$IFn$_invoke$arity$11 = _invoke__11;
  _invoke.cljs$core$IFn$_invoke$arity$12 = _invoke__12;
  _invoke.cljs$core$IFn$_invoke$arity$13 = _invoke__13;
  _invoke.cljs$core$IFn$_invoke$arity$14 = _invoke__14;
  _invoke.cljs$core$IFn$_invoke$arity$15 = _invoke__15;
  _invoke.cljs$core$IFn$_invoke$arity$16 = _invoke__16;
  _invoke.cljs$core$IFn$_invoke$arity$17 = _invoke__17;
  _invoke.cljs$core$IFn$_invoke$arity$18 = _invoke__18;
  _invoke.cljs$core$IFn$_invoke$arity$19 = _invoke__19;
  _invoke.cljs$core$IFn$_invoke$arity$20 = _invoke__20;
  _invoke.cljs$core$IFn$_invoke$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._count[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._count["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._empty[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._empty["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._conj[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__3502__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__3502__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$core$IFn$_invoke$arity$2 = _nth__2;
  _nth.cljs$core$IFn$_invoke$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._first[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rest[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._next[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__3502__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__3502__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$core$IFn$_invoke$arity$2 = _lookup__2;
  _lookup.cljs$core$IFn$_invoke$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._key[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._val[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._val["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._peek[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._peek["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._pop[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._meta[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._with_meta[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._with_meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__3502__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__3502__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__3502__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$core$IFn$_invoke$arity$2 = _reduce__2;
  _reduce.cljs$core$IFn$_invoke$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._kv_reduce[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._equiv[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._equiv["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._hash[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._hash["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._seq[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rseq[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rseq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._entry_key[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._entry_key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._comparator[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._comparator["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__3502__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._write[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._write["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__3502__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._flush[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._flush["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__3502__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._pr_writer[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto__ = d;
    if(and__3941__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__3502__auto__ = d == null ? null : d;
    return function() {
      var or__3943__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__3502__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._notify_watches[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__3502__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._add_watch[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__3502__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._remove_watch[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._as_transient[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._as_transient["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__3502__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__3502__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._compare[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._compare["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._drop_first[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._drop_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_first[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_rest[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__3502__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_next[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INamed = {};
cljs.core._name = function _name(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_name$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_name$arity$1(x)
  }else {
    var x__3502__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._name[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._name["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-name", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._namespace = function _namespace(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_namespace$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_namespace$arity$1(x)
  }else {
    var x__3502__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._namespace[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._namespace["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INamed.-namespace", x);
        }
      }
    }().call(null, x)
  }
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorStr = "cljs.core/StringBufferWriter";
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  return null
};
cljs.core.__GT_StringBufferWriter = function __GT_StringBufferWriter(sb) {
  return new cljs.core.StringBufferWriter(sb)
};
cljs.core.pr_str_STAR_ = function pr_str_STAR_(obj) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core._pr_writer.call(null, obj, writer, cljs.core.pr_opts.call(null));
  cljs.core._flush.call(null, writer);
  return[cljs.core.str(sb)].join("")
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  return x instanceof cljs.core.Symbol
};
cljs.core.hash_symbol = function hash_symbol(sym) {
  return cljs.core.hash_combine.call(null, cljs.core.hash.call(null, sym.ns), cljs.core.hash.call(null, sym.name))
};
goog.provide("cljs.core.Symbol");
cljs.core.Symbol = function(ns, name, str, _hash, _meta) {
  this.ns = ns;
  this.name = name;
  this.str = str;
  this._hash = _hash;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition0$ = 2154168321;
  this.cljs$lang$protocol_mask$partition1$ = 4096
};
cljs.core.Symbol.cljs$lang$type = true;
cljs.core.Symbol.cljs$lang$ctorStr = "cljs.core/Symbol";
cljs.core.Symbol.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Symbol")
};
cljs.core.Symbol.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  return cljs.core._write.call(null, writer, self__.str)
};
cljs.core.Symbol.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  return self__.name
};
cljs.core.Symbol.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  return self__.ns
};
cljs.core.Symbol.prototype.cljs$core$IHash$_hash$arity$1 = function(sym) {
  var self__ = this;
  var h__3323__auto__ = self__._hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_symbol.call(null, sym);
    self__._hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.Symbol.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_, new_meta) {
  var self__ = this;
  return new cljs.core.Symbol(self__.ns, self__.name, self__.str, self__._hash, new_meta)
};
cljs.core.Symbol.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__._meta
};
cljs.core.Symbol.prototype.call = function() {
  var G__6092 = null;
  var G__6092__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, null)
  };
  var G__6092__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.call(null, coll, sym, not_found)
  };
  G__6092 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6092__2.call(this, self__, coll);
      case 3:
        return G__6092__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6092
}();
cljs.core.Symbol.prototype.apply = function(self__, args6091) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6091.slice()))
};
cljs.core.Symbol.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  if(other instanceof cljs.core.Symbol) {
    return self__.str === other.str
  }else {
    return false
  }
};
cljs.core.Symbol.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return self__.str
};
cljs.core.__GT_Symbol = function __GT_Symbol(ns, name, str, _hash, _meta) {
  return new cljs.core.Symbol(ns, name, str, _hash, _meta)
};
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(name instanceof cljs.core.Symbol) {
      return name
    }else {
      return symbol.call(null, null, name)
    }
  };
  var symbol__2 = function(ns, name) {
    var sym_str = !(ns == null) ? [cljs.core.str(ns), cljs.core.str("/"), cljs.core.str(name)].join("") : name;
    return new cljs.core.Symbol(ns, name, sym_str, null, null)
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$core$IFn$_invoke$arity$1 = symbol__1;
  symbol.cljs$core$IFn$_invoke$arity$2 = symbol__2;
  return symbol
}();
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6094 = coll;
      if(G__6094) {
        if(function() {
          var or__3943__auto__ = G__6094.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6094.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._seq.call(null, coll)
    }else {
      if(coll instanceof Array) {
        if(coll.length === 0) {
          return null
        }else {
          return new cljs.core.IndexedSeq(coll, 0)
        }
      }else {
        if(typeof coll === "string") {
          if(coll.length === 0) {
            return null
          }else {
            return new cljs.core.IndexedSeq(coll, 0)
          }
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, coll)) {
            return cljs.core._seq.call(null, coll)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              throw new Error([cljs.core.str(coll), cljs.core.str("is not ISeqable")].join(""));
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6096 = coll;
      if(G__6096) {
        if(function() {
          var or__3943__auto__ = G__6096.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6096.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first.call(null, s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6098 = coll;
      if(G__6098) {
        if(function() {
          var or__3943__auto__ = G__6098.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6098.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(!(s == null)) {
        return cljs.core._rest.call(null, s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6100 = coll;
      if(G__6100) {
        if(function() {
          var or__3943__auto__ = G__6100.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6100.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto__ = x === y;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6101__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6102 = y;
            var G__6103 = cljs.core.first.call(null, more);
            var G__6104 = cljs.core.next.call(null, more);
            x = G__6102;
            y = G__6103;
            more = G__6104;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6101 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6101__delegate.call(this, x, y, more)
    };
    G__6101.cljs$lang$maxFixedArity = 2;
    G__6101.cljs$lang$applyTo = function(arglist__6105) {
      var x = cljs.core.first(arglist__6105);
      arglist__6105 = cljs.core.next(arglist__6105);
      var y = cljs.core.first(arglist__6105);
      var more = cljs.core.rest(arglist__6105);
      return G__6101__delegate(x, y, more)
    };
    G__6101.cljs$core$IFn$_invoke$arity$variadic = G__6101__delegate;
    return G__6101
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ___1;
  _EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ___2;
  _EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ_
}();
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IKVReduce["null"] = true;
cljs.core._kv_reduce["null"] = function(_, f, init) {
  return init
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto__ = other instanceof Date;
  if(and__3941__auto__) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto__
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return Math.floor(o) % 2147483647
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorStr = "cljs.core/Reduced";
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  return self__.val
};
cljs.core.__GT_Reduced = function __GT_Reduced(val) {
  return new cljs.core.Reduced(val)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return r instanceof cljs.core.Reduced
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count.call(null, cicoll);
    if(cnt === 0) {
      return f.call(null)
    }else {
      var val = cljs.core._nth.call(null, cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, cljs.core._nth.call(null, cicoll, n));
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__6106 = nval;
            var G__6107 = n + 1;
            val = G__6106;
            n = G__6107;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6108 = nval;
          var G__6109 = n + 1;
          val__$1 = G__6108;
          n = G__6109;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6110 = nval;
          var G__6111 = n + 1;
          val__$1 = G__6110;
          n = G__6111;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$core$IFn$_invoke$arity$2 = ci_reduce__2;
  ci_reduce.cljs$core$IFn$_invoke$arity$3 = ci_reduce__3;
  ci_reduce.cljs$core$IFn$_invoke$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__6112 = nval;
            var G__6113 = n + 1;
            val = G__6112;
            n = G__6113;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6114 = nval;
          var G__6115 = n + 1;
          val__$1 = G__6114;
          n = G__6115;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6116 = nval;
          var G__6117 = n + 1;
          val__$1 = G__6116;
          n = G__6117;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$core$IFn$_invoke$arity$2 = array_reduce__2;
  array_reduce.cljs$core$IFn$_invoke$arity$3 = array_reduce__3;
  array_reduce.cljs$core$IFn$_invoke$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6119 = x;
  if(G__6119) {
    if(function() {
      var or__3943__auto__ = G__6119.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6119.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6119.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6119)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6119)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6121 = x;
  if(G__6121) {
    if(function() {
      var or__3943__auto__ = G__6121.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6121.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6121.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6121)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6121)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(arr, i) {
  this.arr = arr;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorStr = "cljs.core/IndexedSeq";
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var c = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c > 0) {
    return new cljs.core.RSeq(coll, c - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.i], self__.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.arr.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  return self__.arr[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.__GT_IndexedSeq = function __GT_IndexedSeq(arr, i) {
  return new cljs.core.IndexedSeq(arr, i)
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$core$IFn$_invoke$arity$1 = prim_seq__1;
  prim_seq.cljs$core$IFn$_invoke$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$core$IFn$_invoke$arity$1 = array_seq__1;
  array_seq.cljs$core$IFn$_invoke$arity$2 = array_seq__2;
  return array_seq
}();
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374862
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorStr = "cljs.core/RSeq";
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(col, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, col)
};
cljs.core.RSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(col, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, col)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_RSeq = function __GT_RSeq(ci, i, meta) {
  return new cljs.core.RSeq(ci, i, meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next.call(null, s);
    if(!(sn == null)) {
      var G__6122 = sn;
      s = G__6122;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    if(!(coll == null)) {
      return cljs.core._conj.call(null, coll, x)
    }else {
      return cljs.core.list.call(null, x)
    }
  };
  var conj__3 = function() {
    var G__6123__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6124 = conj.call(null, coll, x);
          var G__6125 = cljs.core.first.call(null, xs);
          var G__6126 = cljs.core.next.call(null, xs);
          coll = G__6124;
          x = G__6125;
          xs = G__6126;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6123 = function(coll, x, var_args) {
      var xs = null;
      if(arguments.length > 2) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6123__delegate.call(this, coll, x, xs)
    };
    G__6123.cljs$lang$maxFixedArity = 2;
    G__6123.cljs$lang$applyTo = function(arglist__6127) {
      var coll = cljs.core.first(arglist__6127);
      arglist__6127 = cljs.core.next(arglist__6127);
      var x = cljs.core.first(arglist__6127);
      var xs = cljs.core.rest(arglist__6127);
      return G__6123__delegate(coll, x, xs)
    };
    G__6123.cljs$core$IFn$_invoke$arity$variadic = G__6123__delegate;
    return G__6123
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$core$IFn$_invoke$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$core$IFn$_invoke$arity$2 = conj__2;
  conj.cljs$core$IFn$_invoke$arity$variadic = conj__3.cljs$core$IFn$_invoke$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq.call(null, coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s)) {
      return acc + cljs.core._count.call(null, s)
    }else {
      var G__6128 = cljs.core.next.call(null, s);
      var G__6129 = acc + 1;
      s = G__6128;
      acc = G__6129;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6131 = coll;
      if(G__6131) {
        if(function() {
          var or__3943__auto__ = G__6131.cljs$lang$protocol_mask$partition0$ & 2;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6131.cljs$core$ICounted$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._count.call(null, coll)
    }else {
      if(coll instanceof Array) {
        return coll.length
      }else {
        if(typeof coll === "string") {
          return coll.length
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.ICounted, coll)) {
            return cljs.core._count.call(null, coll)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core.accumulating_seq_count.call(null, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  }else {
    return 0
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__6132 = cljs.core.next.call(null, coll);
              var G__6133 = n - 1;
              coll = G__6132;
              n = G__6133;
              continue
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__6134 = cljs.core.next.call(null, coll);
              var G__6135 = n - 1;
              var G__6136 = not_found;
              coll = G__6134;
              n = G__6135;
              not_found = G__6136;
              continue
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6141 = coll;
        if(G__6141) {
          if(function() {
            var or__3943__auto__ = G__6141.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6141.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return null
          }
        }else {
          if(typeof coll === "string") {
            if(n < coll.length) {
              return coll[n]
            }else {
              return null
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, coll)) {
              return cljs.core._nth.call(null, coll, n)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                if(function() {
                  var G__6142 = coll;
                  if(G__6142) {
                    if(function() {
                      var or__3943__auto__ = G__6142.cljs$lang$protocol_mask$partition0$ & 64;
                      if(or__3943__auto__) {
                        return or__3943__auto__
                      }else {
                        return G__6142.cljs$core$ISeq$
                      }
                    }()) {
                      return true
                    }else {
                      if(!G__6142.cljs$lang$protocol_mask$partition0$) {
                        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6142)
                      }else {
                        return false
                      }
                    }
                  }else {
                    return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6142)
                  }
                }()) {
                  return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
                }else {
                  throw new Error([cljs.core.str("nth not supported on this type "), cljs.core.str(cljs.core.type__GT_str.call(null, cljs.core.type.call(null, coll)))].join(""));
                }
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6143 = coll;
        if(G__6143) {
          if(function() {
            var or__3943__auto__ = G__6143.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6143.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return not_found
          }
        }else {
          if(typeof coll === "string") {
            if(n < coll.length) {
              return coll[n]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, coll)) {
              return cljs.core._nth.call(null, coll, n)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                if(function() {
                  var G__6144 = coll;
                  if(G__6144) {
                    if(function() {
                      var or__3943__auto__ = G__6144.cljs$lang$protocol_mask$partition0$ & 64;
                      if(or__3943__auto__) {
                        return or__3943__auto__
                      }else {
                        return G__6144.cljs$core$ISeq$
                      }
                    }()) {
                      return true
                    }else {
                      if(!G__6144.cljs$lang$protocol_mask$partition0$) {
                        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6144)
                      }else {
                        return false
                      }
                    }
                  }else {
                    return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6144)
                  }
                }()) {
                  return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
                }else {
                  throw new Error([cljs.core.str("nth not supported on this type "), cljs.core.str(cljs.core.type__GT_str.call(null, cljs.core.type.call(null, coll)))].join(""));
                }
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$core$IFn$_invoke$arity$2 = nth__2;
  nth.cljs$core$IFn$_invoke$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    if(o == null) {
      return null
    }else {
      if(function() {
        var G__6147 = o;
        if(G__6147) {
          if(function() {
            var or__3943__auto__ = G__6147.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6147.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return null
          }
        }else {
          if(typeof o === "string") {
            if(k < o.length) {
              return o[k]
            }else {
              return null
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return null
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var get__3 = function(o, k, not_found) {
    if(!(o == null)) {
      if(function() {
        var G__6148 = o;
        if(G__6148) {
          if(function() {
            var or__3943__auto__ = G__6148.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6148.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return cljs.core._lookup.call(null, o, k, not_found)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return not_found
          }
        }else {
          if(typeof o === "string") {
            if(k < o.length) {
              return o[k]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.type_satisfies_.call(null, cljs.core.ILookup, o)) {
              return cljs.core._lookup.call(null, o, k, not_found)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$core$IFn$_invoke$arity$2 = get__2;
  get.cljs$core$IFn$_invoke$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    if(!(coll == null)) {
      return cljs.core._assoc.call(null, coll, k, v)
    }else {
      return cljs.core.hash_map.call(null, k, v)
    }
  };
  var assoc__4 = function() {
    var G__6149__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6150 = ret;
          var G__6151 = cljs.core.first.call(null, kvs);
          var G__6152 = cljs.core.second.call(null, kvs);
          var G__6153 = cljs.core.nnext.call(null, kvs);
          coll = G__6150;
          k = G__6151;
          v = G__6152;
          kvs = G__6153;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__6149 = function(coll, k, v, var_args) {
      var kvs = null;
      if(arguments.length > 3) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6149__delegate.call(this, coll, k, v, kvs)
    };
    G__6149.cljs$lang$maxFixedArity = 3;
    G__6149.cljs$lang$applyTo = function(arglist__6154) {
      var coll = cljs.core.first(arglist__6154);
      arglist__6154 = cljs.core.next(arglist__6154);
      var k = cljs.core.first(arglist__6154);
      arglist__6154 = cljs.core.next(arglist__6154);
      var v = cljs.core.first(arglist__6154);
      var kvs = cljs.core.rest(arglist__6154);
      return G__6149__delegate(coll, k, v, kvs)
    };
    G__6149.cljs$core$IFn$_invoke$arity$variadic = G__6149__delegate;
    return G__6149
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$core$IFn$_invoke$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$core$IFn$_invoke$arity$3 = assoc__3;
  assoc.cljs$core$IFn$_invoke$arity$variadic = assoc__4.cljs$core$IFn$_invoke$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6155__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6156 = ret;
          var G__6157 = cljs.core.first.call(null, ks);
          var G__6158 = cljs.core.next.call(null, ks);
          coll = G__6156;
          k = G__6157;
          ks = G__6158;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__6155 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6155__delegate.call(this, coll, k, ks)
    };
    G__6155.cljs$lang$maxFixedArity = 2;
    G__6155.cljs$lang$applyTo = function(arglist__6159) {
      var coll = cljs.core.first(arglist__6159);
      arglist__6159 = cljs.core.next(arglist__6159);
      var k = cljs.core.first(arglist__6159);
      var ks = cljs.core.rest(arglist__6159);
      return G__6155__delegate(coll, k, ks)
    };
    G__6155.cljs$core$IFn$_invoke$arity$variadic = G__6155__delegate;
    return G__6155
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$core$IFn$_invoke$arity$1 = dissoc__1;
  dissoc.cljs$core$IFn$_invoke$arity$2 = dissoc__2;
  dissoc.cljs$core$IFn$_invoke$arity$variadic = dissoc__3.cljs$core$IFn$_invoke$arity$variadic;
  return dissoc
}();
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3943__auto__ = goog.isFunction(f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__6161 = f;
    if(G__6161) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____$1 = null;
        if(cljs.core.truth_(or__3943__auto____$1)) {
          return or__3943__auto____$1
        }else {
          return G__6161.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__6161.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__6161)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__6161)
    }
  }
};
cljs.core.with_meta = function with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = cljs.core.fn_QMARK_.call(null, o);
    if(and__3941__auto__) {
      return!function() {
        var G__6167 = o;
        if(G__6167) {
          if(function() {
            var or__3943__auto__ = G__6167.cljs$lang$protocol_mask$partition0$ & 262144;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6167.cljs$core$IWithMeta$
            }
          }()) {
            return true
          }else {
            if(!G__6167.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__6167)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__6167)
        }
      }()
    }else {
      return and__3941__auto__
    }
  }()) {
    return with_meta.call(null, function() {
      if(typeof cljs.core.t6168 !== "undefined") {
      }else {
        goog.provide("cljs.core.t6168");
        cljs.core.t6168 = function(meta, o, with_meta, meta6169) {
          this.meta = meta;
          this.o = o;
          this.with_meta = with_meta;
          this.meta6169 = meta6169;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 393217
        };
        cljs.core.t6168.cljs$lang$type = true;
        cljs.core.t6168.cljs$lang$ctorStr = "cljs.core/t6168";
        cljs.core.t6168.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
          return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/t6168")
        };
        cljs.core.t6168.prototype.call = function() {
          var G__6172__delegate = function(self__, args) {
            var self____$1 = this;
            var _ = self____$1;
            return cljs.core.apply.call(null, self__.o, args)
          };
          var G__6172 = function(self__, var_args) {
            var self__ = this;
            var args = null;
            if(arguments.length > 1) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
            }
            return G__6172__delegate.call(this, self__, args)
          };
          G__6172.cljs$lang$maxFixedArity = 1;
          G__6172.cljs$lang$applyTo = function(arglist__6173) {
            var self__ = cljs.core.first(arglist__6173);
            var args = cljs.core.rest(arglist__6173);
            return G__6172__delegate(self__, args)
          };
          G__6172.cljs$core$IFn$_invoke$arity$variadic = G__6172__delegate;
          return G__6172
        }();
        cljs.core.t6168.prototype.apply = function(self__, args6171) {
          var self__ = this;
          return self__.call.apply(self__, [self__].concat(args6171.slice()))
        };
        cljs.core.t6168.prototype.cljs$core$Fn$ = true;
        cljs.core.t6168.prototype.cljs$core$IMeta$_meta$arity$1 = function(_6170) {
          var self__ = this;
          return self__.meta6169
        };
        cljs.core.t6168.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_6170, meta6169__$1) {
          var self__ = this;
          return new cljs.core.t6168(self__.meta, self__.o, self__.with_meta, meta6169__$1)
        };
        cljs.core.__GT_t6168 = function __GT_t6168(meta__$1, o__$1, with_meta__$1, meta6169) {
          return new cljs.core.t6168(meta__$1, o__$1, with_meta__$1, meta6169)
        }
      }
      return new cljs.core.t6168(meta, o, with_meta, null)
    }(), meta)
  }else {
    return cljs.core._with_meta.call(null, o, meta)
  }
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6175 = o;
    if(G__6175) {
      if(function() {
        var or__3943__auto__ = G__6175.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6175.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6175.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6175)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6175)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6176__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6177 = ret;
          var G__6178 = cljs.core.first.call(null, ks);
          var G__6179 = cljs.core.next.call(null, ks);
          coll = G__6177;
          k = G__6178;
          ks = G__6179;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__6176 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6176__delegate.call(this, coll, k, ks)
    };
    G__6176.cljs$lang$maxFixedArity = 2;
    G__6176.cljs$lang$applyTo = function(arglist__6180) {
      var coll = cljs.core.first(arglist__6180);
      arglist__6180 = cljs.core.next(arglist__6180);
      var k = cljs.core.first(arglist__6180);
      var ks = cljs.core.rest(arglist__6180);
      return G__6176__delegate(coll, k, ks)
    };
    G__6176.cljs$core$IFn$_invoke$arity$variadic = G__6176__delegate;
    return G__6176
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$core$IFn$_invoke$arity$1 = disj__1;
  disj.cljs$core$IFn$_invoke$arity$2 = disj__2;
  disj.cljs$core$IFn$_invoke$arity$variadic = disj__3.cljs$core$IFn$_invoke$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(typeof h === "number") {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto__ = goog.isString(o);
      if(and__3941__auto__) {
        return check_cache
      }else {
        return and__3941__auto__
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash.cljs$core$IFn$_invoke$arity$1 = hash__1;
  hash.cljs$core$IFn$_invoke$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3943__auto__ = coll == null;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6182 = x;
    if(G__6182) {
      if(function() {
        var or__3943__auto__ = G__6182.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6182.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6182.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6182)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6182)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6184 = x;
    if(G__6184) {
      if(function() {
        var or__3943__auto__ = G__6184.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6184.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6184.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6184)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6184)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6186 = x;
  if(G__6186) {
    if(function() {
      var or__3943__auto__ = G__6186.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6186.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6186.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6186)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6186)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6188 = x;
  if(G__6188) {
    if(function() {
      var or__3943__auto__ = G__6188.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6188.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6188.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6188)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6188)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6190 = x;
  if(G__6190) {
    if(function() {
      var or__3943__auto__ = G__6190.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6190.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6190.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6190)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6190)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6192 = x;
    if(G__6192) {
      if(function() {
        var or__3943__auto__ = G__6192.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6192.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6192.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6192)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6192)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6194 = x;
  if(G__6194) {
    if(function() {
      var or__3943__auto__ = G__6194.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6194.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6194.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6194)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6194)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6196 = x;
  if(G__6196) {
    if(function() {
      var or__3943__auto__ = G__6196.cljs$lang$protocol_mask$partition1$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6196.cljs$core$IChunkedSeq$
      }
    }()) {
      return true
    }else {
      return false
    }
  }else {
    return false
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6197__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6197 = function(var_args) {
      var keyvals = null;
      if(arguments.length > 0) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6197__delegate.call(this, keyvals)
    };
    G__6197.cljs$lang$maxFixedArity = 0;
    G__6197.cljs$lang$applyTo = function(arglist__6198) {
      var keyvals = cljs.core.seq(arglist__6198);
      return G__6197__delegate(keyvals)
    };
    G__6197.cljs$core$IFn$_invoke$arity$variadic = G__6197__delegate;
    return G__6197
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$core$IFn$_invoke$arity$0 = js_obj__0;
  js_obj.cljs$core$IFn$_invoke$arity$variadic = js_obj__1.cljs$core$IFn$_invoke$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__6199 = i__$1 + 1;
      var G__6200 = j__$1 + 1;
      var G__6201 = len__$1 - 1;
      i__$1 = G__6199;
      j__$1 = G__6200;
      len__$1 = G__6201;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__6202 = i__$1 - 1;
      var G__6203 = j__$1 - 1;
      var G__6204 = len__$1 - 1;
      i__$1 = G__6202;
      j__$1 = G__6203;
      len__$1 = G__6204;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6206 = s;
    if(G__6206) {
      if(function() {
        var or__3943__auto__ = G__6206.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6206.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6206.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6206)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6206)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6208 = s;
  if(G__6208) {
    if(function() {
      var or__3943__auto__ = G__6208.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6208.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6208.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6208)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6208)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto__ = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__6210 = f;
    if(G__6210) {
      if(function() {
        var or__3943__auto____$1 = G__6210.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          return G__6210.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6210.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6210)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6210)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto__ = typeof n === "number";
  if(and__3941__auto__) {
    var and__3941__auto____$1 = !isNaN(n);
    if(and__3941__auto____$1) {
      var and__3941__auto____$2 = !(n === Infinity);
      if(and__3941__auto____$2) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3941__auto____$2
      }
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.get.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3941__auto__ = !(coll == null);
    if(and__3941__auto__) {
      var and__3941__auto____$1 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____$1) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core.get.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__6211__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, null, x, null], true);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first.call(null, xs);
          var etc = cljs.core.next.call(null, xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_.call(null, s, x__$1)) {
              return false
            }else {
              var G__6212 = cljs.core.conj.call(null, s, x__$1);
              var G__6213 = etc;
              s = G__6212;
              xs = G__6213;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6211 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6211__delegate.call(this, x, y, more)
    };
    G__6211.cljs$lang$maxFixedArity = 2;
    G__6211.cljs$lang$applyTo = function(arglist__6214) {
      var x = cljs.core.first(arglist__6214);
      arglist__6214 = cljs.core.next(arglist__6214);
      var y = cljs.core.first(arglist__6214);
      var more = cljs.core.rest(arglist__6214);
      return G__6211__delegate(x, y, more)
    };
    G__6211.cljs$core$IFn$_invoke$arity$variadic = G__6211__delegate;
    return G__6211
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$variadic = distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__6216 = x;
            if(G__6216) {
              if(function() {
                var or__3943__auto__ = G__6216.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return G__6216.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                return false
              }
            }else {
              return false
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count.call(null, xs);
    var yl = cljs.core.count.call(null, ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return compare_indexed.call(null, xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto__ = d === 0;
        if(and__3941__auto__) {
          return n + 1 < len
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__6217 = xs;
        var G__6218 = ys;
        var G__6219 = len;
        var G__6220 = n + 1;
        xs = G__6217;
        ys = G__6218;
        len = G__6219;
        n = G__6220;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$core$IFn$_invoke$arity$2 = compare_indexed__2;
  compare_indexed.cljs$core$IFn$_invoke$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.call(null, x, y);
      if(typeof r === "number") {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$core$IFn$_invoke$arity$1 = sort__1;
  sort.cljs$core$IFn$_invoke$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$core$IFn$_invoke$arity$2 = sort_by__2;
  sort_by.cljs$core$IFn$_invoke$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4090__auto__) {
      var s = temp__4090__auto__;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s), cljs.core.next.call(null, s))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__$1) {
        var nval = f.call(null, val__$1, cljs.core.first.call(null, coll__$1));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__6221 = nval;
          var G__6222 = cljs.core.next.call(null, coll__$1);
          val__$1 = G__6221;
          coll__$1 = G__6222;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$core$IFn$_invoke$arity$2 = seq_reduce__2;
  seq_reduce.cljs$core$IFn$_invoke$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__6225 = coll;
      if(G__6225) {
        if(function() {
          var or__3943__auto__ = G__6225.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6225.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f)
      }else {
        if(typeof coll === "string") {
          return cljs.core.array_reduce.call(null, coll, f)
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core.seq_reduce.call(null, f, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__6226 = coll;
      if(G__6226) {
        if(function() {
          var or__3943__auto__ = G__6226.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6226.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.call(null, coll, f, val)
      }else {
        if(typeof coll === "string") {
          return cljs.core.array_reduce.call(null, coll, f, val)
        }else {
          if(cljs.core.type_satisfies_.call(null, cljs.core.IReduce, coll)) {
            return cljs.core._reduce.call(null, coll, f, val)
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return cljs.core.seq_reduce.call(null, f, val, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$core$IFn$_invoke$arity$2 = reduce__2;
  reduce.cljs$core$IFn$_invoke$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__6227__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__6227 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6227__delegate.call(this, x, y, more)
    };
    G__6227.cljs$lang$maxFixedArity = 2;
    G__6227.cljs$lang$applyTo = function(arglist__6228) {
      var x = cljs.core.first(arglist__6228);
      arglist__6228 = cljs.core.next(arglist__6228);
      var y = cljs.core.first(arglist__6228);
      var more = cljs.core.rest(arglist__6228);
      return G__6227__delegate(x, y, more)
    };
    G__6227.cljs$core$IFn$_invoke$arity$variadic = G__6227__delegate;
    return G__6227
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$core$IFn$_invoke$arity$0 = _PLUS___0;
  _PLUS_.cljs$core$IFn$_invoke$arity$1 = _PLUS___1;
  _PLUS_.cljs$core$IFn$_invoke$arity$2 = _PLUS___2;
  _PLUS_.cljs$core$IFn$_invoke$arity$variadic = _PLUS___3.cljs$core$IFn$_invoke$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__6229__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__6229 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6229__delegate.call(this, x, y, more)
    };
    G__6229.cljs$lang$maxFixedArity = 2;
    G__6229.cljs$lang$applyTo = function(arglist__6230) {
      var x = cljs.core.first(arglist__6230);
      arglist__6230 = cljs.core.next(arglist__6230);
      var y = cljs.core.first(arglist__6230);
      var more = cljs.core.rest(arglist__6230);
      return G__6229__delegate(x, y, more)
    };
    G__6229.cljs$core$IFn$_invoke$arity$variadic = G__6229__delegate;
    return G__6229
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$core$IFn$_invoke$arity$1 = ___1;
  _.cljs$core$IFn$_invoke$arity$2 = ___2;
  _.cljs$core$IFn$_invoke$arity$variadic = ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__6231__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__6231 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6231__delegate.call(this, x, y, more)
    };
    G__6231.cljs$lang$maxFixedArity = 2;
    G__6231.cljs$lang$applyTo = function(arglist__6232) {
      var x = cljs.core.first(arglist__6232);
      arglist__6232 = cljs.core.next(arglist__6232);
      var y = cljs.core.first(arglist__6232);
      var more = cljs.core.rest(arglist__6232);
      return G__6231__delegate(x, y, more)
    };
    G__6231.cljs$core$IFn$_invoke$arity$variadic = G__6231__delegate;
    return G__6231
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$core$IFn$_invoke$arity$0 = _STAR___0;
  _STAR_.cljs$core$IFn$_invoke$arity$1 = _STAR___1;
  _STAR_.cljs$core$IFn$_invoke$arity$2 = _STAR___2;
  _STAR_.cljs$core$IFn$_invoke$arity$variadic = _STAR___3.cljs$core$IFn$_invoke$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__6233__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__6233 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6233__delegate.call(this, x, y, more)
    };
    G__6233.cljs$lang$maxFixedArity = 2;
    G__6233.cljs$lang$applyTo = function(arglist__6234) {
      var x = cljs.core.first(arglist__6234);
      arglist__6234 = cljs.core.next(arglist__6234);
      var y = cljs.core.first(arglist__6234);
      var more = cljs.core.rest(arglist__6234);
      return G__6233__delegate(x, y, more)
    };
    G__6233.cljs$core$IFn$_invoke$arity$variadic = G__6233__delegate;
    return G__6233
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$core$IFn$_invoke$arity$1 = _SLASH___1;
  _SLASH_.cljs$core$IFn$_invoke$arity$2 = _SLASH___2;
  _SLASH_.cljs$core$IFn$_invoke$arity$variadic = _SLASH___3.cljs$core$IFn$_invoke$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__6235__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__6236 = y;
            var G__6237 = cljs.core.first.call(null, more);
            var G__6238 = cljs.core.next.call(null, more);
            x = G__6236;
            y = G__6237;
            more = G__6238;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6235 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6235__delegate.call(this, x, y, more)
    };
    G__6235.cljs$lang$maxFixedArity = 2;
    G__6235.cljs$lang$applyTo = function(arglist__6239) {
      var x = cljs.core.first(arglist__6239);
      arglist__6239 = cljs.core.next(arglist__6239);
      var y = cljs.core.first(arglist__6239);
      var more = cljs.core.rest(arglist__6239);
      return G__6235__delegate(x, y, more)
    };
    G__6235.cljs$core$IFn$_invoke$arity$variadic = G__6235__delegate;
    return G__6235
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$core$IFn$_invoke$arity$1 = _LT___1;
  _LT_.cljs$core$IFn$_invoke$arity$2 = _LT___2;
  _LT_.cljs$core$IFn$_invoke$arity$variadic = _LT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__6240__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6241 = y;
            var G__6242 = cljs.core.first.call(null, more);
            var G__6243 = cljs.core.next.call(null, more);
            x = G__6241;
            y = G__6242;
            more = G__6243;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6240 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6240__delegate.call(this, x, y, more)
    };
    G__6240.cljs$lang$maxFixedArity = 2;
    G__6240.cljs$lang$applyTo = function(arglist__6244) {
      var x = cljs.core.first(arglist__6244);
      arglist__6244 = cljs.core.next(arglist__6244);
      var y = cljs.core.first(arglist__6244);
      var more = cljs.core.rest(arglist__6244);
      return G__6240__delegate(x, y, more)
    };
    G__6240.cljs$core$IFn$_invoke$arity$variadic = G__6240__delegate;
    return G__6240
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__6245__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__6246 = y;
            var G__6247 = cljs.core.first.call(null, more);
            var G__6248 = cljs.core.next.call(null, more);
            x = G__6246;
            y = G__6247;
            more = G__6248;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6245 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6245__delegate.call(this, x, y, more)
    };
    G__6245.cljs$lang$maxFixedArity = 2;
    G__6245.cljs$lang$applyTo = function(arglist__6249) {
      var x = cljs.core.first(arglist__6249);
      arglist__6249 = cljs.core.next(arglist__6249);
      var y = cljs.core.first(arglist__6249);
      var more = cljs.core.rest(arglist__6249);
      return G__6245__delegate(x, y, more)
    };
    G__6245.cljs$core$IFn$_invoke$arity$variadic = G__6245__delegate;
    return G__6245
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$core$IFn$_invoke$arity$1 = _GT___1;
  _GT_.cljs$core$IFn$_invoke$arity$2 = _GT___2;
  _GT_.cljs$core$IFn$_invoke$arity$variadic = _GT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__6250__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6251 = y;
            var G__6252 = cljs.core.first.call(null, more);
            var G__6253 = cljs.core.next.call(null, more);
            x = G__6251;
            y = G__6252;
            more = G__6253;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6250 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6250__delegate.call(this, x, y, more)
    };
    G__6250.cljs$lang$maxFixedArity = 2;
    G__6250.cljs$lang$applyTo = function(arglist__6254) {
      var x = cljs.core.first(arglist__6254);
      arglist__6254 = cljs.core.next(arglist__6254);
      var y = cljs.core.first(arglist__6254);
      var more = cljs.core.rest(arglist__6254);
      return G__6250__delegate(x, y, more)
    };
    G__6250.cljs$core$IFn$_invoke$arity$variadic = G__6250__delegate;
    return G__6250
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    var x__3224__auto__ = x;
    var y__3225__auto__ = y;
    return x__3224__auto__ > y__3225__auto__ ? x__3224__auto__ : y__3225__auto__
  };
  var max__3 = function() {
    var G__6255__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, function() {
        var x__3224__auto__ = x;
        var y__3225__auto__ = y;
        return x__3224__auto__ > y__3225__auto__ ? x__3224__auto__ : y__3225__auto__
      }(), more)
    };
    var G__6255 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6255__delegate.call(this, x, y, more)
    };
    G__6255.cljs$lang$maxFixedArity = 2;
    G__6255.cljs$lang$applyTo = function(arglist__6256) {
      var x = cljs.core.first(arglist__6256);
      arglist__6256 = cljs.core.next(arglist__6256);
      var y = cljs.core.first(arglist__6256);
      var more = cljs.core.rest(arglist__6256);
      return G__6255__delegate(x, y, more)
    };
    G__6255.cljs$core$IFn$_invoke$arity$variadic = G__6255__delegate;
    return G__6255
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$core$IFn$_invoke$arity$1 = max__1;
  max.cljs$core$IFn$_invoke$arity$2 = max__2;
  max.cljs$core$IFn$_invoke$arity$variadic = max__3.cljs$core$IFn$_invoke$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    var x__3231__auto__ = x;
    var y__3232__auto__ = y;
    return x__3231__auto__ < y__3232__auto__ ? x__3231__auto__ : y__3232__auto__
  };
  var min__3 = function() {
    var G__6257__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, function() {
        var x__3231__auto__ = x;
        var y__3232__auto__ = y;
        return x__3231__auto__ < y__3232__auto__ ? x__3231__auto__ : y__3232__auto__
      }(), more)
    };
    var G__6257 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6257__delegate.call(this, x, y, more)
    };
    G__6257.cljs$lang$maxFixedArity = 2;
    G__6257.cljs$lang$applyTo = function(arglist__6258) {
      var x = cljs.core.first(arglist__6258);
      arglist__6258 = cljs.core.next(arglist__6258);
      var y = cljs.core.first(arglist__6258);
      var more = cljs.core.rest(arglist__6258);
      return G__6257__delegate(x, y, more)
    };
    G__6257.cljs$core$IFn$_invoke$arity$variadic = G__6257__delegate;
    return G__6257
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$core$IFn$_invoke$arity$1 = min__1;
  min.cljs$core$IFn$_invoke$arity$2 = min__2;
  min.cljs$core$IFn$_invoke$arity$variadic = min__3.cljs$core$IFn$_invoke$arity$variadic;
  return min
}();
cljs.core.byte$ = function byte$(x) {
  return x
};
cljs.core.char$ = function char$(x) {
  if(typeof x === "number") {
    return String.fromCharCode(x)
  }else {
    if(function() {
      var and__3941__auto__ = typeof x === "string";
      if(and__3941__auto__) {
        return x.length === 1
      }else {
        return and__3941__auto__
      }
    }()) {
      return x
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw new Error("Argument to char must be a character or number");
      }else {
        return null
      }
    }
  }
};
cljs.core.short$ = function short$(x) {
  return x
};
cljs.core.float$ = function float$(x) {
  return x
};
cljs.core.double$ = function double$(x) {
  return x
};
cljs.core.unchecked_byte = function unchecked_byte(x) {
  return x
};
cljs.core.unchecked_char = function unchecked_char(x) {
  return x
};
cljs.core.unchecked_short = function unchecked_short(x) {
  return x
};
cljs.core.unchecked_float = function unchecked_float(x) {
  return x
};
cljs.core.unchecked_double = function unchecked_double(x) {
  return x
};
cljs.core.unchecked_add = function() {
  var unchecked_add = null;
  var unchecked_add__0 = function() {
    return 0
  };
  var unchecked_add__1 = function(x) {
    return x
  };
  var unchecked_add__2 = function(x, y) {
    return x + y
  };
  var unchecked_add__3 = function() {
    var G__6259__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add, x + y, more)
    };
    var G__6259 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6259__delegate.call(this, x, y, more)
    };
    G__6259.cljs$lang$maxFixedArity = 2;
    G__6259.cljs$lang$applyTo = function(arglist__6260) {
      var x = cljs.core.first(arglist__6260);
      arglist__6260 = cljs.core.next(arglist__6260);
      var y = cljs.core.first(arglist__6260);
      var more = cljs.core.rest(arglist__6260);
      return G__6259__delegate(x, y, more)
    };
    G__6259.cljs$core$IFn$_invoke$arity$variadic = G__6259__delegate;
    return G__6259
  }();
  unchecked_add = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add__0.call(this);
      case 1:
        return unchecked_add__1.call(this, x);
      case 2:
        return unchecked_add__2.call(this, x, y);
      default:
        return unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add.cljs$lang$maxFixedArity = 2;
  unchecked_add.cljs$lang$applyTo = unchecked_add__3.cljs$lang$applyTo;
  unchecked_add.cljs$core$IFn$_invoke$arity$0 = unchecked_add__0;
  unchecked_add.cljs$core$IFn$_invoke$arity$1 = unchecked_add__1;
  unchecked_add.cljs$core$IFn$_invoke$arity$2 = unchecked_add__2;
  unchecked_add.cljs$core$IFn$_invoke$arity$variadic = unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add
}();
cljs.core.unchecked_add_int = function() {
  var unchecked_add_int = null;
  var unchecked_add_int__0 = function() {
    return 0
  };
  var unchecked_add_int__1 = function(x) {
    return x
  };
  var unchecked_add_int__2 = function(x, y) {
    return x + y
  };
  var unchecked_add_int__3 = function() {
    var G__6261__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_add_int, x + y, more)
    };
    var G__6261 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6261__delegate.call(this, x, y, more)
    };
    G__6261.cljs$lang$maxFixedArity = 2;
    G__6261.cljs$lang$applyTo = function(arglist__6262) {
      var x = cljs.core.first(arglist__6262);
      arglist__6262 = cljs.core.next(arglist__6262);
      var y = cljs.core.first(arglist__6262);
      var more = cljs.core.rest(arglist__6262);
      return G__6261__delegate(x, y, more)
    };
    G__6261.cljs$core$IFn$_invoke$arity$variadic = G__6261__delegate;
    return G__6261
  }();
  unchecked_add_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add_int__0.call(this);
      case 1:
        return unchecked_add_int__1.call(this, x);
      case 2:
        return unchecked_add_int__2.call(this, x, y);
      default:
        return unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add_int.cljs$lang$maxFixedArity = 2;
  unchecked_add_int.cljs$lang$applyTo = unchecked_add_int__3.cljs$lang$applyTo;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$0 = unchecked_add_int__0;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$1 = unchecked_add_int__1;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$2 = unchecked_add_int__2;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add_int
}();
cljs.core.unchecked_dec = function unchecked_dec(x) {
  return x - 1
};
cljs.core.unchecked_dec_int = function unchecked_dec_int(x) {
  return x - 1
};
cljs.core.unchecked_divide_int = function() {
  var unchecked_divide_int = null;
  var unchecked_divide_int__1 = function(x) {
    return unchecked_divide_int.call(null, 1, x)
  };
  var unchecked_divide_int__2 = function(x, y) {
    return x / y
  };
  var unchecked_divide_int__3 = function() {
    var G__6263__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_divide_int, unchecked_divide_int.call(null, x, y), more)
    };
    var G__6263 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6263__delegate.call(this, x, y, more)
    };
    G__6263.cljs$lang$maxFixedArity = 2;
    G__6263.cljs$lang$applyTo = function(arglist__6264) {
      var x = cljs.core.first(arglist__6264);
      arglist__6264 = cljs.core.next(arglist__6264);
      var y = cljs.core.first(arglist__6264);
      var more = cljs.core.rest(arglist__6264);
      return G__6263__delegate(x, y, more)
    };
    G__6263.cljs$core$IFn$_invoke$arity$variadic = G__6263__delegate;
    return G__6263
  }();
  unchecked_divide_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_divide_int__1.call(this, x);
      case 2:
        return unchecked_divide_int__2.call(this, x, y);
      default:
        return unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_divide_int.cljs$lang$maxFixedArity = 2;
  unchecked_divide_int.cljs$lang$applyTo = unchecked_divide_int__3.cljs$lang$applyTo;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$1 = unchecked_divide_int__1;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$2 = unchecked_divide_int__2;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_divide_int
}();
cljs.core.unchecked_inc = function unchecked_inc(x) {
  return x + 1
};
cljs.core.unchecked_inc_int = function unchecked_inc_int(x) {
  return x + 1
};
cljs.core.unchecked_multiply = function() {
  var unchecked_multiply = null;
  var unchecked_multiply__0 = function() {
    return 1
  };
  var unchecked_multiply__1 = function(x) {
    return x
  };
  var unchecked_multiply__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply__3 = function() {
    var G__6265__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply, x * y, more)
    };
    var G__6265 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6265__delegate.call(this, x, y, more)
    };
    G__6265.cljs$lang$maxFixedArity = 2;
    G__6265.cljs$lang$applyTo = function(arglist__6266) {
      var x = cljs.core.first(arglist__6266);
      arglist__6266 = cljs.core.next(arglist__6266);
      var y = cljs.core.first(arglist__6266);
      var more = cljs.core.rest(arglist__6266);
      return G__6265__delegate(x, y, more)
    };
    G__6265.cljs$core$IFn$_invoke$arity$variadic = G__6265__delegate;
    return G__6265
  }();
  unchecked_multiply = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply__0.call(this);
      case 1:
        return unchecked_multiply__1.call(this, x);
      case 2:
        return unchecked_multiply__2.call(this, x, y);
      default:
        return unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply.cljs$lang$maxFixedArity = 2;
  unchecked_multiply.cljs$lang$applyTo = unchecked_multiply__3.cljs$lang$applyTo;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply__0;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply__1;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply__2;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply
}();
cljs.core.unchecked_multiply_int = function() {
  var unchecked_multiply_int = null;
  var unchecked_multiply_int__0 = function() {
    return 1
  };
  var unchecked_multiply_int__1 = function(x) {
    return x
  };
  var unchecked_multiply_int__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply_int__3 = function() {
    var G__6267__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_multiply_int, x * y, more)
    };
    var G__6267 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6267__delegate.call(this, x, y, more)
    };
    G__6267.cljs$lang$maxFixedArity = 2;
    G__6267.cljs$lang$applyTo = function(arglist__6268) {
      var x = cljs.core.first(arglist__6268);
      arglist__6268 = cljs.core.next(arglist__6268);
      var y = cljs.core.first(arglist__6268);
      var more = cljs.core.rest(arglist__6268);
      return G__6267__delegate(x, y, more)
    };
    G__6267.cljs$core$IFn$_invoke$arity$variadic = G__6267__delegate;
    return G__6267
  }();
  unchecked_multiply_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply_int__0.call(this);
      case 1:
        return unchecked_multiply_int__1.call(this, x);
      case 2:
        return unchecked_multiply_int__2.call(this, x, y);
      default:
        return unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply_int.cljs$lang$maxFixedArity = 2;
  unchecked_multiply_int.cljs$lang$applyTo = unchecked_multiply_int__3.cljs$lang$applyTo;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply_int__0;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply_int__1;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply_int__2;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply_int
}();
cljs.core.unchecked_negate = function unchecked_negate(x) {
  return-x
};
cljs.core.unchecked_negate_int = function unchecked_negate_int(x) {
  return-x
};
cljs.core.unchecked_remainder_int = function unchecked_remainder_int(x, n) {
  return cljs.core.mod.call(null, x, n)
};
cljs.core.unchecked_substract = function() {
  var unchecked_substract = null;
  var unchecked_substract__1 = function(x) {
    return-x
  };
  var unchecked_substract__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract__3 = function() {
    var G__6269__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract, x - y, more)
    };
    var G__6269 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6269__delegate.call(this, x, y, more)
    };
    G__6269.cljs$lang$maxFixedArity = 2;
    G__6269.cljs$lang$applyTo = function(arglist__6270) {
      var x = cljs.core.first(arglist__6270);
      arglist__6270 = cljs.core.next(arglist__6270);
      var y = cljs.core.first(arglist__6270);
      var more = cljs.core.rest(arglist__6270);
      return G__6269__delegate(x, y, more)
    };
    G__6269.cljs$core$IFn$_invoke$arity$variadic = G__6269__delegate;
    return G__6269
  }();
  unchecked_substract = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract__1.call(this, x);
      case 2:
        return unchecked_substract__2.call(this, x, y);
      default:
        return unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract.cljs$lang$maxFixedArity = 2;
  unchecked_substract.cljs$lang$applyTo = unchecked_substract__3.cljs$lang$applyTo;
  unchecked_substract.cljs$core$IFn$_invoke$arity$1 = unchecked_substract__1;
  unchecked_substract.cljs$core$IFn$_invoke$arity$2 = unchecked_substract__2;
  unchecked_substract.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract
}();
cljs.core.unchecked_substract_int = function() {
  var unchecked_substract_int = null;
  var unchecked_substract_int__1 = function(x) {
    return-x
  };
  var unchecked_substract_int__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract_int__3 = function() {
    var G__6271__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, unchecked_substract_int, x - y, more)
    };
    var G__6271 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6271__delegate.call(this, x, y, more)
    };
    G__6271.cljs$lang$maxFixedArity = 2;
    G__6271.cljs$lang$applyTo = function(arglist__6272) {
      var x = cljs.core.first(arglist__6272);
      arglist__6272 = cljs.core.next(arglist__6272);
      var y = cljs.core.first(arglist__6272);
      var more = cljs.core.rest(arglist__6272);
      return G__6271__delegate(x, y, more)
    };
    G__6271.cljs$core$IFn$_invoke$arity$variadic = G__6271__delegate;
    return G__6271
  }();
  unchecked_substract_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract_int__1.call(this, x);
      case 2:
        return unchecked_substract_int__2.call(this, x, y);
      default:
        return unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract_int.cljs$lang$maxFixedArity = 2;
  unchecked_substract_int.cljs$lang$applyTo = unchecked_substract_int__3.cljs$lang$applyTo;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$1 = unchecked_substract_int__1;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$2 = unchecked_substract_int__2;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract_int
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return x | 0
};
cljs.core.unchecked_int = function unchecked_int(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.unchecked_long = function unchecked_long(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.booleans = function booleans(x) {
  return x
};
cljs.core.bytes = function bytes(x) {
  return x
};
cljs.core.chars = function chars(x) {
  return x
};
cljs.core.shorts = function shorts(x) {
  return x
};
cljs.core.ints = function ints(x) {
  return x
};
cljs.core.floats = function floats(x) {
  return x
};
cljs.core.doubles = function doubles(x) {
  return x
};
cljs.core.longs = function longs(x) {
  return x
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix.call(null, (n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot.call(null, n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__6273__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6274 = y;
            var G__6275 = cljs.core.first.call(null, more);
            var G__6276 = cljs.core.next.call(null, more);
            x = G__6274;
            y = G__6275;
            more = G__6276;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6273 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6273__delegate.call(this, x, y, more)
    };
    G__6273.cljs$lang$maxFixedArity = 2;
    G__6273.cljs$lang$applyTo = function(arglist__6277) {
      var x = cljs.core.first(arglist__6277);
      arglist__6277 = cljs.core.next(arglist__6277);
      var y = cljs.core.first(arglist__6277);
      var more = cljs.core.rest(arglist__6277);
      return G__6273__delegate(x, y, more)
    };
    G__6273.cljs$core$IFn$_invoke$arity$variadic = G__6273__delegate;
    return G__6273
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = xs;
      if(and__3941__auto__) {
        return n__$1 > 0
      }else {
        return and__3941__auto__
      }
    }())) {
      var G__6278 = n__$1 - 1;
      var G__6279 = cljs.core.next.call(null, xs);
      n__$1 = G__6278;
      xs = G__6279;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(x == null) {
      return""
    }else {
      return x.toString()
    }
  };
  var str__2 = function() {
    var G__6280__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6281 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__6282 = cljs.core.next.call(null, more);
            sb = G__6281;
            more = G__6282;
            continue
          }else {
            return sb.toString()
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__6280 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6280__delegate.call(this, x, ys)
    };
    G__6280.cljs$lang$maxFixedArity = 1;
    G__6280.cljs$lang$applyTo = function(arglist__6283) {
      var x = cljs.core.first(arglist__6283);
      var ys = cljs.core.rest(arglist__6283);
      return G__6280__delegate(x, ys)
    };
    G__6280.cljs$core$IFn$_invoke$arity$variadic = G__6280__delegate;
    return G__6280
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$core$IFn$_invoke$arity$0 = str__0;
  str.cljs$core$IFn$_invoke$arity$1 = str__1;
  str.cljs$core$IFn$_invoke$arity$variadic = str__2.cljs$core$IFn$_invoke$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$core$IFn$_invoke$arity$2 = subs__2;
  subs.cljs$core$IFn$_invoke$arity$3 = subs__3;
  return subs
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs = cljs.core.seq.call(null, x);
    var ys = cljs.core.seq.call(null, y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs), cljs.core.first.call(null, ys))) {
            var G__6284 = cljs.core.next.call(null, xs);
            var G__6285 = cljs.core.next.call(null, ys);
            xs = G__6284;
            ys = G__6285;
            continue
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__6286_SHARP_, p2__6287_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__6286_SHARP_, cljs.core.hash.call(null, p2__6287_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq.call(null, m);
  while(true) {
    if(s) {
      var e = cljs.core.first.call(null, s);
      var G__6288 = (h + (cljs.core.hash.call(null, cljs.core.key.call(null, e)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__6289 = cljs.core.next.call(null, s);
      h = G__6288;
      s = G__6289;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first.call(null, s__$1);
      var G__6290 = (h + cljs.core.hash.call(null, e)) % 4503599627370496;
      var G__6291 = cljs.core.next.call(null, s__$1);
      h = G__6290;
      s__$1 = G__6291;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var seq__6298_6304 = cljs.core.seq.call(null, fn_map);
  var chunk__6299_6305 = null;
  var count__6300_6306 = 0;
  var i__6301_6307 = 0;
  while(true) {
    if(i__6301_6307 < count__6300_6306) {
      var vec__6302_6308 = cljs.core._nth.call(null, chunk__6299_6305, i__6301_6307);
      var key_name_6309 = cljs.core.nth.call(null, vec__6302_6308, 0, null);
      var f_6310 = cljs.core.nth.call(null, vec__6302_6308, 1, null);
      var str_name_6311 = cljs.core.name.call(null, key_name_6309);
      obj[str_name_6311] = f_6310;
      var G__6312 = seq__6298_6304;
      var G__6313 = chunk__6299_6305;
      var G__6314 = count__6300_6306;
      var G__6315 = i__6301_6307 + 1;
      seq__6298_6304 = G__6312;
      chunk__6299_6305 = G__6313;
      count__6300_6306 = G__6314;
      i__6301_6307 = G__6315;
      continue
    }else {
      var temp__4092__auto___6316 = cljs.core.seq.call(null, seq__6298_6304);
      if(temp__4092__auto___6316) {
        var seq__6298_6317__$1 = temp__4092__auto___6316;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6298_6317__$1)) {
          var c__3615__auto___6318 = cljs.core.chunk_first.call(null, seq__6298_6317__$1);
          var G__6319 = cljs.core.chunk_rest.call(null, seq__6298_6317__$1);
          var G__6320 = c__3615__auto___6318;
          var G__6321 = cljs.core.count.call(null, c__3615__auto___6318);
          var G__6322 = 0;
          seq__6298_6304 = G__6319;
          chunk__6299_6305 = G__6320;
          count__6300_6306 = G__6321;
          i__6301_6307 = G__6322;
          continue
        }else {
          var vec__6303_6323 = cljs.core.first.call(null, seq__6298_6317__$1);
          var key_name_6324 = cljs.core.nth.call(null, vec__6303_6323, 0, null);
          var f_6325 = cljs.core.nth.call(null, vec__6303_6323, 1, null);
          var str_name_6326 = cljs.core.name.call(null, key_name_6324);
          obj[str_name_6326] = f_6325;
          var G__6327 = cljs.core.next.call(null, seq__6298_6317__$1);
          var G__6328 = null;
          var G__6329 = 0;
          var G__6330 = 0;
          seq__6298_6304 = G__6327;
          chunk__6299_6305 = G__6328;
          count__6300_6306 = G__6329;
          i__6301_6307 = G__6330;
          continue
        }
      }else {
      }
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65937646
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorStr = "cljs.core/List";
cljs.core.List.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, coll, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.List.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.List.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.__GT_List = function __GT_List(meta, first, rest, count, __hash) {
  return new cljs.core.List(meta, first, rest, count, __hash)
};
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65937614
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorStr = "cljs.core/EmptyList";
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.__GT_EmptyList = function __GT_EmptyList(meta) {
  return new cljs.core.EmptyList(meta)
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__6332 = coll;
  if(G__6332) {
    if(function() {
      var or__3943__auto__ = G__6332.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6332.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__6332.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6332)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6332)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list__delegate = function(xs) {
    var arr = xs instanceof cljs.core.IndexedSeq ? xs.arr : function() {
      var arr = [];
      var xs__$1 = xs;
      while(true) {
        if(!(xs__$1 == null)) {
          arr.push(cljs.core._first.call(null, xs__$1));
          var G__6333 = cljs.core._next.call(null, xs__$1);
          xs__$1 = G__6333;
          continue
        }else {
          return arr
        }
        break
      }
    }();
    var i = arr.length;
    var r = cljs.core.List.EMPTY;
    while(true) {
      if(i > 0) {
        var G__6334 = i - 1;
        var G__6335 = cljs.core._conj.call(null, r, arr[i - 1]);
        i = G__6334;
        r = G__6335;
        continue
      }else {
        return r
      }
      break
    }
  };
  var list = function(var_args) {
    var xs = null;
    if(arguments.length > 0) {
      xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, xs)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__6336) {
    var xs = cljs.core.seq(arglist__6336);
    return list__delegate(xs)
  };
  list.cljs$core$IFn$_invoke$arity$variadic = list__delegate;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65929452
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorStr = "cljs.core/Cons";
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core.seq.call(null, self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.Cons(null, o, coll, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.Cons.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_Cons = function __GT_Cons(meta, first, rest, __hash) {
  return new cljs.core.Cons(meta, first, rest, __hash)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto__ = coll == null;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var G__6338 = coll;
      if(G__6338) {
        if(function() {
          var or__3943__auto____$1 = G__6338.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            return G__6338.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__6340 = x;
  if(G__6340) {
    if(function() {
      var or__3943__auto__ = G__6340.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__6340.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__6340.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6340)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6340)
  }
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(ns, name, fqn, _hash) {
  this.ns = ns;
  this.name = name;
  this.fqn = fqn;
  this._hash = _hash;
  this.cljs$lang$protocol_mask$partition0$ = 2153775105;
  this.cljs$lang$protocol_mask$partition1$ = 4096
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorStr = "cljs.core/Keyword";
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  return cljs.core._write.call(null, writer, [cljs.core.str(":"), cljs.core.str(self__.fqn)].join(""))
};
cljs.core.Keyword.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  return self__.name
};
cljs.core.Keyword.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  return self__.ns
};
cljs.core.Keyword.prototype.cljs$core$IHash$_hash$arity$1 = function(_) {
  var self__ = this;
  if(self__._hash == null) {
    self__._hash = cljs.core.hash_combine.call(null, cljs.core.hash.call(null, self__.ns), cljs.core.hash.call(null, self__.name)) + 2654435769;
    return self__._hash
  }else {
    return self__._hash
  }
};
cljs.core.Keyword.prototype.call = function() {
  var G__6344 = null;
  var G__6344__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var kw = self____$1;
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6342 = coll;
        if(G__6342) {
          if(function() {
            var or__3943__auto__ = G__6342.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6342.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            if(!G__6342.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__6342)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__6342)
        }
      }()) {
        return cljs.core._lookup.call(null, coll, kw, null)
      }else {
        return null
      }
    }
  };
  var G__6344__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var kw = self____$1;
    if(coll == null) {
      return not_found
    }else {
      if(function() {
        var G__6343 = coll;
        if(G__6343) {
          if(function() {
            var or__3943__auto__ = G__6343.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__6343.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            if(!G__6343.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__6343)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__6343)
        }
      }()) {
        return cljs.core._lookup.call(null, coll, kw, not_found)
      }else {
        return not_found
      }
    }
  };
  G__6344 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6344__2.call(this, self__, coll);
      case 3:
        return G__6344__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6344
}();
cljs.core.Keyword.prototype.apply = function(self__, args6341) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6341.slice()))
};
cljs.core.Keyword.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  if(other instanceof cljs.core.Keyword) {
    return self__.fqn === other.fqn
  }else {
    return false
  }
};
cljs.core.Keyword.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return[cljs.core.str(":"), cljs.core.str(self__.fqn)].join("")
};
cljs.core.__GT_Keyword = function __GT_Keyword(ns, name, fqn, _hash) {
  return new cljs.core.Keyword(ns, name, fqn, _hash)
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  return x instanceof cljs.core.Keyword
};
cljs.core.keyword_identical_QMARK_ = function keyword_identical_QMARK_(x, y) {
  if(x === y) {
    return true
  }else {
    if(function() {
      var and__3941__auto__ = x instanceof cljs.core.Keyword;
      if(and__3941__auto__) {
        return y instanceof cljs.core.Keyword
      }else {
        return and__3941__auto__
      }
    }()) {
      return x.fqn === y.fqn
    }else {
      return false
    }
  }
};
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(name instanceof cljs.core.Keyword) {
      return name
    }else {
      if(name instanceof cljs.core.Symbol) {
        return new cljs.core.Keyword(null, cljs.core.name.call(null, name), cljs.core.name.call(null, name), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.Keyword(null, name, name, null)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return new cljs.core.Keyword(ns, name, [cljs.core.str(cljs.core.truth_(ns) ? [cljs.core.str(ns), cljs.core.str("/")].join("") : null), cljs.core.str(name)].join(""), null)
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$core$IFn$_invoke$arity$1 = keyword__1;
  keyword.cljs$core$IFn$_invoke$arity$2 = keyword__2;
  return keyword
}();
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, fn, s, __hash) {
  this.meta = meta;
  this.fn = fn;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374988
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorStr = "cljs.core/LazySeq";
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  coll.cljs$core$ISeqable$_seq$arity$1(coll);
  if(self__.s == null) {
    return null
  }else {
    return cljs.core.next.call(null, self__.s)
  }
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.LazySeq.prototype.sval = function() {
  var self__ = this;
  var coll = this;
  if(self__.fn == null) {
    return self__.s
  }else {
    self__.s = self__.fn.call(null);
    self__.fn = null;
    return self__.s
  }
};
cljs.core.LazySeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  coll.sval();
  if(self__.s == null) {
    return null
  }else {
    var ls = self__.s;
    while(true) {
      if(ls instanceof cljs.core.LazySeq) {
        var G__6345 = ls.sval();
        ls = G__6345;
        continue
      }else {
        self__.s = ls;
        return cljs.core.seq.call(null, self__.s)
      }
      break
    }
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  coll.cljs$core$ISeqable$_seq$arity$1(coll);
  if(self__.s == null) {
    return null
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  coll.cljs$core$ISeqable$_seq$arity$1(coll);
  if(!(self__.s == null)) {
    return cljs.core.rest.call(null, self__.s)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.LazySeq(meta__$1, self__.fn, self__.s, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_LazySeq = function __GT_LazySeq(meta, fn, s, __hash) {
  return new cljs.core.LazySeq(meta, fn, s, __hash)
};
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorStr = "cljs.core/ChunkBuffer";
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.__GT_ChunkBuffer = function __GT_ChunkBuffer(buf, end) {
  return new cljs.core.ChunkBuffer(buf, end)
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(new Array(capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorStr = "cljs.core/ArrayChunk";
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = i >= 0;
    if(and__3941__auto__) {
      return i < self__.end - self__.off
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end - self__.off
};
cljs.core.__GT_ArrayChunk = function __GT_ArrayChunk(arr, off, end) {
  return new cljs.core.ArrayChunk(arr, off, end)
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return new cljs.core.ArrayChunk(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return new cljs.core.ArrayChunk(arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$core$IFn$_invoke$arity$1 = array_chunk__1;
  array_chunk.cljs$core$IFn$_invoke$arity$2 = array_chunk__2;
  array_chunk.cljs$core$IFn$_invoke$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850732;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorStr = "cljs.core/ChunkedCons";
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    var more__$1 = cljs.core._seq.call(null, self__.more);
    if(more__$1 == null) {
      return null
    }else {
      return more__$1
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.__GT_ChunkedCons = function __GT_ChunkedCons(chunk, more, meta, __hash) {
  return new cljs.core.ChunkedCons(chunk, more, meta, __hash)
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__6347 = s;
    if(G__6347) {
      if(function() {
        var or__3943__auto__ = G__6347.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6347.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__$1)) {
      ary.push(cljs.core.first.call(null, s__$1));
      var G__6348 = cljs.core.next.call(null, s__$1);
      s__$1 = G__6348;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = new Array(cljs.core.count.call(null, coll));
  var i_6349 = 0;
  var xs_6350 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs_6350) {
      ret[i_6349] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs_6350));
      var G__6351 = i_6349 + 1;
      var G__6352 = cljs.core.next.call(null, xs_6350);
      i_6349 = G__6351;
      xs_6350 = G__6352;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.int_array = function() {
  var int_array = null;
  var int_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return int_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var int_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6353 = i + 1;
          var G__6354 = cljs.core.next.call(null, s__$1);
          i = G__6353;
          s__$1 = G__6354;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3662__auto___6355 = size;
      var i_6356 = 0;
      while(true) {
        if(i_6356 < n__3662__auto___6355) {
          a[i_6356] = init_val_or_seq;
          var G__6357 = i_6356 + 1;
          i_6356 = G__6357;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  int_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return int_array__1.call(this, size);
      case 2:
        return int_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  int_array.cljs$core$IFn$_invoke$arity$1 = int_array__1;
  int_array.cljs$core$IFn$_invoke$arity$2 = int_array__2;
  return int_array
}();
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return long_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6358 = i + 1;
          var G__6359 = cljs.core.next.call(null, s__$1);
          i = G__6358;
          s__$1 = G__6359;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3662__auto___6360 = size;
      var i_6361 = 0;
      while(true) {
        if(i_6361 < n__3662__auto___6360) {
          a[i_6361] = init_val_or_seq;
          var G__6362 = i_6361 + 1;
          i_6361 = G__6362;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$core$IFn$_invoke$arity$1 = long_array__1;
  long_array.cljs$core$IFn$_invoke$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return double_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6363 = i + 1;
          var G__6364 = cljs.core.next.call(null, s__$1);
          i = G__6363;
          s__$1 = G__6364;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3662__auto___6365 = size;
      var i_6366 = 0;
      while(true) {
        if(i_6366 < n__3662__auto___6365) {
          a[i_6366] = init_val_or_seq;
          var G__6367 = i_6366 + 1;
          i_6366 = G__6367;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$core$IFn$_invoke$arity$1 = double_array__1;
  double_array.cljs$core$IFn$_invoke$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return object_array.call(null, size_or_seq, null)
    }else {
      return cljs.core.into_array.call(null, size_or_seq)
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__6368 = i + 1;
          var G__6369 = cljs.core.next.call(null, s__$1);
          i = G__6368;
          s__$1 = G__6369;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3662__auto___6370 = size;
      var i_6371 = 0;
      while(true) {
        if(i_6371 < n__3662__auto___6370) {
          a[i_6371] = init_val_or_seq;
          var G__6372 = i_6371 + 1;
          i_6371 = G__6372;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$core$IFn$_invoke$arity$1 = object_array__1;
  object_array.cljs$core$IFn$_invoke$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = i > 0;
        if(and__3941__auto__) {
          return cljs.core.seq.call(null, s__$1)
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__6373 = cljs.core.next.call(null, s__$1);
        var G__6374 = i - 1;
        var G__6375 = sum + 1;
        s__$1 = G__6373;
        i = G__6374;
        sum = G__6375;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, function() {
      return null
    }, null, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, function() {
      return x
    }, null, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, function() {
      var s = cljs.core.seq.call(null, x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s), concat.call(null, cljs.core.chunk_rest.call(null, s), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s), concat.call(null, cljs.core.rest.call(null, s), y))
        }
      }else {
        return y
      }
    }, null, null)
  };
  var concat__3 = function() {
    var G__6376__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, function() {
          var xys__$1 = cljs.core.seq.call(null, xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__$1)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__$1), cat.call(null, cljs.core.chunk_rest.call(null, xys__$1), zs__$1))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__$1), cat.call(null, cljs.core.rest.call(null, xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat.call(null, cljs.core.first.call(null, zs__$1), cljs.core.next.call(null, zs__$1))
            }else {
              return null
            }
          }
        }, null, null)
      };
      return cat.call(null, concat.call(null, x, y), zs)
    };
    var G__6376 = function(x, y, var_args) {
      var zs = null;
      if(arguments.length > 2) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6376__delegate.call(this, x, y, zs)
    };
    G__6376.cljs$lang$maxFixedArity = 2;
    G__6376.cljs$lang$applyTo = function(arglist__6377) {
      var x = cljs.core.first(arglist__6377);
      arglist__6377 = cljs.core.next(arglist__6377);
      var y = cljs.core.first(arglist__6377);
      var zs = cljs.core.rest(arglist__6377);
      return G__6376__delegate(x, y, zs)
    };
    G__6376.cljs$core$IFn$_invoke$arity$variadic = G__6376__delegate;
    return G__6376
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$core$IFn$_invoke$arity$0 = concat__0;
  concat.cljs$core$IFn$_invoke$arity$1 = concat__1;
  concat.cljs$core$IFn$_invoke$arity$2 = concat__2;
  concat.cljs$core$IFn$_invoke$arity$variadic = concat__3.cljs$core$IFn$_invoke$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__6378__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__6378 = function(a, b, c, d, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6378__delegate.call(this, a, b, c, d, more)
    };
    G__6378.cljs$lang$maxFixedArity = 4;
    G__6378.cljs$lang$applyTo = function(arglist__6379) {
      var a = cljs.core.first(arglist__6379);
      arglist__6379 = cljs.core.next(arglist__6379);
      var b = cljs.core.first(arglist__6379);
      arglist__6379 = cljs.core.next(arglist__6379);
      var c = cljs.core.first(arglist__6379);
      arglist__6379 = cljs.core.next(arglist__6379);
      var d = cljs.core.first(arglist__6379);
      var more = cljs.core.rest(arglist__6379);
      return G__6378__delegate(a, b, c, d, more)
    };
    G__6378.cljs$core$IFn$_invoke$arity$variadic = G__6378__delegate;
    return G__6378
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$core$IFn$_invoke$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$core$IFn$_invoke$arity$1 = list_STAR___1;
  list_STAR_.cljs$core$IFn$_invoke$arity$2 = list_STAR___2;
  list_STAR_.cljs$core$IFn$_invoke$arity$3 = list_STAR___3;
  list_STAR_.cljs$core$IFn$_invoke$arity$4 = list_STAR___4;
  list_STAR_.cljs$core$IFn$_invoke$arity$variadic = list_STAR___5.cljs$core$IFn$_invoke$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a = cljs.core._first.call(null, args__$1);
    var args__$2 = cljs.core._rest.call(null, args__$1);
    if(argc === 1) {
      if(f.cljs$core$IFn$_invoke$arity$1) {
        return f.cljs$core$IFn$_invoke$arity$1(a)
      }else {
        return f.call(null, a)
      }
    }else {
      var b = cljs.core._first.call(null, args__$2);
      var args__$3 = cljs.core._rest.call(null, args__$2);
      if(argc === 2) {
        if(f.cljs$core$IFn$_invoke$arity$2) {
          return f.cljs$core$IFn$_invoke$arity$2(a, b)
        }else {
          return f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first.call(null, args__$3);
        var args__$4 = cljs.core._rest.call(null, args__$3);
        if(argc === 3) {
          if(f.cljs$core$IFn$_invoke$arity$3) {
            return f.cljs$core$IFn$_invoke$arity$3(a, b, c)
          }else {
            return f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first.call(null, args__$4);
          var args__$5 = cljs.core._rest.call(null, args__$4);
          if(argc === 4) {
            if(f.cljs$core$IFn$_invoke$arity$4) {
              return f.cljs$core$IFn$_invoke$arity$4(a, b, c, d)
            }else {
              return f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first.call(null, args__$5);
            var args__$6 = cljs.core._rest.call(null, args__$5);
            if(argc === 5) {
              if(f.cljs$core$IFn$_invoke$arity$5) {
                return f.cljs$core$IFn$_invoke$arity$5(a, b, c, d, e)
              }else {
                return f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first.call(null, args__$6);
              var args__$7 = cljs.core._rest.call(null, args__$6);
              if(argc === 6) {
                if(f__$1.cljs$core$IFn$_invoke$arity$6) {
                  return f__$1.cljs$core$IFn$_invoke$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first.call(null, args__$7);
                var args__$8 = cljs.core._rest.call(null, args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$core$IFn$_invoke$arity$7) {
                    return f__$1.cljs$core$IFn$_invoke$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first.call(null, args__$8);
                  var args__$9 = cljs.core._rest.call(null, args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$core$IFn$_invoke$arity$8) {
                      return f__$1.cljs$core$IFn$_invoke$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first.call(null, args__$9);
                    var args__$10 = cljs.core._rest.call(null, args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$core$IFn$_invoke$arity$9) {
                        return f__$1.cljs$core$IFn$_invoke$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first.call(null, args__$10);
                      var args__$11 = cljs.core._rest.call(null, args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$core$IFn$_invoke$arity$10) {
                          return f__$1.cljs$core$IFn$_invoke$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first.call(null, args__$11);
                        var args__$12 = cljs.core._rest.call(null, args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$core$IFn$_invoke$arity$11) {
                            return f__$1.cljs$core$IFn$_invoke$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first.call(null, args__$12);
                          var args__$13 = cljs.core._rest.call(null, args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$core$IFn$_invoke$arity$12) {
                              return f__$1.cljs$core$IFn$_invoke$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first.call(null, args__$13);
                            var args__$14 = cljs.core._rest.call(null, args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$core$IFn$_invoke$arity$13) {
                                return f__$1.cljs$core$IFn$_invoke$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first.call(null, args__$14);
                              var args__$15 = cljs.core._rest.call(null, args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$core$IFn$_invoke$arity$14) {
                                  return f__$1.cljs$core$IFn$_invoke$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first.call(null, args__$15);
                                var args__$16 = cljs.core._rest.call(null, args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$core$IFn$_invoke$arity$15) {
                                    return f__$1.cljs$core$IFn$_invoke$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first.call(null, args__$16);
                                  var args__$17 = cljs.core._rest.call(null, args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$core$IFn$_invoke$arity$16) {
                                      return f__$1.cljs$core$IFn$_invoke$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first.call(null, args__$17);
                                    var args__$18 = cljs.core._rest.call(null, args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$core$IFn$_invoke$arity$17) {
                                        return f__$1.cljs$core$IFn$_invoke$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first.call(null, args__$18);
                                      var args__$19 = cljs.core._rest.call(null, args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$core$IFn$_invoke$arity$18) {
                                          return f__$1.cljs$core$IFn$_invoke$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first.call(null, args__$19);
                                        var args__$20 = cljs.core._rest.call(null, args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$core$IFn$_invoke$arity$19) {
                                            return f__$1.cljs$core$IFn$_invoke$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first.call(null, args__$20);
                                          var args__$21 = cljs.core._rest.call(null, args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$core$IFn$_invoke$arity$20) {
                                              return f__$1.cljs$core$IFn$_invoke$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__6 = function() {
    var G__6380__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to.call(null, f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist))
      }
    };
    var G__6380 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(arguments.length > 5) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6380__delegate.call(this, f, a, b, c, d, args)
    };
    G__6380.cljs$lang$maxFixedArity = 5;
    G__6380.cljs$lang$applyTo = function(arglist__6381) {
      var f = cljs.core.first(arglist__6381);
      arglist__6381 = cljs.core.next(arglist__6381);
      var a = cljs.core.first(arglist__6381);
      arglist__6381 = cljs.core.next(arglist__6381);
      var b = cljs.core.first(arglist__6381);
      arglist__6381 = cljs.core.next(arglist__6381);
      var c = cljs.core.first(arglist__6381);
      arglist__6381 = cljs.core.next(arglist__6381);
      var d = cljs.core.first(arglist__6381);
      var args = cljs.core.rest(arglist__6381);
      return G__6380__delegate(f, a, b, c, d, args)
    };
    G__6380.cljs$core$IFn$_invoke$arity$variadic = G__6380__delegate;
    return G__6380
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$core$IFn$_invoke$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$core$IFn$_invoke$arity$2 = apply__2;
  apply.cljs$core$IFn$_invoke$arity$3 = apply__3;
  apply.cljs$core$IFn$_invoke$arity$4 = apply__4;
  apply.cljs$core$IFn$_invoke$arity$5 = apply__5;
  apply.cljs$core$IFn$_invoke$arity$variadic = apply__6.cljs$core$IFn$_invoke$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__6382) {
    var obj = cljs.core.first(arglist__6382);
    arglist__6382 = cljs.core.next(arglist__6382);
    var f = cljs.core.first(arglist__6382);
    var args = cljs.core.rest(arglist__6382);
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$core$IFn$_invoke$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__6383__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__6383 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6383__delegate.call(this, x, y, more)
    };
    G__6383.cljs$lang$maxFixedArity = 2;
    G__6383.cljs$lang$applyTo = function(arglist__6384) {
      var x = cljs.core.first(arglist__6384);
      arglist__6384 = cljs.core.next(arglist__6384);
      var y = cljs.core.first(arglist__6384);
      var more = cljs.core.rest(arglist__6384);
      return G__6383__delegate(x, y, more)
    };
    G__6383.cljs$core$IFn$_invoke$arity$variadic = G__6383__delegate;
    return G__6383
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$core$IFn$_invoke$arity$1 = not_EQ___1;
  not_EQ_.cljs$core$IFn$_invoke$arity$2 = not_EQ___2;
  not_EQ_.cljs$core$IFn$_invoke$arity$variadic = not_EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__6385 = pred;
        var G__6386 = cljs.core.next.call(null, coll);
        pred = G__6385;
        coll = G__6386;
        continue
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto__ = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        var G__6387 = pred;
        var G__6388 = cljs.core.next.call(null, coll);
        pred = G__6387;
        coll = G__6388;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__6389 = null;
    var G__6389__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__6389__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__6389__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__6389__3 = function() {
      var G__6390__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__6390 = function(x, y, var_args) {
        var zs = null;
        if(arguments.length > 2) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__6390__delegate.call(this, x, y, zs)
      };
      G__6390.cljs$lang$maxFixedArity = 2;
      G__6390.cljs$lang$applyTo = function(arglist__6391) {
        var x = cljs.core.first(arglist__6391);
        arglist__6391 = cljs.core.next(arglist__6391);
        var y = cljs.core.first(arglist__6391);
        var zs = cljs.core.rest(arglist__6391);
        return G__6390__delegate(x, y, zs)
      };
      G__6390.cljs$core$IFn$_invoke$arity$variadic = G__6390__delegate;
      return G__6390
    }();
    G__6389 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__6389__0.call(this);
        case 1:
          return G__6389__1.call(this, x);
        case 2:
          return G__6389__2.call(this, x, y);
        default:
          return G__6389__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__6389.cljs$lang$maxFixedArity = 2;
    G__6389.cljs$lang$applyTo = G__6389__3.cljs$lang$applyTo;
    return G__6389
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__6392__delegate = function(args) {
      return x
    };
    var G__6392 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6392__delegate.call(this, args)
    };
    G__6392.cljs$lang$maxFixedArity = 0;
    G__6392.cljs$lang$applyTo = function(arglist__6393) {
      var args = cljs.core.seq(arglist__6393);
      return G__6392__delegate(args)
    };
    G__6392.cljs$core$IFn$_invoke$arity$variadic = G__6392__delegate;
    return G__6392
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__6394 = null;
      var G__6394__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__6394__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__6394__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__6394__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__6394__4 = function() {
        var G__6395__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6395 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6395__delegate.call(this, x, y, z, args)
        };
        G__6395.cljs$lang$maxFixedArity = 3;
        G__6395.cljs$lang$applyTo = function(arglist__6396) {
          var x = cljs.core.first(arglist__6396);
          arglist__6396 = cljs.core.next(arglist__6396);
          var y = cljs.core.first(arglist__6396);
          arglist__6396 = cljs.core.next(arglist__6396);
          var z = cljs.core.first(arglist__6396);
          var args = cljs.core.rest(arglist__6396);
          return G__6395__delegate(x, y, z, args)
        };
        G__6395.cljs$core$IFn$_invoke$arity$variadic = G__6395__delegate;
        return G__6395
      }();
      G__6394 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6394__0.call(this);
          case 1:
            return G__6394__1.call(this, x);
          case 2:
            return G__6394__2.call(this, x, y);
          case 3:
            return G__6394__3.call(this, x, y, z);
          default:
            return G__6394__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6394.cljs$lang$maxFixedArity = 3;
      G__6394.cljs$lang$applyTo = G__6394__4.cljs$lang$applyTo;
      return G__6394
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__6397 = null;
      var G__6397__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__6397__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__6397__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__6397__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__6397__4 = function() {
        var G__6398__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__6398 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6398__delegate.call(this, x, y, z, args)
        };
        G__6398.cljs$lang$maxFixedArity = 3;
        G__6398.cljs$lang$applyTo = function(arglist__6399) {
          var x = cljs.core.first(arglist__6399);
          arglist__6399 = cljs.core.next(arglist__6399);
          var y = cljs.core.first(arglist__6399);
          arglist__6399 = cljs.core.next(arglist__6399);
          var z = cljs.core.first(arglist__6399);
          var args = cljs.core.rest(arglist__6399);
          return G__6398__delegate(x, y, z, args)
        };
        G__6398.cljs$core$IFn$_invoke$arity$variadic = G__6398__delegate;
        return G__6398
      }();
      G__6397 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6397__0.call(this);
          case 1:
            return G__6397__1.call(this, x);
          case 2:
            return G__6397__2.call(this, x, y);
          case 3:
            return G__6397__3.call(this, x, y, z);
          default:
            return G__6397__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6397.cljs$lang$maxFixedArity = 3;
      G__6397.cljs$lang$applyTo = G__6397__4.cljs$lang$applyTo;
      return G__6397
    }()
  };
  var comp__4 = function() {
    var G__6400__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__6401__delegate = function(args) {
          var ret = cljs.core.apply.call(null, cljs.core.first.call(null, fs__$1), args);
          var fs__$2 = cljs.core.next.call(null, fs__$1);
          while(true) {
            if(fs__$2) {
              var G__6402 = cljs.core.first.call(null, fs__$2).call(null, ret);
              var G__6403 = cljs.core.next.call(null, fs__$2);
              ret = G__6402;
              fs__$2 = G__6403;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__6401 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__6401__delegate.call(this, args)
        };
        G__6401.cljs$lang$maxFixedArity = 0;
        G__6401.cljs$lang$applyTo = function(arglist__6404) {
          var args = cljs.core.seq(arglist__6404);
          return G__6401__delegate(args)
        };
        G__6401.cljs$core$IFn$_invoke$arity$variadic = G__6401__delegate;
        return G__6401
      }()
    };
    var G__6400 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6400__delegate.call(this, f1, f2, f3, fs)
    };
    G__6400.cljs$lang$maxFixedArity = 3;
    G__6400.cljs$lang$applyTo = function(arglist__6405) {
      var f1 = cljs.core.first(arglist__6405);
      arglist__6405 = cljs.core.next(arglist__6405);
      var f2 = cljs.core.first(arglist__6405);
      arglist__6405 = cljs.core.next(arglist__6405);
      var f3 = cljs.core.first(arglist__6405);
      var fs = cljs.core.rest(arglist__6405);
      return G__6400__delegate(f1, f2, f3, fs)
    };
    G__6400.cljs$core$IFn$_invoke$arity$variadic = G__6400__delegate;
    return G__6400
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$core$IFn$_invoke$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$core$IFn$_invoke$arity$0 = comp__0;
  comp.cljs$core$IFn$_invoke$arity$1 = comp__1;
  comp.cljs$core$IFn$_invoke$arity$2 = comp__2;
  comp.cljs$core$IFn$_invoke$arity$3 = comp__3;
  comp.cljs$core$IFn$_invoke$arity$variadic = comp__4.cljs$core$IFn$_invoke$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__1 = function(f) {
    return f
  };
  var partial__2 = function(f, arg1) {
    return function() {
      var G__6406__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__6406 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6406__delegate.call(this, args)
      };
      G__6406.cljs$lang$maxFixedArity = 0;
      G__6406.cljs$lang$applyTo = function(arglist__6407) {
        var args = cljs.core.seq(arglist__6407);
        return G__6406__delegate(args)
      };
      G__6406.cljs$core$IFn$_invoke$arity$variadic = G__6406__delegate;
      return G__6406
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__6408__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__6408 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6408__delegate.call(this, args)
      };
      G__6408.cljs$lang$maxFixedArity = 0;
      G__6408.cljs$lang$applyTo = function(arglist__6409) {
        var args = cljs.core.seq(arglist__6409);
        return G__6408__delegate(args)
      };
      G__6408.cljs$core$IFn$_invoke$arity$variadic = G__6408__delegate;
      return G__6408
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__6410__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__6410 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6410__delegate.call(this, args)
      };
      G__6410.cljs$lang$maxFixedArity = 0;
      G__6410.cljs$lang$applyTo = function(arglist__6411) {
        var args = cljs.core.seq(arglist__6411);
        return G__6410__delegate(args)
      };
      G__6410.cljs$core$IFn$_invoke$arity$variadic = G__6410__delegate;
      return G__6410
    }()
  };
  var partial__5 = function() {
    var G__6412__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__6413__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__6413 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__6413__delegate.call(this, args)
        };
        G__6413.cljs$lang$maxFixedArity = 0;
        G__6413.cljs$lang$applyTo = function(arglist__6414) {
          var args = cljs.core.seq(arglist__6414);
          return G__6413__delegate(args)
        };
        G__6413.cljs$core$IFn$_invoke$arity$variadic = G__6413__delegate;
        return G__6413
      }()
    };
    var G__6412 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6412__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__6412.cljs$lang$maxFixedArity = 4;
    G__6412.cljs$lang$applyTo = function(arglist__6415) {
      var f = cljs.core.first(arglist__6415);
      arglist__6415 = cljs.core.next(arglist__6415);
      var arg1 = cljs.core.first(arglist__6415);
      arglist__6415 = cljs.core.next(arglist__6415);
      var arg2 = cljs.core.first(arglist__6415);
      arglist__6415 = cljs.core.next(arglist__6415);
      var arg3 = cljs.core.first(arglist__6415);
      var more = cljs.core.rest(arglist__6415);
      return G__6412__delegate(f, arg1, arg2, arg3, more)
    };
    G__6412.cljs$core$IFn$_invoke$arity$variadic = G__6412__delegate;
    return G__6412
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return partial__1.call(this, f);
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$core$IFn$_invoke$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$core$IFn$_invoke$arity$1 = partial__1;
  partial.cljs$core$IFn$_invoke$arity$2 = partial__2;
  partial.cljs$core$IFn$_invoke$arity$3 = partial__3;
  partial.cljs$core$IFn$_invoke$arity$4 = partial__4;
  partial.cljs$core$IFn$_invoke$arity$variadic = partial__5.cljs$core$IFn$_invoke$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__6416 = null;
      var G__6416__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__6416__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__6416__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__6416__4 = function() {
        var G__6417__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__6417 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6417__delegate.call(this, a, b, c, ds)
        };
        G__6417.cljs$lang$maxFixedArity = 3;
        G__6417.cljs$lang$applyTo = function(arglist__6418) {
          var a = cljs.core.first(arglist__6418);
          arglist__6418 = cljs.core.next(arglist__6418);
          var b = cljs.core.first(arglist__6418);
          arglist__6418 = cljs.core.next(arglist__6418);
          var c = cljs.core.first(arglist__6418);
          var ds = cljs.core.rest(arglist__6418);
          return G__6417__delegate(a, b, c, ds)
        };
        G__6417.cljs$core$IFn$_invoke$arity$variadic = G__6417__delegate;
        return G__6417
      }();
      G__6416 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__6416__1.call(this, a);
          case 2:
            return G__6416__2.call(this, a, b);
          case 3:
            return G__6416__3.call(this, a, b, c);
          default:
            return G__6416__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6416.cljs$lang$maxFixedArity = 3;
      G__6416.cljs$lang$applyTo = G__6416__4.cljs$lang$applyTo;
      return G__6416
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__6419 = null;
      var G__6419__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__6419__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__6419__4 = function() {
        var G__6420__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__6420 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6420__delegate.call(this, a, b, c, ds)
        };
        G__6420.cljs$lang$maxFixedArity = 3;
        G__6420.cljs$lang$applyTo = function(arglist__6421) {
          var a = cljs.core.first(arglist__6421);
          arglist__6421 = cljs.core.next(arglist__6421);
          var b = cljs.core.first(arglist__6421);
          arglist__6421 = cljs.core.next(arglist__6421);
          var c = cljs.core.first(arglist__6421);
          var ds = cljs.core.rest(arglist__6421);
          return G__6420__delegate(a, b, c, ds)
        };
        G__6420.cljs$core$IFn$_invoke$arity$variadic = G__6420__delegate;
        return G__6420
      }();
      G__6419 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__6419__2.call(this, a, b);
          case 3:
            return G__6419__3.call(this, a, b, c);
          default:
            return G__6419__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6419.cljs$lang$maxFixedArity = 3;
      G__6419.cljs$lang$applyTo = G__6419__4.cljs$lang$applyTo;
      return G__6419
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__6422 = null;
      var G__6422__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__6422__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__6422__4 = function() {
        var G__6423__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__6423 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6423__delegate.call(this, a, b, c, ds)
        };
        G__6423.cljs$lang$maxFixedArity = 3;
        G__6423.cljs$lang$applyTo = function(arglist__6424) {
          var a = cljs.core.first(arglist__6424);
          arglist__6424 = cljs.core.next(arglist__6424);
          var b = cljs.core.first(arglist__6424);
          arglist__6424 = cljs.core.next(arglist__6424);
          var c = cljs.core.first(arglist__6424);
          var ds = cljs.core.rest(arglist__6424);
          return G__6423__delegate(a, b, c, ds)
        };
        G__6423.cljs$core$IFn$_invoke$arity$variadic = G__6423__delegate;
        return G__6423
      }();
      G__6422 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__6422__2.call(this, a, b);
          case 3:
            return G__6422__3.call(this, a, b, c);
          default:
            return G__6422__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6422.cljs$lang$maxFixedArity = 3;
      G__6422.cljs$lang$applyTo = G__6422__4.cljs$lang$applyTo;
      return G__6422
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$core$IFn$_invoke$arity$2 = fnil__2;
  fnil.cljs$core$IFn$_invoke$arity$3 = fnil__3;
  fnil.cljs$core$IFn$_invoke$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3662__auto___6425 = size;
          var i_6426 = 0;
          while(true) {
            if(i_6426 < n__3662__auto___6425) {
              cljs.core.chunk_append.call(null, b, f.call(null, idx + i_6426, cljs.core._nth.call(null, c, i_6426)));
              var G__6427 = i_6426 + 1;
              i_6426 = G__6427;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), mapi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null, null)
  };
  return mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__3662__auto___6428 = size;
        var i_6429 = 0;
        while(true) {
          if(i_6429 < n__3662__auto___6428) {
            var x_6430 = f.call(null, cljs.core._nth.call(null, c, i_6429));
            if(x_6430 == null) {
            }else {
              cljs.core.chunk_append.call(null, b, x_6430)
            }
            var G__6431 = i_6429 + 1;
            i_6429 = G__6431;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keep.call(null, f, cljs.core.chunk_rest.call(null, s)))
      }else {
        var x = f.call(null, cljs.core.first.call(null, s));
        if(x == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s))
        }else {
          return cljs.core.cons.call(null, x, keep.call(null, f, cljs.core.rest.call(null, s)))
        }
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3662__auto___6432 = size;
          var i_6433 = 0;
          while(true) {
            if(i_6433 < n__3662__auto___6432) {
              var x_6434 = f.call(null, idx + i_6433, cljs.core._nth.call(null, c, i_6433));
              if(x_6434 == null) {
              }else {
                cljs.core.chunk_append.call(null, b, x_6434)
              }
              var G__6435 = i_6433 + 1;
              i_6433 = G__6435;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keepi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          var x = f.call(null, idx, cljs.core.first.call(null, s));
          if(x == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s))
          }else {
            return cljs.core.cons.call(null, x, keepi.call(null, idx + 1, cljs.core.rest.call(null, s)))
          }
        }
      }else {
        return null
      }
    }, null, null)
  };
  return keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p.call(null, y)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__6442__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__6442 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6442__delegate.call(this, x, y, z, args)
        };
        G__6442.cljs$lang$maxFixedArity = 3;
        G__6442.cljs$lang$applyTo = function(arglist__6443) {
          var x = cljs.core.first(arglist__6443);
          arglist__6443 = cljs.core.next(arglist__6443);
          var y = cljs.core.first(arglist__6443);
          arglist__6443 = cljs.core.next(arglist__6443);
          var z = cljs.core.first(arglist__6443);
          var args = cljs.core.rest(arglist__6443);
          return G__6442__delegate(x, y, z, args)
        };
        G__6442.cljs$core$IFn$_invoke$arity$variadic = G__6442__delegate;
        return G__6442
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$core$IFn$_invoke$arity$0 = ep1__0;
      ep1.cljs$core$IFn$_invoke$arity$1 = ep1__1;
      ep1.cljs$core$IFn$_invoke$arity$2 = ep1__2;
      ep1.cljs$core$IFn$_invoke$arity$3 = ep1__3;
      ep1.cljs$core$IFn$_invoke$arity$variadic = ep1__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__6444__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__6436_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__6436_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  return p2.call(null, p1__6436_SHARP_)
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__6444 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6444__delegate.call(this, x, y, z, args)
        };
        G__6444.cljs$lang$maxFixedArity = 3;
        G__6444.cljs$lang$applyTo = function(arglist__6445) {
          var x = cljs.core.first(arglist__6445);
          arglist__6445 = cljs.core.next(arglist__6445);
          var y = cljs.core.first(arglist__6445);
          arglist__6445 = cljs.core.next(arglist__6445);
          var z = cljs.core.first(arglist__6445);
          var args = cljs.core.rest(arglist__6445);
          return G__6444__delegate(x, y, z, args)
        };
        G__6444.cljs$core$IFn$_invoke$arity$variadic = G__6444__delegate;
        return G__6444
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$core$IFn$_invoke$arity$0 = ep2__0;
      ep2.cljs$core$IFn$_invoke$arity$1 = ep2__1;
      ep2.cljs$core$IFn$_invoke$arity$2 = ep2__2;
      ep2.cljs$core$IFn$_invoke$arity$3 = ep2__3;
      ep2.cljs$core$IFn$_invoke$arity$variadic = ep2__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    var and__3941__auto____$5 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____$5)) {
                      var and__3941__auto____$6 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____$6)) {
                        var and__3941__auto____$7 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____$7)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____$7
                        }
                      }else {
                        return and__3941__auto____$6
                      }
                    }else {
                      return and__3941__auto____$5
                    }
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__6446__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto__ = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__6437_SHARP_) {
                var and__3941__auto____$1 = p1.call(null, p1__6437_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  var and__3941__auto____$2 = p2.call(null, p1__6437_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____$2)) {
                    return p3.call(null, p1__6437_SHARP_)
                  }else {
                    return and__3941__auto____$2
                  }
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__6446 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6446__delegate.call(this, x, y, z, args)
        };
        G__6446.cljs$lang$maxFixedArity = 3;
        G__6446.cljs$lang$applyTo = function(arglist__6447) {
          var x = cljs.core.first(arglist__6447);
          arglist__6447 = cljs.core.next(arglist__6447);
          var y = cljs.core.first(arglist__6447);
          arglist__6447 = cljs.core.next(arglist__6447);
          var z = cljs.core.first(arglist__6447);
          var args = cljs.core.rest(arglist__6447);
          return G__6446__delegate(x, y, z, args)
        };
        G__6446.cljs$core$IFn$_invoke$arity$variadic = G__6446__delegate;
        return G__6446
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$core$IFn$_invoke$arity$0 = ep3__0;
      ep3.cljs$core$IFn$_invoke$arity$1 = ep3__1;
      ep3.cljs$core$IFn$_invoke$arity$2 = ep3__2;
      ep3.cljs$core$IFn$_invoke$arity$3 = ep3__3;
      ep3.cljs$core$IFn$_invoke$arity$variadic = ep3__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__6448__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__6438_SHARP_) {
            return p1__6438_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__6439_SHARP_) {
            var and__3941__auto__ = p1__6439_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              return p1__6439_SHARP_.call(null, y)
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__6440_SHARP_) {
            var and__3941__auto__ = p1__6440_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              var and__3941__auto____$1 = p1__6440_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____$1)) {
                return p1__6440_SHARP_.call(null, z)
              }else {
                return and__3941__auto____$1
              }
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__6449__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto__ = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto__)) {
                return cljs.core.every_QMARK_.call(null, function(p1__6441_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__6441_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3941__auto__
              }
            }())
          };
          var G__6449 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6449__delegate.call(this, x, y, z, args)
          };
          G__6449.cljs$lang$maxFixedArity = 3;
          G__6449.cljs$lang$applyTo = function(arglist__6450) {
            var x = cljs.core.first(arglist__6450);
            arglist__6450 = cljs.core.next(arglist__6450);
            var y = cljs.core.first(arglist__6450);
            arglist__6450 = cljs.core.next(arglist__6450);
            var z = cljs.core.first(arglist__6450);
            var args = cljs.core.rest(arglist__6450);
            return G__6449__delegate(x, y, z, args)
          };
          G__6449.cljs$core$IFn$_invoke$arity$variadic = G__6449__delegate;
          return G__6449
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$core$IFn$_invoke$arity$0 = epn__0;
        epn.cljs$core$IFn$_invoke$arity$1 = epn__1;
        epn.cljs$core$IFn$_invoke$arity$2 = epn__2;
        epn.cljs$core$IFn$_invoke$arity$3 = epn__3;
        epn.cljs$core$IFn$_invoke$arity$variadic = epn__4.cljs$core$IFn$_invoke$arity$variadic;
        return epn
      }()
    };
    var G__6448 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6448__delegate.call(this, p1, p2, p3, ps)
    };
    G__6448.cljs$lang$maxFixedArity = 3;
    G__6448.cljs$lang$applyTo = function(arglist__6451) {
      var p1 = cljs.core.first(arglist__6451);
      arglist__6451 = cljs.core.next(arglist__6451);
      var p2 = cljs.core.first(arglist__6451);
      arglist__6451 = cljs.core.next(arglist__6451);
      var p3 = cljs.core.first(arglist__6451);
      var ps = cljs.core.rest(arglist__6451);
      return G__6448__delegate(p1, p2, p3, ps)
    };
    G__6448.cljs$core$IFn$_invoke$arity$variadic = G__6448__delegate;
    return G__6448
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$core$IFn$_invoke$arity$1 = every_pred__1;
  every_pred.cljs$core$IFn$_invoke$arity$2 = every_pred__2;
  every_pred.cljs$core$IFn$_invoke$arity$3 = every_pred__3;
  every_pred.cljs$core$IFn$_invoke$arity$variadic = every_pred__4.cljs$core$IFn$_invoke$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__6458__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__6458 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6458__delegate.call(this, x, y, z, args)
        };
        G__6458.cljs$lang$maxFixedArity = 3;
        G__6458.cljs$lang$applyTo = function(arglist__6459) {
          var x = cljs.core.first(arglist__6459);
          arglist__6459 = cljs.core.next(arglist__6459);
          var y = cljs.core.first(arglist__6459);
          arglist__6459 = cljs.core.next(arglist__6459);
          var z = cljs.core.first(arglist__6459);
          var args = cljs.core.rest(arglist__6459);
          return G__6458__delegate(x, y, z, args)
        };
        G__6458.cljs$core$IFn$_invoke$arity$variadic = G__6458__delegate;
        return G__6458
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$core$IFn$_invoke$arity$0 = sp1__0;
      sp1.cljs$core$IFn$_invoke$arity$1 = sp1__1;
      sp1.cljs$core$IFn$_invoke$arity$2 = sp1__2;
      sp1.cljs$core$IFn$_invoke$arity$3 = sp1__3;
      sp1.cljs$core$IFn$_invoke$arity$variadic = sp1__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__6460__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__6452_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__6452_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p2.call(null, p1__6452_SHARP_)
              }
            }, args)
          }
        };
        var G__6460 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6460__delegate.call(this, x, y, z, args)
        };
        G__6460.cljs$lang$maxFixedArity = 3;
        G__6460.cljs$lang$applyTo = function(arglist__6461) {
          var x = cljs.core.first(arglist__6461);
          arglist__6461 = cljs.core.next(arglist__6461);
          var y = cljs.core.first(arglist__6461);
          arglist__6461 = cljs.core.next(arglist__6461);
          var z = cljs.core.first(arglist__6461);
          var args = cljs.core.rest(arglist__6461);
          return G__6460__delegate(x, y, z, args)
        };
        G__6460.cljs$core$IFn$_invoke$arity$variadic = G__6460__delegate;
        return G__6460
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$core$IFn$_invoke$arity$0 = sp2__0;
      sp2.cljs$core$IFn$_invoke$arity$1 = sp2__1;
      sp2.cljs$core$IFn$_invoke$arity$2 = sp2__2;
      sp2.cljs$core$IFn$_invoke$arity$3 = sp2__3;
      sp2.cljs$core$IFn$_invoke$arity$variadic = sp2__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  var or__3943__auto____$5 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____$5)) {
                    return or__3943__auto____$5
                  }else {
                    var or__3943__auto____$6 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____$6)) {
                      return or__3943__auto____$6
                    }else {
                      var or__3943__auto____$7 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____$7)) {
                        return or__3943__auto____$7
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__6462__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some.call(null, function(p1__6453_SHARP_) {
              var or__3943__auto____$1 = p1.call(null, p1__6453_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                var or__3943__auto____$2 = p2.call(null, p1__6453_SHARP_);
                if(cljs.core.truth_(or__3943__auto____$2)) {
                  return or__3943__auto____$2
                }else {
                  return p3.call(null, p1__6453_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__6462 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6462__delegate.call(this, x, y, z, args)
        };
        G__6462.cljs$lang$maxFixedArity = 3;
        G__6462.cljs$lang$applyTo = function(arglist__6463) {
          var x = cljs.core.first(arglist__6463);
          arglist__6463 = cljs.core.next(arglist__6463);
          var y = cljs.core.first(arglist__6463);
          arglist__6463 = cljs.core.next(arglist__6463);
          var z = cljs.core.first(arglist__6463);
          var args = cljs.core.rest(arglist__6463);
          return G__6462__delegate(x, y, z, args)
        };
        G__6462.cljs$core$IFn$_invoke$arity$variadic = G__6462__delegate;
        return G__6462
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$core$IFn$_invoke$arity$0 = sp3__0;
      sp3.cljs$core$IFn$_invoke$arity$1 = sp3__1;
      sp3.cljs$core$IFn$_invoke$arity$2 = sp3__2;
      sp3.cljs$core$IFn$_invoke$arity$3 = sp3__3;
      sp3.cljs$core$IFn$_invoke$arity$variadic = sp3__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__6464__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__6454_SHARP_) {
            return p1__6454_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__6455_SHARP_) {
            var or__3943__auto__ = p1__6455_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return p1__6455_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__6456_SHARP_) {
            var or__3943__auto__ = p1__6456_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              var or__3943__auto____$1 = p1__6456_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p1__6456_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__6465__delegate = function(x, y, z, args) {
            var or__3943__auto__ = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.some.call(null, function(p1__6457_SHARP_) {
                return cljs.core.some.call(null, p1__6457_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__6465 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6465__delegate.call(this, x, y, z, args)
          };
          G__6465.cljs$lang$maxFixedArity = 3;
          G__6465.cljs$lang$applyTo = function(arglist__6466) {
            var x = cljs.core.first(arglist__6466);
            arglist__6466 = cljs.core.next(arglist__6466);
            var y = cljs.core.first(arglist__6466);
            arglist__6466 = cljs.core.next(arglist__6466);
            var z = cljs.core.first(arglist__6466);
            var args = cljs.core.rest(arglist__6466);
            return G__6465__delegate(x, y, z, args)
          };
          G__6465.cljs$core$IFn$_invoke$arity$variadic = G__6465__delegate;
          return G__6465
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$core$IFn$_invoke$arity$0 = spn__0;
        spn.cljs$core$IFn$_invoke$arity$1 = spn__1;
        spn.cljs$core$IFn$_invoke$arity$2 = spn__2;
        spn.cljs$core$IFn$_invoke$arity$3 = spn__3;
        spn.cljs$core$IFn$_invoke$arity$variadic = spn__4.cljs$core$IFn$_invoke$arity$variadic;
        return spn
      }()
    };
    var G__6464 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6464__delegate.call(this, p1, p2, p3, ps)
    };
    G__6464.cljs$lang$maxFixedArity = 3;
    G__6464.cljs$lang$applyTo = function(arglist__6467) {
      var p1 = cljs.core.first(arglist__6467);
      arglist__6467 = cljs.core.next(arglist__6467);
      var p2 = cljs.core.first(arglist__6467);
      arglist__6467 = cljs.core.next(arglist__6467);
      var p3 = cljs.core.first(arglist__6467);
      var ps = cljs.core.rest(arglist__6467);
      return G__6464__delegate(p1, p2, p3, ps)
    };
    G__6464.cljs$core$IFn$_invoke$arity$variadic = G__6464__delegate;
    return G__6464
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$core$IFn$_invoke$arity$1 = some_fn__1;
  some_fn.cljs$core$IFn$_invoke$arity$2 = some_fn__2;
  some_fn.cljs$core$IFn$_invoke$arity$3 = some_fn__3;
  some_fn.cljs$core$IFn$_invoke$arity$variadic = some_fn__4.cljs$core$IFn$_invoke$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__3662__auto___6469 = size;
          var i_6470 = 0;
          while(true) {
            if(i_6470 < n__3662__auto___6469) {
              cljs.core.chunk_append.call(null, b, f.call(null, cljs.core._nth.call(null, c, i_6470)));
              var G__6471 = i_6470 + 1;
              i_6470 = G__6471;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), map.call(null, f, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s)), map.call(null, f, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2)))
      }else {
        return null
      }
    }, null, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      var s3 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          var and__3941__auto____$1 = s2;
          if(and__3941__auto____$1) {
            return s3
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2), cljs.core.first.call(null, s3)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2), cljs.core.rest.call(null, s3)))
      }else {
        return null
      }
    }, null, null)
  };
  var map__5 = function() {
    var G__6472__delegate = function(f, c1, c2, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, function() {
          var ss = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss), step.call(null, map.call(null, cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null, null)
      };
      return map.call(null, function(p1__6468_SHARP_) {
        return cljs.core.apply.call(null, f, p1__6468_SHARP_)
      }, step.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__6472 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6472__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__6472.cljs$lang$maxFixedArity = 4;
    G__6472.cljs$lang$applyTo = function(arglist__6473) {
      var f = cljs.core.first(arglist__6473);
      arglist__6473 = cljs.core.next(arglist__6473);
      var c1 = cljs.core.first(arglist__6473);
      arglist__6473 = cljs.core.next(arglist__6473);
      var c2 = cljs.core.first(arglist__6473);
      arglist__6473 = cljs.core.next(arglist__6473);
      var c3 = cljs.core.first(arglist__6473);
      var colls = cljs.core.rest(arglist__6473);
      return G__6472__delegate(f, c1, c2, c3, colls)
    };
    G__6472.cljs$core$IFn$_invoke$arity$variadic = G__6472__delegate;
    return G__6472
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$core$IFn$_invoke$arity$2 = map__2;
  map.cljs$core$IFn$_invoke$arity$3 = map__3;
  map.cljs$core$IFn$_invoke$arity$4 = map__4;
  map.cljs$core$IFn$_invoke$arity$variadic = map__5.cljs$core$IFn$_invoke$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, function() {
    if(n > 0) {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take.call(null, n - 1, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = n__$1 > 0;
        if(and__3941__auto__) {
          return s
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__6474 = n__$1 - 1;
        var G__6475 = cljs.core.rest.call(null, s);
        n__$1 = G__6474;
        coll__$1 = G__6475;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, function() {
    return step.call(null, n, coll)
  }, null, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$core$IFn$_invoke$arity$1 = drop_last__1;
  drop_last.cljs$core$IFn$_invoke$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq.call(null, coll);
  var lead = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead) {
      var G__6476 = cljs.core.next.call(null, s);
      var G__6477 = cljs.core.next.call(null, lead);
      s = G__6476;
      lead = G__6477;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = s;
        if(and__3941__auto__) {
          return pred__$1.call(null, cljs.core.first.call(null, s))
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__6478 = pred__$1;
        var G__6479 = cljs.core.rest.call(null, s);
        pred__$1 = G__6478;
        coll__$1 = G__6479;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, function() {
    return step.call(null, pred, coll)
  }, null, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.concat.call(null, s, cycle.call(null, s))
    }else {
      return null
    }
  }, null, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$core$IFn$_invoke$arity$1 = repeat__1;
  repeat.cljs$core$IFn$_invoke$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$core$IFn$_invoke$arity$1 = repeatedly__1;
  repeatedly.cljs$core$IFn$_invoke$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1), cljs.core.cons.call(null, cljs.core.first.call(null, s2), interleave.call(null, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2))))
      }else {
        return null
      }
    }, null, null)
  };
  var interleave__3 = function() {
    var G__6480__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, function() {
        var ss = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null, null)
    };
    var G__6480 = function(c1, c2, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6480__delegate.call(this, c1, c2, colls)
    };
    G__6480.cljs$lang$maxFixedArity = 2;
    G__6480.cljs$lang$applyTo = function(arglist__6481) {
      var c1 = cljs.core.first(arglist__6481);
      arglist__6481 = cljs.core.next(arglist__6481);
      var c2 = cljs.core.first(arglist__6481);
      var colls = cljs.core.rest(arglist__6481);
      return G__6480__delegate(c1, c2, colls)
    };
    G__6480.cljs$core$IFn$_invoke$arity$variadic = G__6480__delegate;
    return G__6480
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$core$IFn$_invoke$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$core$IFn$_invoke$arity$2 = interleave__2;
  interleave.cljs$core$IFn$_invoke$arity$variadic = interleave__3.cljs$core$IFn$_invoke$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var coll__$1 = temp__4090__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__$1), cat.call(null, cljs.core.rest.call(null, coll__$1), colls__$1))
      }else {
        if(cljs.core.seq.call(null, colls__$1)) {
          return cat.call(null, cljs.core.first.call(null, colls__$1), cljs.core.rest.call(null, colls__$1))
        }else {
          return null
        }
      }
    }, null, null)
  };
  return cat.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__6482__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__6482 = function(f, coll, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6482__delegate.call(this, f, coll, colls)
    };
    G__6482.cljs$lang$maxFixedArity = 2;
    G__6482.cljs$lang$applyTo = function(arglist__6483) {
      var f = cljs.core.first(arglist__6483);
      arglist__6483 = cljs.core.next(arglist__6483);
      var coll = cljs.core.first(arglist__6483);
      var colls = cljs.core.rest(arglist__6483);
      return G__6482__delegate(f, coll, colls)
    };
    G__6482.cljs$core$IFn$_invoke$arity$variadic = G__6482__delegate;
    return G__6482
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$core$IFn$_invoke$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$core$IFn$_invoke$arity$2 = mapcat__2;
  mapcat.cljs$core$IFn$_invoke$arity$variadic = mapcat__3.cljs$core$IFn$_invoke$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__3662__auto___6484 = size;
        var i_6485 = 0;
        while(true) {
          if(i_6485 < n__3662__auto___6484) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c, i_6485)))) {
              cljs.core.chunk_append.call(null, b, cljs.core._nth.call(null, c, i_6485))
            }else {
            }
            var G__6486 = i_6485 + 1;
            i_6485 = G__6486;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), filter.call(null, pred, cljs.core.chunk_rest.call(null, s)))
      }else {
        var f = cljs.core.first.call(null, s);
        var r = cljs.core.rest.call(null, s);
        if(cljs.core.truth_(pred.call(null, f))) {
          return cljs.core.cons.call(null, f, filter.call(null, pred, r))
        }else {
          return filter.call(null, pred, r)
        }
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null, null)
  };
  return walk.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__6487_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__6487_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(!(to == null)) {
    if(function() {
      var G__6489 = to;
      if(G__6489) {
        if(function() {
          var or__3943__auto__ = G__6489.cljs$lang$protocol_mask$partition1$ & 4;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6489.cljs$core$IEditableCollection$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
    }else {
      return cljs.core.reduce.call(null, cljs.core._conj, to, from)
    }
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__6490__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__6490 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6490__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__6490.cljs$lang$maxFixedArity = 4;
    G__6490.cljs$lang$applyTo = function(arglist__6491) {
      var f = cljs.core.first(arglist__6491);
      arglist__6491 = cljs.core.next(arglist__6491);
      var c1 = cljs.core.first(arglist__6491);
      arglist__6491 = cljs.core.next(arglist__6491);
      var c2 = cljs.core.first(arglist__6491);
      arglist__6491 = cljs.core.next(arglist__6491);
      var c3 = cljs.core.first(arglist__6491);
      var colls = cljs.core.rest(arglist__6491);
      return G__6490__delegate(f, c1, c2, c3, colls)
    };
    G__6490.cljs$core$IFn$_invoke$arity$variadic = G__6490__delegate;
    return G__6490
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$core$IFn$_invoke$arity$2 = mapv__2;
  mapv.cljs$core$IFn$_invoke$arity$3 = mapv__3;
  mapv.cljs$core$IFn$_invoke$arity$4 = mapv__4;
  mapv.cljs$core$IFn$_invoke$arity$variadic = mapv__5.cljs$core$IFn$_invoke$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, cljs.core.drop.call(null, step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p, pad)))
        }
      }else {
        return null
      }
    }, null, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$core$IFn$_invoke$arity$2 = partition__2;
  partition.cljs$core$IFn$_invoke$arity$3 = partition__3;
  partition.cljs$core$IFn$_invoke$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return get_in.call(null, m, ks, null)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__$1) {
        if(!function() {
          var G__6493 = m__$1;
          if(G__6493) {
            if(function() {
              var or__3943__auto__ = G__6493.cljs$lang$protocol_mask$partition0$ & 256;
              if(or__3943__auto__) {
                return or__3943__auto__
              }else {
                return G__6493.cljs$core$ILookup$
              }
            }()) {
              return true
            }else {
              if(!G__6493.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__6493)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__6493)
          }
        }()) {
          return not_found
        }else {
          var m__$2 = cljs.core.get.call(null, m__$1, cljs.core.first.call(null, ks__$1), sentinel);
          if(sentinel === m__$2) {
            return not_found
          }else {
            var G__6494 = sentinel;
            var G__6495 = m__$2;
            var G__6496 = cljs.core.next.call(null, ks__$1);
            sentinel = G__6494;
            m__$1 = G__6495;
            ks__$1 = G__6496;
            continue
          }
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$core$IFn$_invoke$arity$2 = get_in__2;
  get_in.cljs$core$IFn$_invoke$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__6497, v) {
  var vec__6499 = p__6497;
  var k = cljs.core.nth.call(null, vec__6499, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__6499, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.call(null, m, k, assoc_in.call(null, cljs.core.get.call(null, m, k), ks, v))
  }else {
    return cljs.core.assoc.call(null, m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in = null;
  var update_in__3 = function(m, p__6500, f) {
    var vec__6510 = p__6500;
    var k = cljs.core.nth.call(null, vec__6510, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6510, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k)))
    }
  };
  var update_in__4 = function(m, p__6501, f, a) {
    var vec__6511 = p__6501;
    var k = cljs.core.nth.call(null, vec__6511, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6511, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a))
    }
  };
  var update_in__5 = function(m, p__6502, f, a, b) {
    var vec__6512 = p__6502;
    var k = cljs.core.nth.call(null, vec__6512, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6512, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b))
    }
  };
  var update_in__6 = function(m, p__6503, f, a, b, c) {
    var vec__6513 = p__6503;
    var k = cljs.core.nth.call(null, vec__6513, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__6513, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, update_in.call(null, cljs.core.get.call(null, m, k), ks, f, a, b, c))
    }else {
      return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), a, b, c))
    }
  };
  var update_in__7 = function() {
    var G__6515__delegate = function(m, p__6504, f, a, b, c, args) {
      var vec__6514 = p__6504;
      var k = cljs.core.nth.call(null, vec__6514, 0, null);
      var ks = cljs.core.nthnext.call(null, vec__6514, 1);
      if(cljs.core.truth_(ks)) {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k), ks, f, a, b, c, args))
      }else {
        return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k), a, b, c, args))
      }
    };
    var G__6515 = function(m, p__6504, f, a, b, c, var_args) {
      var args = null;
      if(arguments.length > 6) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 6), 0)
      }
      return G__6515__delegate.call(this, m, p__6504, f, a, b, c, args)
    };
    G__6515.cljs$lang$maxFixedArity = 6;
    G__6515.cljs$lang$applyTo = function(arglist__6516) {
      var m = cljs.core.first(arglist__6516);
      arglist__6516 = cljs.core.next(arglist__6516);
      var p__6504 = cljs.core.first(arglist__6516);
      arglist__6516 = cljs.core.next(arglist__6516);
      var f = cljs.core.first(arglist__6516);
      arglist__6516 = cljs.core.next(arglist__6516);
      var a = cljs.core.first(arglist__6516);
      arglist__6516 = cljs.core.next(arglist__6516);
      var b = cljs.core.first(arglist__6516);
      arglist__6516 = cljs.core.next(arglist__6516);
      var c = cljs.core.first(arglist__6516);
      var args = cljs.core.rest(arglist__6516);
      return G__6515__delegate(m, p__6504, f, a, b, c, args)
    };
    G__6515.cljs$core$IFn$_invoke$arity$variadic = G__6515__delegate;
    return G__6515
  }();
  update_in = function(m, p__6504, f, a, b, c, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 3:
        return update_in__3.call(this, m, p__6504, f);
      case 4:
        return update_in__4.call(this, m, p__6504, f, a);
      case 5:
        return update_in__5.call(this, m, p__6504, f, a, b);
      case 6:
        return update_in__6.call(this, m, p__6504, f, a, b, c);
      default:
        return update_in__7.cljs$core$IFn$_invoke$arity$variadic(m, p__6504, f, a, b, c, cljs.core.array_seq(arguments, 6))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  update_in.cljs$lang$maxFixedArity = 6;
  update_in.cljs$lang$applyTo = update_in__7.cljs$lang$applyTo;
  update_in.cljs$core$IFn$_invoke$arity$3 = update_in__3;
  update_in.cljs$core$IFn$_invoke$arity$4 = update_in__4;
  update_in.cljs$core$IFn$_invoke$arity$5 = update_in__5;
  update_in.cljs$core$IFn$_invoke$arity$6 = update_in__6;
  update_in.cljs$core$IFn$_invoke$arity$variadic = update_in__7.cljs$core$IFn$_invoke$arity$variadic;
  return update_in
}();
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorStr = "cljs.core/VectorNode";
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__3446__auto__, writer__3447__auto__, opts__3448__auto__) {
  return cljs.core._write.call(null, writer__3447__auto__, "cljs.core/VectorNode")
};
cljs.core.__GT_VectorNode = function __GT_VectorNode(edit, arr) {
  return new cljs.core.VectorNode(edit, arr)
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, new Array(32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node.call(null, edit);
      var _ = cljs.core.pv_aset.call(null, r, 0, embed);
      var G__6517 = ll - 5;
      var G__6518 = r;
      ll = G__6517;
      ret = G__6518;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node.call(null, parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget.call(null, parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail.call(null, pv, level - 5, child, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.vector_index_out_of_bounds = function vector_index_out_of_bounds(i, cnt) {
  throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(cnt)].join(""));
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < pv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__6519 = cljs.core.pv_aget.call(null, node, i >>> level & 31);
          var G__6520 = level - 5;
          node = G__6519;
          level = G__6520;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    return cljs.core.vector_index_out_of_bounds.call(null, i, pv.cnt)
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret, subidx, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var ret = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorStr = "cljs.core/PersistentVector";
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= k;
    if(and__3941__auto__) {
      return k < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc.call(null, coll, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__6522 = null;
  var G__6522__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, k)
  };
  var G__6522__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
  };
  G__6522 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6522__2.call(this, self__, k);
      case 3:
        return G__6522__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6522
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args6521) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6521.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for.call(null, v, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
              return init__$2
            }else {
              var G__6523 = j + 1;
              var G__6524 = init__$2;
              j = G__6523;
              init__$1 = G__6524;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
        return cljs.core.deref.call(null, init__$1)
      }else {
        var G__6525 = i + step_init[0];
        i = G__6525;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(self__.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r, 0, self__.root);
      cljs.core.pv_aset.call(null, n_r, 1, cljs.core.new_path.call(null, null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail.call(null, coll, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    return null
  }else {
    if(self__.cnt < 32) {
      return cljs.core.array_seq.call(null, self__.tail)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return cljs.core.chunked_seq.call(null, coll, 0, 0)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var new_tail = cljs.core.array_for.call(null, coll, self__.cnt - 2);
          var nr = cljs.core.pop_tail.call(null, coll, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(function() {
            var and__3941__auto__ = 5 < self__.shift;
            if(and__3941__auto__) {
              return cljs.core.pv_aget.call(null, new_root, 1) == null
            }else {
              return and__3941__auto__
            }
          }()) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget.call(null, new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentVector = function __GT_PersistentVector(meta, cnt, shift, root, tail, __hash) {
  return new cljs.core.PersistentVector(meta, cnt, shift, root, tail, __hash)
};
cljs.core.PersistentVector.EMPTY_NODE = new cljs.core.VectorNode(null, new Array(32));
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient.call(null, v);
    while(true) {
      if(i < l) {
        var G__6526 = i + 1;
        var G__6527 = cljs.core.conj_BANG_.call(null, out, xs__$1[i]);
        i = G__6526;
        out = G__6527;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(arguments.length > 0) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__6528) {
    var args = cljs.core.seq(arglist__6528);
    return vector__delegate(args)
  };
  vector.cljs$core$IFn$_invoke$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 32243948;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorStr = "cljs.core/ChunkedSeq";
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, cljs.core.subvec.call(null, self__.vec, self__.i + self__.off, cljs.core.count.call(null, self__.vec)), f)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, cljs.core.subvec.call(null, self__.vec, self__.i + self__.off, cljs.core.count.call(null, self__.vec)), f, start)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.array_chunk.call(null, self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.__GT_ChunkedSeq = function __GT_ChunkedSeq(vec, node, i, off, meta, __hash) {
  return new cljs.core.ChunkedSeq(vec, node, i, off, meta, __hash)
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return new cljs.core.ChunkedSeq(vec, cljs.core.array_for.call(null, vec, i), i, off, null, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, null, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$core$IFn$_invoke$arity$3 = chunked_seq__3;
  chunked_seq.cljs$core$IFn$_invoke$arity$4 = chunked_seq__4;
  chunked_seq.cljs$core$IFn$_invoke$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorStr = "cljs.core/Subvec";
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core.assoc.call(null, self__.v, v_pos, val), self__.start, function() {
    var x__3224__auto__ = self__.end;
    var y__3225__auto__ = v_pos + 1;
    return x__3224__auto__ > y__3225__auto__ ? x__3224__auto__ : y__3225__auto__
  }(), null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__6530 = null;
  var G__6530__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, k)
  };
  var G__6530__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
  };
  G__6530 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6530__2.call(this, self__, k);
      case 3:
        return G__6530__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6530
}();
cljs.core.Subvec.prototype.apply = function(self__, args6529) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6529.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n.call(null, self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, self__.v, i), new cljs.core.LazySeq(null, function() {
        return subvec_seq.call(null, i + 1)
      }, null, null))
    }
  };
  return subvec_seq.call(null, self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(function() {
    var or__3943__auto__ = n < 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return self__.end <= self__.start + n
    }
  }()) {
    return cljs.core.vector_index_out_of_bounds.call(null, n, self__.end - self__.start)
  }else {
    return cljs.core._nth.call(null, self__.v, self__.start + n)
  }
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var or__3943__auto__ = n < 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return self__.end <= self__.start + n
    }
  }()) {
    return not_found
  }else {
    return cljs.core._nth.call(null, self__.v, self__.start + n, not_found)
  }
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.__GT_Subvec = function __GT_Subvec(meta, v, start, end, __hash) {
  return new cljs.core.Subvec(meta, v, start, end, __hash)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  while(true) {
    if(v instanceof cljs.core.Subvec) {
      var G__6531 = meta;
      var G__6532 = v.v;
      var G__6533 = v.start + start;
      var G__6534 = v.start + end;
      var G__6535 = __hash;
      meta = G__6531;
      v = G__6532;
      start = G__6533;
      end = G__6534;
      __hash = G__6535;
      continue
    }else {
      var c = cljs.core.count.call(null, v);
      if(function() {
        var or__3943__auto__ = start < 0;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = end < 0;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = start > c;
            if(or__3943__auto____$2) {
              return or__3943__auto____$2
            }else {
              return end > c
            }
          }
        }
      }()) {
        throw new Error("Index out of bounds");
      }else {
      }
      return new cljs.core.Subvec(meta, v, start, end, __hash)
    }
    break
  }
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$core$IFn$_invoke$arity$2 = subvec__2;
  subvec.cljs$core$IFn$_invoke$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = new Array(32);
  cljs.core.array_copy.call(null, tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget.call(null, ret, subidx);
    if(!(child == null)) {
      return tv_push_tail.call(null, tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        cljs.core.pv_aset.call(null, node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < tv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__6536 = cljs.core.tv_ensure_editable.call(null, root.edit, cljs.core.pv_aget.call(null, node, i >>> level & 31));
          var G__6537 = level - 5;
          node = G__6536;
          level = G__6537;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorStr = "cljs.core/TransientVector";
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__6539 = null;
  var G__6539__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6539__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6539 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6539__2.call(this, self__, k);
      case 3:
        return G__6539__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6539
}();
cljs.core.TransientVector.prototype.apply = function(self__, args6538) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6538.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(self__.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  if(self__.root.edit) {
    if(function() {
      var and__3941__auto__ = 0 <= n;
      if(and__3941__auto__) {
        return n < self__.cnt
      }else {
        return and__3941__auto__
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        self__.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__$1, subidx, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll
      }
    }else {
      if(n === self__.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            var new_tail = cljs.core.editable_array_for.call(null, tcoll, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail.call(null, tcoll, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, new Array(32))
              }
            }();
            if(function() {
              var and__3941__auto__ = 5 < self__.shift;
              if(and__3941__auto__) {
                return cljs.core.pv_aget.call(null, new_root, 1) == null
              }else {
                return and__3941__auto__
              }
            }()) {
              var new_root__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, cljs.core.pv_aget.call(null, new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = new Array(32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = new Array(32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path.call(null, self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }else {
        var new_root = cljs.core.tv_push_tail.call(null, tcoll, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail = new Array(len);
    cljs.core.array_copy.call(null, self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.__GT_TransientVector = function __GT_TransientVector(cnt, shift, root, tail) {
  return new cljs.core.TransientVector(cnt, shift, root, tail)
};
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorStr = "cljs.core/PersistentQueueSeq";
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
  if(temp__4090__auto__) {
    var f1 = temp__4090__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentQueueSeq = function __GT_PersistentQueueSeq(meta, front, rear, __hash) {
  return new cljs.core.PersistentQueueSeq(meta, front, rear, __hash)
};
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorStr = "cljs.core/PersistentQueue";
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.call(null, function() {
      var or__3943__auto__ = self__.rear;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.call(null, self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var rear__$1 = cljs.core.seq.call(null, self__.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto__ = self__.front;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq.call(null, rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__4090__auto__ = cljs.core.next.call(null, self__.front);
    if(temp__4090__auto__) {
      var f1 = temp__4090__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq.call(null, self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.__GT_PersistentQueue = function __GT_PersistentQueue(meta, count, front, rear, __hash) {
  return new cljs.core.PersistentQueue(meta, count, front, rear, __hash)
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorStr = "cljs.core/NeverEquiv";
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return false
};
cljs.core.__GT_NeverEquiv = function __GT_NeverEquiv() {
  return new cljs.core.NeverEquiv
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__6540 = i + incr;
        i = G__6540;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.call(null, a);
  var b__$1 = cljs.core.hash.call(null, b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var mm = cljs.core.meta.call(null, m);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__6541 = i + 1;
      var G__6542 = cljs.core.assoc_BANG_.call(null, out, k__$1, so[k__$1]);
      i = G__6541;
      out = G__6542;
      continue
    }else {
      return cljs.core.with_meta.call(null, cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out, k, v)), mm)
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_6543 = 0;
  while(true) {
    if(i_6543 < l) {
      var k_6544 = ks[i_6543];
      new_obj[k_6544] = obj[k_6544];
      var G__6545 = i_6543 + 1;
      i_6543 = G__6545;
      continue
    }else {
    }
    break
  }
  return new_obj
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorStr = "cljs.core/ObjMap";
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto__ = self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__6548 = null;
  var G__6548__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6548__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6548 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6548__2.call(this, self__, k);
      case 3:
        return G__6548__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6548
}();
cljs.core.ObjMap.prototype.apply = function(self__, args6547) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6547.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__$1)) {
      var k = cljs.core.first.call(null, keys__$1);
      var init__$2 = f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__6549 = cljs.core.rest.call(null, keys__$1);
        var G__6550 = init__$2;
        keys__$1 = G__6549;
        init__$1 = G__6550;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__6546_SHARP_) {
      return cljs.core.vector.call(null, p1__6546_SHARP_, self__.strobj[p1__6546_SHARP_])
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array.call(null, 1, k, new_keys), 1);
    delete new_strobj[k];
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.__GT_ObjMap = function __GT_ObjMap(meta, keys, strobj, update_count, __hash) {
  return new cljs.core.ObjMap(meta, keys, strobj, update_count, __hash)
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 8;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.array_map_index_of_nil_QMARK_ = function array_map_index_of_nil_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(arr[i] == null) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6551 = i + 2;
          i = G__6551;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_keyword_QMARK_ = function array_map_index_of_keyword_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.fqn;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        var and__3941__auto__ = k_SINGLEQUOTE_ instanceof cljs.core.Keyword;
        if(and__3941__auto__) {
          return kstr === k_SINGLEQUOTE_.fqn
        }else {
          return and__3941__auto__
        }
      }()) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6552 = i + 2;
          i = G__6552;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_symbol_QMARK_ = function array_map_index_of_symbol_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.str;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        var and__3941__auto__ = k_SINGLEQUOTE_ instanceof cljs.core.Symbol;
        if(and__3941__auto__) {
          return kstr === k_SINGLEQUOTE_.str
        }else {
          return and__3941__auto__
        }
      }()) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6553 = i + 2;
          i = G__6553;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_identical_QMARK_ = function array_map_index_of_identical_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(k === arr[i]) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6554 = i + 2;
          i = G__6554;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_equiv_QMARK_ = function array_map_index_of_equiv_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, k, arr[i])) {
        return i
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var G__6555 = i + 2;
          i = G__6555;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  if(k instanceof cljs.core.Keyword) {
    return cljs.core.array_map_index_of_keyword_QMARK_.call(null, arr, m, k)
  }else {
    if(function() {
      var or__3943__auto__ = goog.isString(k);
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return typeof k === "number"
      }
    }()) {
      return cljs.core.array_map_index_of_identical_QMARK_.call(null, arr, m, k)
    }else {
      if(k instanceof cljs.core.Symbol) {
        return cljs.core.array_map_index_of_symbol_QMARK_.call(null, arr, m, k)
      }else {
        if(k == null) {
          return cljs.core.array_map_index_of_nil_QMARK_.call(null, arr, m, k)
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            return cljs.core.array_map_index_of_equiv_QMARK_.call(null, arr, m, k)
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.array_map_extend_kv = function array_map_extend_kv(m, k, v) {
  var arr = m.arr;
  var l = arr.length;
  var narr = new Array(l + 2);
  var i_6556 = 0;
  while(true) {
    if(i_6556 < l) {
      narr[i_6556] = arr[i_6556];
      var G__6557 = i_6556 + 1;
      i_6556 = G__6557;
      continue
    }else {
    }
    break
  }
  narr[l] = k;
  narr[l + 1] = v;
  return narr
};
goog.provide("cljs.core.PersistentArrayMapSeq");
cljs.core.PersistentArrayMapSeq = function(arr, i, _meta) {
  this.arr = arr;
  this.i = i;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374990
};
cljs.core.PersistentArrayMapSeq.cljs$lang$type = true;
cljs.core.PersistentArrayMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentArrayMapSeq";
cljs.core.PersistentArrayMapSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentArrayMapSeq")
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i < self__.arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i + 2, self__._meta)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return(self__.arr.length - self__.i) / 2
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.arr[self__.i], self__.arr[self__.i + 1]], true)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i < self__.arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i + 2, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i, new_meta)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__._meta
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_PersistentArrayMapSeq = function __GT_PersistentArrayMapSeq(arr, i, _meta) {
  return new cljs.core.PersistentArrayMapSeq(arr, i, _meta)
};
cljs.core.persistent_array_map_seq = function persistent_array_map_seq(arr, i, _meta) {
  if(i <= arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(arr, i, _meta)
  }else {
    return null
  }
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorStr = "cljs.core/PersistentArrayMap";
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      var arr__$1 = cljs.core.array_map_extend_kv.call(null, coll, k, v);
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, arr__$1, null)
    }else {
      return cljs.core._with_meta.call(null, cljs.core._assoc.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll), k, v), self__.meta)
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var arr__$1 = function() {
          var G__6559 = self__.arr.slice();
          G__6559[idx + 1] = v;
          return G__6559
        }();
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, arr__$1, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__6560 = null;
  var G__6560__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6560__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6560 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6560__2.call(this, self__, k);
      case 3:
        return G__6560__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6560
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args6558) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6558.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__6561 = i + 2;
        var G__6562 = init__$2;
        i = G__6561;
        init__$1 = G__6562;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.persistent_array_map_seq.call(null, self__.arr, 0, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr = new Array(new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.call(null, k, self__.arr[s])) {
            var G__6563 = s + 2;
            var G__6564 = d;
            s = G__6563;
            d = G__6564;
            continue
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__6565 = s + 2;
              var G__6566 = d + 2;
              s = G__6565;
              d = G__6566;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.__GT_PersistentArrayMap = function __GT_PersistentArrayMap(meta, cnt, arr, __hash) {
  return new cljs.core.PersistentArrayMap(meta, cnt, arr, __hash)
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 8;
cljs.core.PersistentArrayMap.fromArray = function(arr, no_clone) {
  var arr__$1 = no_clone ? arr : arr.slice();
  var cnt = arr__$1.length / 2;
  return new cljs.core.PersistentArrayMap(null, cnt, arr__$1, null)
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorStr = "cljs.core/TransientArrayMap";
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__6567_6569 = self__.arr;
      G__6567_6569.pop();
      G__6567_6569.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll
      }else {
        self__.arr[idx + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__6568 = o;
      if(G__6568) {
        if(function() {
          var or__3943__auto__ = G__6568.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6568.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6568.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6568)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6568)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__6570 = cljs.core.next.call(null, es);
          var G__6571 = tcoll__$1.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__$1, cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__6570;
          tcoll__$1 = G__6571;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot.call(null, self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.__GT_TransientArrayMap = function __GT_TransientArrayMap(editable_QMARK_, len, arr) {
  return new cljs.core.TransientArrayMap(editable_QMARK_, len, arr)
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__6572 = cljs.core.assoc_BANG_.call(null, out, arr[i], arr[i + 1]);
      var G__6573 = i + 2;
      out = G__6572;
      i = G__6573;
      continue
    }else {
      return out
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorStr = "cljs.core/Box";
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__3446__auto__, writer__3447__auto__, opts__3448__auto__) {
  return cljs.core._write.call(null, writer__3447__auto__, "cljs.core/Box")
};
cljs.core.__GT_Box = function __GT_Box(val) {
  return new cljs.core.Box(val)
};
cljs.core.key_test = function key_test(key, other) {
  if(key === other) {
    return true
  }else {
    if(cljs.core.keyword_identical_QMARK_.call(null, key, other)) {
      return true
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return cljs.core._EQ_.call(null, key, other)
      }else {
        return null
      }
    }
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__6576 = arr.slice();
    G__6576[i] = a;
    return G__6576
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__6577 = arr.slice();
    G__6577[i] = a;
    G__6577[j] = b;
    return G__6577
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$core$IFn$_invoke$arity$3 = clone_and_set__3;
  clone_and_set.cljs$core$IFn$_invoke$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = new Array(arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$core$IFn$_invoke$arity$4 = edit_and_set__4;
  edit_and_set.cljs$core$IFn$_invoke$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__6578 = i + 2;
        var G__6579 = init__$2;
        i = G__6578;
        init__$1 = G__6579;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorStr = "cljs.core/BitmapIndexedNode";
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy.call(null, earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = new Array(32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_6580 = 0;
        var j_6581 = 0;
        while(true) {
          if(i_6580 < 32) {
            if((self__.bitmap >>> i_6580 & 1) === 0) {
              var G__6582 = i_6580 + 1;
              var G__6583 = j_6581;
              i_6580 = G__6582;
              j_6581 = G__6583;
              continue
            }else {
              nodes[i_6580] = !(self__.arr[j_6581] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.call(null, self__.arr[j_6581]), self__.arr[j_6581], self__.arr[j_6581 + 1], added_leaf_QMARK_) : self__.arr[j_6581 + 1];
              var G__6584 = i_6580 + 1;
              var G__6585 = j_6581 + 2;
              i_6580 = G__6584;
              j_6581 = G__6585;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var new_arr = new Array(2 * (n + 4));
          cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    var new_arr = new Array(n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(n >= 16) {
      var nodes = new Array(32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_6586 = 0;
      var j_6587 = 0;
      while(true) {
        if(i_6586 < 32) {
          if((self__.bitmap >>> i_6586 & 1) === 0) {
            var G__6588 = i_6586 + 1;
            var G__6589 = j_6587;
            i_6586 = G__6588;
            j_6587 = G__6589;
            continue
          }else {
            nodes[i_6586] = !(self__.arr[j_6587] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, self__.arr[j_6587]), self__.arr[j_6587], self__.arr[j_6587 + 1], added_leaf_QMARK_) : self__.arr[j_6587 + 1];
            var G__6590 = i_6586 + 1;
            var G__6591 = j_6587 + 2;
            i_6586 = G__6590;
            j_6587 = G__6591;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = new Array(2 * (n + 1));
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, val))
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return val_or_node
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.__GT_BitmapIndexedNode = function __GT_BitmapIndexedNode(edit, bitmap, arr) {
  return new cljs.core.BitmapIndexedNode(edit, bitmap, arr)
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, new Array(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = new Array(len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(function() {
        var and__3941__auto__ = !(i === idx);
        if(and__3941__auto__) {
          return!(arr[i] == null)
        }else {
          return and__3941__auto__
        }
      }()) {
        new_arr[j] = arr[i];
        var G__6592 = i + 1;
        var G__6593 = j + 2;
        var G__6594 = bitmap | 1 << i;
        i = G__6592;
        j = G__6593;
        bitmap = G__6594;
        continue
      }else {
        var G__6595 = i + 1;
        var G__6596 = j;
        var G__6597 = bitmap;
        i = G__6595;
        j = G__6596;
        bitmap = G__6597;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorStr = "cljs.core/ArrayNode";
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
          return cljs.core.deref.call(null, init__$2)
        }else {
          var G__6598 = i + 1;
          var G__6599 = init__$2;
          i = G__6598;
          init__$1 = G__6599;
          continue
        }
      }else {
        var G__6600 = i + 1;
        var G__6601 = init__$1;
        i = G__6600;
        init__$1 = G__6601;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.call(null, self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.__GT_ArrayNode = function __GT_ArrayNode(edit, cnt, arr) {
  return new cljs.core.ArrayNode(edit, cnt, arr)
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test.call(null, key, arr[i])) {
        return i
      }else {
        var G__6602 = i + 2;
        i = G__6602;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorStr = "cljs.core/HashCollisionNode";
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = new Array(len + 2);
        cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = new Array(2 * (self__.cnt + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair.call(null, self__.arr, cljs.core.quot.call(null, idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = self__.arr.length;
      var new_arr = new Array(len + 2);
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.call(null, self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.__GT_HashCollisionNode = function __GT_HashCollisionNode(edit, collision_hash, cnt, arr) {
  return new cljs.core.HashCollisionNode(edit, collision_hash, cnt, arr)
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$core$IFn$_invoke$arity$6 = create_node__6;
  create_node.cljs$core$IFn$_invoke$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374860
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorStr = "cljs.core/NodeSeq";
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_NodeSeq = function __GT_NodeSeq(meta, nodes, i, s, __hash) {
  return new cljs.core.NodeSeq(meta, nodes, i, s, __hash)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__4090__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var node = temp__4090__auto__;
              var temp__4090__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____$1)) {
                var node_seq = temp__4090__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__6603 = j + 2;
                j = G__6603;
                continue
              }
            }else {
              var G__6604 = j + 2;
              j = G__6604;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$core$IFn$_invoke$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$core$IFn$_invoke$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374860
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorStr = "cljs.core/ArrayNodeSeq";
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_ArrayNodeSeq = function __GT_ArrayNodeSeq(meta, nodes, i, s, __hash) {
  return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, __hash)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__4090__auto__ = nodes[j];
          if(cljs.core.truth_(temp__4090__auto__)) {
            var nj = temp__4090__auto__;
            var temp__4090__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____$1)) {
              var ns = temp__4090__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__6605 = j + 1;
              j = G__6605;
              continue
            }
          }else {
            var G__6606 = j + 1;
            j = G__6606;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$core$IFn$_invoke$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$core$IFn$_invoke$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorStr = "cljs.core/PersistentHashMap";
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(k == null) {
    if(function() {
      var and__3941__auto__ = self__.has_nil_QMARK_;
      if(and__3941__auto__) {
        return v === self__.nil_val
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return!(self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6608 = null;
  var G__6608__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6608__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6608 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6608__2.call(this, self__, k);
      case 3:
        return G__6608__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6608
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args6607) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6607.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(self__.root == null) {
      return coll
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var new_root = self__.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root === self__.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.__GT_PersistentHashMap = function __GT_PersistentHashMap(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  return new cljs.core.PersistentHashMap(meta, cnt, root, has_nil_QMARK_, nil_val, __hash)
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__6609 = i + 1;
      var G__6610 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__6609;
      out = G__6610;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorStr = "cljs.core/TransientHashMap";
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__6611 = o;
      if(G__6611) {
        if(function() {
          var or__3943__auto__ = G__6611.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__6611.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6611.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6611)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6611)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__6612 = cljs.core.next.call(null, es);
          var G__6613 = tcoll__$1.assoc_BANG_(cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__6612;
          tcoll__$1 = G__6613;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.__GT_TransientHashMap = function __GT_TransientHashMap(edit, root, count, has_nil_QMARK_, nil_val) {
  return new cljs.core.TransientHashMap(edit, root, count, has_nil_QMARK_, nil_val)
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__6614 = ascending_QMARK_ ? t.left : t.right;
      var G__6615 = cljs.core.conj.call(null, stack__$1, t);
      t = G__6614;
      stack__$1 = G__6615;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374862
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentTreeMapSeq";
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.peek.call(null, self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var t = cljs.core.first.call(null, self__.stack);
  var next_stack = cljs.core.tree_map_seq_push.call(null, self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next.call(null, self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentTreeMapSeq = function __GT_PersistentTreeMapSeq(meta, stack, ascending_QMARK_, cnt, __hash) {
  return new cljs.core.PersistentTreeMapSeq(meta, stack, ascending_QMARK_, cnt, __hash)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(ins.right instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(ins.left instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(right instanceof cljs.core.BlackNode) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto__ = right instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return right.left instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(left instanceof cljs.core.BlackNode) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto__ = left instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return left.right instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = f.call(null, init__$1, node.key, node.val);
    if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
      return cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_.call(null, init__$3)) {
        return cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorStr = "cljs.core/BlackNode";
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__6617 = null;
  var G__6617__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__6617__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__6617 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6617__2.call(this, self__, k);
      case 3:
        return G__6617__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6617
}();
cljs.core.BlackNode.prototype.apply = function(self__, args6616) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6616.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del.call(null, self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del.call(null, self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.__GT_BlackNode = function __GT_BlackNode(key, val, left, right, __hash) {
  return new cljs.core.BlackNode(key, val, left, right, __hash)
};
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorStr = "cljs.core/RedNode";
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__6619 = null;
  var G__6619__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__6619__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__6619 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6619__2.call(this, self__, k);
      case 3:
        return G__6619__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6619
}();
cljs.core.RedNode.prototype.apply = function(self__, args6618) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6618.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.left instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(self__.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.right instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(self__.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.__GT_RedNode = function __GT_RedNode(key, val, left, right, __hash) {
  return new cljs.core.RedNode(key, val, left, right, __hash)
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var ins = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(left instanceof cljs.core.RedNode) {
        if(right instanceof cljs.core.RedNode) {
          var app = tree_map_append.call(null, left.right, right.left);
          if(app instanceof cljs.core.RedNode) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(right instanceof cljs.core.RedNode) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            var app = tree_map_append.call(null, left.right, right.left);
            if(app instanceof cljs.core.RedNode) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto__ = !(del == null);
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(tree.left instanceof cljs.core.BlackNode) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          var del = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto__ = !(del == null);
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(tree.right instanceof cljs.core.BlackNode) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorStr = "cljs.core/PersistentTreeMap";
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var n = coll.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_add.call(null, self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.call(null, found, 0);
    if(cljs.core._EQ_.call(null, v, found_node.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace.call(null, self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6621 = null;
  var G__6621__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6621__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6621 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6621__2.call(this, self__, k);
      case 3:
        return G__6621__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6621
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args6620) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6620.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__6622 = t.left;
          t = G__6622;
          continue
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            var G__6623 = t.right;
            t = G__6623;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__6624 = cljs.core.conj.call(null, stack, t);
              var G__6625 = t.left;
              stack = G__6624;
              t = G__6625;
              continue
            }else {
              var G__6626 = stack;
              var G__6627 = t.right;
              stack = G__6626;
              t = G__6627;
              continue
            }
          }else {
            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
              if(c > 0) {
                var G__6628 = cljs.core.conj.call(null, stack, t);
                var G__6629 = t.right;
                stack = G__6628;
                t = G__6629;
                continue
              }else {
                var G__6630 = stack;
                var G__6631 = t.left;
                stack = G__6630;
                t = G__6631;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_remove.call(null, self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.call(null, found, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.__GT_PersistentTreeMap = function __GT_PersistentTreeMap(comp, tree, cnt, meta, __hash) {
  return new cljs.core.PersistentTreeMap(comp, tree, cnt, meta, __hash)
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__6632 = cljs.core.nnext.call(null, in$);
        var G__6633 = cljs.core.assoc_BANG_.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__6632;
        out = G__6633;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6634) {
    var keyvals = cljs.core.seq(arglist__6634);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$core$IFn$_invoke$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6635) {
    var keyvals = cljs.core.seq(arglist__6635);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$core$IFn$_invoke$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first.call(null, kvs));
        obj[cljs.core.first.call(null, kvs)] = cljs.core.second.call(null, kvs);
        var G__6636 = cljs.core.nnext.call(null, kvs);
        kvs = G__6636;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__6637) {
    var keyvals = cljs.core.seq(arglist__6637);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$core$IFn$_invoke$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__6638 = cljs.core.nnext.call(null, in$);
        var G__6639 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__6638;
        out = G__6639;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6640) {
    var keyvals = cljs.core.seq(arglist__6640);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$core$IFn$_invoke$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__6641 = cljs.core.nnext.call(null, in$);
        var G__6642 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__6641;
        out = G__6642;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(arguments.length > 1) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6643) {
    var comparator = cljs.core.first(arglist__6643);
    var keyvals = cljs.core.rest(arglist__6643);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$core$IFn$_invoke$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
goog.provide("cljs.core.KeySeq");
cljs.core.KeySeq = function(mseq, _meta) {
  this.mseq = mseq;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374988
};
cljs.core.KeySeq.cljs$lang$type = true;
cljs.core.KeySeq.cljs$lang$ctorStr = "cljs.core/KeySeq";
cljs.core.KeySeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/KeySeq")
};
cljs.core.KeySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.KeySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__6644 = self__.mseq;
    if(G__6644) {
      if(function() {
        var or__3943__auto__ = G__6644.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6644.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__6644.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6644)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6644)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(nseq == null) {
    return null
  }else {
    return new cljs.core.KeySeq(nseq, self__._meta)
  }
};
cljs.core.KeySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.KeySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.KeySeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.KeySeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.KeySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.KeySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var me = cljs.core._first.call(null, self__.mseq);
  return cljs.core._key.call(null, me)
};
cljs.core.KeySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__6645 = self__.mseq;
    if(G__6645) {
      if(function() {
        var or__3943__auto__ = G__6645.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6645.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__6645.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6645)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6645)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(!(nseq == null)) {
    return new cljs.core.KeySeq(nseq, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.KeySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.KeySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.KeySeq(self__.mseq, new_meta)
};
cljs.core.KeySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__._meta
};
cljs.core.KeySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_KeySeq = function __GT_KeySeq(mseq, _meta) {
  return new cljs.core.KeySeq(mseq, _meta)
};
cljs.core.keys = function keys(hash_map) {
  var temp__4092__auto__ = cljs.core.seq.call(null, hash_map);
  if(temp__4092__auto__) {
    var mseq = temp__4092__auto__;
    return new cljs.core.KeySeq(mseq, null)
  }else {
    return null
  }
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
goog.provide("cljs.core.ValSeq");
cljs.core.ValSeq = function(mseq, _meta) {
  this.mseq = mseq;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32374988
};
cljs.core.ValSeq.cljs$lang$type = true;
cljs.core.ValSeq.cljs$lang$ctorStr = "cljs.core/ValSeq";
cljs.core.ValSeq.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/ValSeq")
};
cljs.core.ValSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ValSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__6646 = self__.mseq;
    if(G__6646) {
      if(function() {
        var or__3943__auto__ = G__6646.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6646.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__6646.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6646)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6646)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(nseq == null) {
    return null
  }else {
    return new cljs.core.ValSeq(nseq, self__._meta)
  }
};
cljs.core.ValSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ValSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.ValSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, coll)
};
cljs.core.ValSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.call(null, f, start, coll)
};
cljs.core.ValSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ValSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var me = cljs.core._first.call(null, self__.mseq);
  return cljs.core._val.call(null, me)
};
cljs.core.ValSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__6647 = self__.mseq;
    if(G__6647) {
      if(function() {
        var or__3943__auto__ = G__6647.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6647.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__6647.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6647)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6647)
    }
  }() ? cljs.core._next.call(null, self__.mseq) : cljs.core.next.call(null, self__.mseq);
  if(!(nseq == null)) {
    return new cljs.core.ValSeq(nseq, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.ValSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ValSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.ValSeq(self__.mseq, new_meta)
};
cljs.core.ValSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__._meta
};
cljs.core.ValSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_ValSeq = function __GT_ValSeq(mseq, _meta) {
  return new cljs.core.ValSeq(mseq, _meta)
};
cljs.core.vals = function vals(hash_map) {
  var temp__4092__auto__ = cljs.core.seq.call(null, hash_map);
  if(temp__4092__auto__) {
    var mseq = temp__4092__auto__;
    return new cljs.core.ValSeq(mseq, null)
  }else {
    return null
  }
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6648_SHARP_, p2__6649_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto__ = p1__6648_SHARP_;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.PersistentArrayMap.EMPTY
          }
        }(), p2__6649_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(arguments.length > 0) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6650) {
    var maps = cljs.core.seq(arglist__6650);
    return merge__delegate(maps)
  };
  merge.cljs$core$IFn$_invoke$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first.call(null, e);
        var v = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k)) {
          return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core.get.call(null, m, k), v))
        }else {
          return cljs.core.assoc.call(null, m, k, v)
        }
      };
      var merge2 = function(merge_entry) {
        return function(m1, m2) {
          return cljs.core.reduce.call(null, merge_entry, function() {
            var or__3943__auto__ = m1;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.PersistentArrayMap.EMPTY
            }
          }(), cljs.core.seq.call(null, m2))
        }
      }(merge_entry);
      return cljs.core.reduce.call(null, merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(arguments.length > 1) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6651) {
    var f = cljs.core.first(arglist__6651);
    var maps = cljs.core.rest(arglist__6651);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$core$IFn$_invoke$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.PersistentArrayMap.EMPTY;
  var keys = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first.call(null, keys);
      var entry = cljs.core.get.call(null, map, key, new cljs.core.Keyword("cljs.core", "not-found", "cljs.core/not-found", 4155500789));
      var G__6652 = cljs.core.not_EQ_.call(null, entry, new cljs.core.Keyword("cljs.core", "not-found", "cljs.core/not-found", 4155500789)) ? cljs.core.assoc.call(null, ret, key, entry) : ret;
      var G__6653 = cljs.core.next.call(null, keys);
      ret = G__6652;
      keys = G__6653;
      continue
    }else {
      return ret
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorStr = "cljs.core/PersistentHashSet";
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashSet(cljs.core._as_transient.call(null, self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6656 = null;
  var G__6656__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6656__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6656 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6656__2.call(this, self__, k);
      case 3:
        return G__6656__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6656
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args6655) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6655.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.call(null, self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core._dissoc.call(null, self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._count.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__6654_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6654_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentHashSet = function __GT_PersistentHashSet(meta, hash_map, __hash) {
  return new cljs.core.PersistentHashSet(meta, hash_map, __hash)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.EMPTY, 0);
cljs.core.PersistentHashSet.fromArray = function(items, no_clone) {
  var len = items.length;
  if(len / 2 <= cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
    var arr = no_clone ? items : items.slice();
    return new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.fromArray.call(null, arr, true), null)
  }else {
    var i = 0;
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < len) {
        var G__6657 = i + 2;
        var G__6658 = cljs.core.conj_BANG_.call(null, out, items[i]);
        i = G__6657;
        out = G__6658;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorStr = "cljs.core/TransientHashSet";
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6660 = null;
  var G__6660__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6660__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6660 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6660__2.call(this, self__, k);
      case 3:
        return G__6660__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6660
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args6659) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6659.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  if(cljs.core._lookup.call(null, self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  self__.transient_map = cljs.core.dissoc_BANG_.call(null, self__.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  self__.transient_map = cljs.core.assoc_BANG_.call(null, self__.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, self__.transient_map), null)
};
cljs.core.__GT_TransientHashSet = function __GT_TransientHashSet(transient_map) {
  return new cljs.core.TransientHashSet(transient_map)
};
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorStr = "cljs.core/PersistentTreeSet";
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6663 = null;
  var G__6663__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__6663__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__6663 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6663__2.call(this, self__, k);
      case 3:
        return G__6663__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__6663
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args6662) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args6662.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.call(null, self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, self__.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._comparator.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.call(null, self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__6661_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6661_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentTreeSet = function __GT_PersistentTreeSet(meta, tree_map, __hash) {
  return new cljs.core.PersistentTreeSet(meta, tree_map, __hash)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.PersistentTreeMap.EMPTY, 0);
cljs.core.set_from_indexed_seq = function set_from_indexed_seq(iseq) {
  var arr = iseq.arr;
  var ret = function() {
    var a__3656__auto__ = arr;
    var i = 0;
    var res = cljs.core._as_transient.call(null, cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < a__3656__auto__.length) {
        var G__6664 = i + 1;
        var G__6665 = cljs.core._conj_BANG_.call(null, res, arr[i]);
        i = G__6664;
        res = G__6665;
        continue
      }else {
        return res
      }
      break
    }
  }();
  return cljs.core._persistent_BANG_.call(null, ret)
};
cljs.core.set = function set(coll) {
  var in$ = cljs.core.seq.call(null, coll);
  if(in$ == null) {
    return cljs.core.PersistentHashSet.EMPTY
  }else {
    if(in$ instanceof cljs.core.IndexedSeq) {
      return cljs.core.set_from_indexed_seq.call(null, in$)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        var in$__$1 = in$;
        var out = cljs.core._as_transient.call(null, cljs.core.PersistentHashSet.EMPTY);
        while(true) {
          if(!(in$__$1 == null)) {
            var G__6666 = cljs.core._next.call(null, in$__$1);
            var G__6667 = cljs.core._conj_BANG_.call(null, out, cljs.core._first.call(null, in$__$1));
            in$__$1 = G__6666;
            out = G__6667;
            continue
          }else {
            return cljs.core._persistent_BANG_.call(null, out)
          }
          break
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__6668__delegate = function(keys) {
      return cljs.core.set.call(null, keys)
    };
    var G__6668 = function(var_args) {
      var keys = null;
      if(arguments.length > 0) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6668__delegate.call(this, keys)
    };
    G__6668.cljs$lang$maxFixedArity = 0;
    G__6668.cljs$lang$applyTo = function(arglist__6669) {
      var keys = cljs.core.seq(arglist__6669);
      return G__6668__delegate(keys)
    };
    G__6668.cljs$core$IFn$_invoke$arity$variadic = G__6668__delegate;
    return G__6668
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$core$IFn$_invoke$arity$0 = hash_set__0;
  hash_set.cljs$core$IFn$_invoke$arity$variadic = hash_set__1.cljs$core$IFn$_invoke$arity$variadic;
  return hash_set
}();
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(arguments.length > 0) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6670) {
    var keys = cljs.core.seq(arglist__6670);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$core$IFn$_invoke$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(arguments.length > 1) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6671) {
    var comparator = cljs.core.first(arglist__6671);
    var keys = cljs.core.rest(arglist__6671);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$core$IFn$_invoke$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6672_SHARP_) {
      var temp__4090__auto__ = cljs.core.find.call(null, smap, p1__6672_SHARP_);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.second.call(null, e)
      }else {
        return p1__6672_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, function() {
      return function(p__6679, seen__$1) {
        while(true) {
          var vec__6680 = p__6679;
          var f = cljs.core.nth.call(null, vec__6680, 0, null);
          var xs__$1 = vec__6680;
          var temp__4092__auto__ = cljs.core.seq.call(null, xs__$1);
          if(temp__4092__auto__) {
            var s = temp__4092__auto__;
            if(cljs.core.contains_QMARK_.call(null, seen__$1, f)) {
              var G__6681 = cljs.core.rest.call(null, s);
              var G__6682 = seen__$1;
              p__6679 = G__6681;
              seen__$1 = G__6682;
              continue
            }else {
              return cljs.core.cons.call(null, f, step.call(null, cljs.core.rest.call(null, s), cljs.core.conj.call(null, seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null, null)
  };
  return step.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next.call(null, s__$1)) {
      var G__6683 = cljs.core.conj.call(null, ret, cljs.core.first.call(null, s__$1));
      var G__6684 = cljs.core.next.call(null, s__$1);
      ret = G__6683;
      s__$1 = G__6684;
      continue
    }else {
      return cljs.core.seq.call(null, ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(function() {
    var G__6686 = x;
    if(G__6686) {
      if(function() {
        var or__3943__auto__ = G__6686.cljs$lang$protocol_mask$partition1$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6686.cljs$core$INamed$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._name.call(null, x)
  }else {
    if(typeof x === "string") {
      return x
    }else {
      throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var G__6688 = x;
    if(G__6688) {
      if(function() {
        var or__3943__auto__ = G__6688.cljs$lang$protocol_mask$partition1$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__6688.cljs$core$INamed$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._namespace.call(null, x)
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var ks = cljs.core.seq.call(null, keys);
  var vs = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto__ = ks;
      if(and__3941__auto__) {
        return vs
      }else {
        return and__3941__auto__
      }
    }()) {
      var G__6689 = cljs.core.assoc_BANG_.call(null, map, cljs.core.first.call(null, ks), cljs.core.first.call(null, vs));
      var G__6690 = cljs.core.next.call(null, ks);
      var G__6691 = cljs.core.next.call(null, vs);
      map = G__6689;
      ks = G__6690;
      vs = G__6691;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, map)
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6694__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6692_SHARP_, p2__6693_SHARP_) {
        return max_key.call(null, k, p1__6692_SHARP_, p2__6693_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6694 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6694__delegate.call(this, k, x, y, more)
    };
    G__6694.cljs$lang$maxFixedArity = 3;
    G__6694.cljs$lang$applyTo = function(arglist__6695) {
      var k = cljs.core.first(arglist__6695);
      arglist__6695 = cljs.core.next(arglist__6695);
      var x = cljs.core.first(arglist__6695);
      arglist__6695 = cljs.core.next(arglist__6695);
      var y = cljs.core.first(arglist__6695);
      var more = cljs.core.rest(arglist__6695);
      return G__6694__delegate(k, x, y, more)
    };
    G__6694.cljs$core$IFn$_invoke$arity$variadic = G__6694__delegate;
    return G__6694
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$core$IFn$_invoke$arity$2 = max_key__2;
  max_key.cljs$core$IFn$_invoke$arity$3 = max_key__3;
  max_key.cljs$core$IFn$_invoke$arity$variadic = max_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6698__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6696_SHARP_, p2__6697_SHARP_) {
        return min_key.call(null, k, p1__6696_SHARP_, p2__6697_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6698 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6698__delegate.call(this, k, x, y, more)
    };
    G__6698.cljs$lang$maxFixedArity = 3;
    G__6698.cljs$lang$applyTo = function(arglist__6699) {
      var k = cljs.core.first(arglist__6699);
      arglist__6699 = cljs.core.next(arglist__6699);
      var x = cljs.core.first(arglist__6699);
      arglist__6699 = cljs.core.next(arglist__6699);
      var y = cljs.core.first(arglist__6699);
      var more = cljs.core.rest(arglist__6699);
      return G__6698__delegate(k, x, y, more)
    };
    G__6698.cljs$core$IFn$_invoke$arity$variadic = G__6698__delegate;
    return G__6698
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$core$IFn$_invoke$arity$2 = min_key__2;
  min_key.cljs$core$IFn$_invoke$arity$3 = min_key__3;
  min_key.cljs$core$IFn$_invoke$arity$variadic = min_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s)))
      }else {
        return null
      }
    }, null, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$core$IFn$_invoke$arity$2 = partition_all__2;
  partition_all.cljs$core$IFn$_invoke$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_while.call(null, pred, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator.call(null, sc);
    return test.call(null, comp.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, null, cljs.core._GT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__6702 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__6702, 0, null);
        var s = vec__6702;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__6703 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__6703, 0, null);
      var s = vec__6703;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$core$IFn$_invoke$arity$3 = subseq__3;
  subseq.cljs$core$IFn$_invoke$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, null, cljs.core._LT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__6706 = temp__4092__auto__;
        var e = cljs.core.nth.call(null, vec__6706, 0, null);
        var s = vec__6706;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__6707 = temp__4092__auto__;
      var e = cljs.core.nth.call(null, vec__6707, 0, null);
      var s = vec__6707;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$core$IFn$_invoke$arity$3 = rsubseq__3;
  rsubseq.cljs$core$IFn$_invoke$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorStr = "cljs.core/Range";
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var h__3323__auto__ = self__.__hash;
  if(!(h__3323__auto__ == null)) {
    return h__3323__auto__
  }else {
    var h__3323__auto____$1 = cljs.core.hash_coll.call(null, rng);
    self__.__hash = h__3323__auto____$1;
    return h__3323__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_.call(null, coll)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_Range = function __GT_Range(meta, start, end, step, __hash) {
  return new cljs.core.Range(meta, start, end, step, __hash)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$core$IFn$_invoke$arity$0 = range__0;
  range.cljs$core$IFn$_invoke$arity$1 = range__1;
  range.cljs$core$IFn$_invoke$arity$2 = range__2;
  range.cljs$core$IFn$_invoke$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_nth.call(null, n, cljs.core.drop.call(null, n, s)))
    }else {
      return null
    }
  }, null, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, function() {
    var temp__4092__auto__ = cljs.core.seq.call(null, coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      var fst = cljs.core.first.call(null, s);
      var fv = f.call(null, fst);
      var run = cljs.core.cons.call(null, fst, cljs.core.take_while.call(null, function(fst, fv) {
        return function(p1__6708_SHARP_) {
          return cljs.core._EQ_.call(null, fv, f.call(null, p1__6708_SHARP_))
        }
      }(fst, fv), cljs.core.next.call(null, s)));
      return cljs.core.cons.call(null, run, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run), s))))
    }else {
      return null
    }
  }, null, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, function() {
      var temp__4090__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4090__auto__) {
        var s = temp__4090__auto__;
        return reductions.call(null, f, cljs.core.first.call(null, s), cljs.core.rest.call(null, s))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, function() {
      var temp__4092__auto__ = cljs.core.seq.call(null, coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s)), cljs.core.rest.call(null, s))
      }else {
        return null
      }
    }, null, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$core$IFn$_invoke$arity$2 = reductions__2;
  reductions.cljs$core$IFn$_invoke$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6719 = null;
      var G__6719__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6719__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6719__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6719__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6719__4 = function() {
        var G__6720__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6720 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6720__delegate.call(this, x, y, z, args)
        };
        G__6720.cljs$lang$maxFixedArity = 3;
        G__6720.cljs$lang$applyTo = function(arglist__6721) {
          var x = cljs.core.first(arglist__6721);
          arglist__6721 = cljs.core.next(arglist__6721);
          var y = cljs.core.first(arglist__6721);
          arglist__6721 = cljs.core.next(arglist__6721);
          var z = cljs.core.first(arglist__6721);
          var args = cljs.core.rest(arglist__6721);
          return G__6720__delegate(x, y, z, args)
        };
        G__6720.cljs$core$IFn$_invoke$arity$variadic = G__6720__delegate;
        return G__6720
      }();
      G__6719 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6719__0.call(this);
          case 1:
            return G__6719__1.call(this, x);
          case 2:
            return G__6719__2.call(this, x, y);
          case 3:
            return G__6719__3.call(this, x, y, z);
          default:
            return G__6719__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6719.cljs$lang$maxFixedArity = 3;
      G__6719.cljs$lang$applyTo = G__6719__4.cljs$lang$applyTo;
      return G__6719
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6722 = null;
      var G__6722__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6722__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6722__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6722__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6722__4 = function() {
        var G__6723__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6723 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6723__delegate.call(this, x, y, z, args)
        };
        G__6723.cljs$lang$maxFixedArity = 3;
        G__6723.cljs$lang$applyTo = function(arglist__6724) {
          var x = cljs.core.first(arglist__6724);
          arglist__6724 = cljs.core.next(arglist__6724);
          var y = cljs.core.first(arglist__6724);
          arglist__6724 = cljs.core.next(arglist__6724);
          var z = cljs.core.first(arglist__6724);
          var args = cljs.core.rest(arglist__6724);
          return G__6723__delegate(x, y, z, args)
        };
        G__6723.cljs$core$IFn$_invoke$arity$variadic = G__6723__delegate;
        return G__6723
      }();
      G__6722 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6722__0.call(this);
          case 1:
            return G__6722__1.call(this, x);
          case 2:
            return G__6722__2.call(this, x, y);
          case 3:
            return G__6722__3.call(this, x, y, z);
          default:
            return G__6722__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6722.cljs$lang$maxFixedArity = 3;
      G__6722.cljs$lang$applyTo = G__6722__4.cljs$lang$applyTo;
      return G__6722
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6725 = null;
      var G__6725__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6725__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6725__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6725__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6725__4 = function() {
        var G__6726__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6726 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6726__delegate.call(this, x, y, z, args)
        };
        G__6726.cljs$lang$maxFixedArity = 3;
        G__6726.cljs$lang$applyTo = function(arglist__6727) {
          var x = cljs.core.first(arglist__6727);
          arglist__6727 = cljs.core.next(arglist__6727);
          var y = cljs.core.first(arglist__6727);
          arglist__6727 = cljs.core.next(arglist__6727);
          var z = cljs.core.first(arglist__6727);
          var args = cljs.core.rest(arglist__6727);
          return G__6726__delegate(x, y, z, args)
        };
        G__6726.cljs$core$IFn$_invoke$arity$variadic = G__6726__delegate;
        return G__6726
      }();
      G__6725 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6725__0.call(this);
          case 1:
            return G__6725__1.call(this, x);
          case 2:
            return G__6725__2.call(this, x, y);
          case 3:
            return G__6725__3.call(this, x, y, z);
          default:
            return G__6725__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__6725.cljs$lang$maxFixedArity = 3;
      G__6725.cljs$lang$applyTo = G__6725__4.cljs$lang$applyTo;
      return G__6725
    }()
  };
  var juxt__4 = function() {
    var G__6728__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6729 = null;
        var G__6729__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6709_SHARP_, p2__6710_SHARP_) {
            return cljs.core.conj.call(null, p1__6709_SHARP_, p2__6710_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6729__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6711_SHARP_, p2__6712_SHARP_) {
            return cljs.core.conj.call(null, p1__6711_SHARP_, p2__6712_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6729__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6713_SHARP_, p2__6714_SHARP_) {
            return cljs.core.conj.call(null, p1__6713_SHARP_, p2__6714_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6729__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6715_SHARP_, p2__6716_SHARP_) {
            return cljs.core.conj.call(null, p1__6715_SHARP_, p2__6716_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__6729__4 = function() {
          var G__6730__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6717_SHARP_, p2__6718_SHARP_) {
              return cljs.core.conj.call(null, p1__6717_SHARP_, cljs.core.apply.call(null, p2__6718_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__6730 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6730__delegate.call(this, x, y, z, args)
          };
          G__6730.cljs$lang$maxFixedArity = 3;
          G__6730.cljs$lang$applyTo = function(arglist__6731) {
            var x = cljs.core.first(arglist__6731);
            arglist__6731 = cljs.core.next(arglist__6731);
            var y = cljs.core.first(arglist__6731);
            arglist__6731 = cljs.core.next(arglist__6731);
            var z = cljs.core.first(arglist__6731);
            var args = cljs.core.rest(arglist__6731);
            return G__6730__delegate(x, y, z, args)
          };
          G__6730.cljs$core$IFn$_invoke$arity$variadic = G__6730__delegate;
          return G__6730
        }();
        G__6729 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6729__0.call(this);
            case 1:
              return G__6729__1.call(this, x);
            case 2:
              return G__6729__2.call(this, x, y);
            case 3:
              return G__6729__3.call(this, x, y, z);
            default:
              return G__6729__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__6729.cljs$lang$maxFixedArity = 3;
        G__6729.cljs$lang$applyTo = G__6729__4.cljs$lang$applyTo;
        return G__6729
      }()
    };
    var G__6728 = function(f, g, h, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6728__delegate.call(this, f, g, h, fs)
    };
    G__6728.cljs$lang$maxFixedArity = 3;
    G__6728.cljs$lang$applyTo = function(arglist__6732) {
      var f = cljs.core.first(arglist__6732);
      arglist__6732 = cljs.core.next(arglist__6732);
      var g = cljs.core.first(arglist__6732);
      arglist__6732 = cljs.core.next(arglist__6732);
      var h = cljs.core.first(arglist__6732);
      var fs = cljs.core.rest(arglist__6732);
      return G__6728__delegate(f, g, h, fs)
    };
    G__6728.cljs$core$IFn$_invoke$arity$variadic = G__6728__delegate;
    return G__6728
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$core$IFn$_invoke$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$core$IFn$_invoke$arity$1 = juxt__1;
  juxt.cljs$core$IFn$_invoke$arity$2 = juxt__2;
  juxt.cljs$core$IFn$_invoke$arity$3 = juxt__3;
  juxt.cljs$core$IFn$_invoke$arity$variadic = juxt__4.cljs$core$IFn$_invoke$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__6733 = cljs.core.next.call(null, coll);
        coll = G__6733;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = cljs.core.seq.call(null, coll);
        if(and__3941__auto__) {
          return n > 0
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__6734 = n - 1;
        var G__6735 = cljs.core.next.call(null, coll);
        n = G__6734;
        coll = G__6735;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$core$IFn$_invoke$arity$1 = dorun__1;
  dorun.cljs$core$IFn$_invoke$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$core$IFn$_invoke$arity$1 = doall__1;
  doall.cljs$core$IFn$_invoke$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches), s)) {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find.call(null, re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_.call(null, match_data) ? cljs.core.first.call(null, match_data) : match_data;
  var post_match = cljs.core.subs.call(null, s, match_idx + cljs.core.count.call(null, match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, function() {
      return cljs.core.cons.call(null, match_data, re_seq.call(null, re, post_match))
    }, null, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6737 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.call(null, vec__6737, 0, null);
  var flags = cljs.core.nth.call(null, vec__6737, 1, null);
  var pattern = cljs.core.nth.call(null, vec__6737, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var seq__6742_6746 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  var chunk__6743_6747 = null;
  var count__6744_6748 = 0;
  var i__6745_6749 = 0;
  while(true) {
    if(i__6745_6749 < count__6744_6748) {
      var o_6750 = cljs.core._nth.call(null, chunk__6743_6747, i__6745_6749);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o_6750, writer, opts);
      var G__6751 = seq__6742_6746;
      var G__6752 = chunk__6743_6747;
      var G__6753 = count__6744_6748;
      var G__6754 = i__6745_6749 + 1;
      seq__6742_6746 = G__6751;
      chunk__6743_6747 = G__6752;
      count__6744_6748 = G__6753;
      i__6745_6749 = G__6754;
      continue
    }else {
      var temp__4092__auto___6755 = cljs.core.seq.call(null, seq__6742_6746);
      if(temp__4092__auto___6755) {
        var seq__6742_6756__$1 = temp__4092__auto___6755;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6742_6756__$1)) {
          var c__3615__auto___6757 = cljs.core.chunk_first.call(null, seq__6742_6756__$1);
          var G__6758 = cljs.core.chunk_rest.call(null, seq__6742_6756__$1);
          var G__6759 = c__3615__auto___6757;
          var G__6760 = cljs.core.count.call(null, c__3615__auto___6757);
          var G__6761 = 0;
          seq__6742_6746 = G__6758;
          chunk__6743_6747 = G__6759;
          count__6744_6748 = G__6760;
          i__6745_6749 = G__6761;
          continue
        }else {
          var o_6762 = cljs.core.first.call(null, seq__6742_6756__$1);
          cljs.core._write.call(null, writer, sep);
          print_one.call(null, o_6762, writer, opts);
          var G__6763 = cljs.core.next.call(null, seq__6742_6756__$1);
          var G__6764 = null;
          var G__6765 = 0;
          var G__6766 = 0;
          seq__6742_6746 = G__6763;
          chunk__6743_6747 = G__6764;
          count__6744_6748 = G__6765;
          i__6745_6749 = G__6766;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var seq__6771 = cljs.core.seq.call(null, ss);
    var chunk__6772 = null;
    var count__6773 = 0;
    var i__6774 = 0;
    while(true) {
      if(i__6774 < count__6773) {
        var s = cljs.core._nth.call(null, chunk__6772, i__6774);
        cljs.core._write.call(null, writer, s);
        var G__6775 = seq__6771;
        var G__6776 = chunk__6772;
        var G__6777 = count__6773;
        var G__6778 = i__6774 + 1;
        seq__6771 = G__6775;
        chunk__6772 = G__6776;
        count__6773 = G__6777;
        i__6774 = G__6778;
        continue
      }else {
        var temp__4092__auto__ = cljs.core.seq.call(null, seq__6771);
        if(temp__4092__auto__) {
          var seq__6771__$1 = temp__4092__auto__;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__6771__$1)) {
            var c__3615__auto__ = cljs.core.chunk_first.call(null, seq__6771__$1);
            var G__6779 = cljs.core.chunk_rest.call(null, seq__6771__$1);
            var G__6780 = c__3615__auto__;
            var G__6781 = cljs.core.count.call(null, c__3615__auto__);
            var G__6782 = 0;
            seq__6771 = G__6779;
            chunk__6772 = G__6780;
            count__6773 = G__6781;
            i__6774 = G__6782;
            continue
          }else {
            var s = cljs.core.first.call(null, seq__6771__$1);
            cljs.core._write.call(null, writer, s);
            var G__6783 = cljs.core.next.call(null, seq__6771__$1);
            var G__6784 = null;
            var G__6785 = 0;
            var G__6786 = 0;
            seq__6771 = G__6783;
            chunk__6772 = G__6784;
            count__6773 = G__6785;
            i__6774 = G__6786;
            continue
          }
        }else {
          return null
        }
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(arguments.length > 1) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__6787) {
    var writer = cljs.core.first(arglist__6787);
    var ss = cljs.core.rest(arglist__6787);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$core$IFn$_invoke$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.char_escapes = {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"};
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core.char_escapes[match]
  })), cljs.core.str('"')].join("")
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#\x3cundefined\x3e")
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = cljs.core.get.call(null, opts, new cljs.core.Keyword(null, "meta", "meta", 1017252215));
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = function() {
              var G__6791 = obj;
              if(G__6791) {
                if(function() {
                  var or__3943__auto__ = G__6791.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__6791.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6791.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6791)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6791)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(obj == null) {
          return cljs.core._write.call(null, writer, "nil")
        }else {
          if(obj.cljs$lang$type) {
            return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
          }else {
            if(function() {
              var G__6792 = obj;
              if(G__6792) {
                if(function() {
                  var or__3943__auto__ = G__6792.cljs$lang$protocol_mask$partition0$ & 2147483648;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__6792.cljs$core$IPrintWithWriter$
                  }
                }()) {
                  return true
                }else {
                  return false
                }
              }else {
                return false
              }
            }()) {
              return cljs.core._pr_writer.call(null, obj, writer, opts)
            }else {
              if(function() {
                var or__3943__auto__ = cljs.core.type.call(null, obj) === Boolean;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return typeof obj === "number"
                }
              }()) {
                return cljs.core._write.call(null, writer, [cljs.core.str(obj)].join(""))
              }else {
                if(obj instanceof Array) {
                  return cljs.core.pr_sequential_writer.call(null, writer, pr_writer, "#\x3cArray [", ", ", "]\x3e", opts, obj)
                }else {
                  if(goog.isString(obj)) {
                    if(cljs.core.truth_((new cljs.core.Keyword(null, "readably", "readably", 4441712502)).call(null, opts))) {
                      return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
                    }else {
                      return cljs.core._write.call(null, writer, obj)
                    }
                  }else {
                    if(cljs.core.fn_QMARK_.call(null, obj)) {
                      return cljs.core.write_all.call(null, writer, "#\x3c", [cljs.core.str(obj)].join(""), "\x3e")
                    }else {
                      if(obj instanceof Date) {
                        var normalize = function(n, len) {
                          var ns = [cljs.core.str(n)].join("");
                          while(true) {
                            if(cljs.core.count.call(null, ns) < len) {
                              var G__6794 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
                              ns = G__6794;
                              continue
                            }else {
                              return ns
                            }
                            break
                          }
                        };
                        return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(obj.getUTCFullYear())].join(""), "-", normalize.call(null, obj.getUTCMonth() + 1, 2), "-", normalize.call(null, obj.getUTCDate(), 2), "T", normalize.call(null, obj.getUTCHours(), 2), ":", normalize.call(null, obj.getUTCMinutes(), 2), ":", normalize.call(null, obj.getUTCSeconds(), 2), ".", normalize.call(null, obj.getUTCMilliseconds(), 3), "-", '00:00"')
                      }else {
                        if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                          return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
                        }else {
                          if(function() {
                            var G__6793 = obj;
                            if(G__6793) {
                              if(function() {
                                var or__3943__auto__ = G__6793.cljs$lang$protocol_mask$partition0$ & 2147483648;
                                if(or__3943__auto__) {
                                  return or__3943__auto__
                                }else {
                                  return G__6793.cljs$core$IPrintWithWriter$
                                }
                              }()) {
                                return true
                              }else {
                                if(!G__6793.cljs$lang$protocol_mask$partition0$) {
                                  return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__6793)
                                }else {
                                  return false
                                }
                              }
                            }else {
                              return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__6793)
                            }
                          }()) {
                            return cljs.core._pr_writer.call(null, obj, writer, opts)
                          }else {
                            if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                              return cljs.core.write_all.call(null, writer, "#\x3c", [cljs.core.str(obj)].join(""), "\x3e")
                            }else {
                              return null
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var seq__6799 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  var chunk__6800 = null;
  var count__6801 = 0;
  var i__6802 = 0;
  while(true) {
    if(i__6802 < count__6801) {
      var obj = cljs.core._nth.call(null, chunk__6800, i__6802);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj, writer, opts);
      var G__6803 = seq__6799;
      var G__6804 = chunk__6800;
      var G__6805 = count__6801;
      var G__6806 = i__6802 + 1;
      seq__6799 = G__6803;
      chunk__6800 = G__6804;
      count__6801 = G__6805;
      i__6802 = G__6806;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__6799);
      if(temp__4092__auto__) {
        var seq__6799__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6799__$1)) {
          var c__3615__auto__ = cljs.core.chunk_first.call(null, seq__6799__$1);
          var G__6807 = cljs.core.chunk_rest.call(null, seq__6799__$1);
          var G__6808 = c__3615__auto__;
          var G__6809 = cljs.core.count.call(null, c__3615__auto__);
          var G__6810 = 0;
          seq__6799 = G__6807;
          chunk__6800 = G__6808;
          count__6801 = G__6809;
          i__6802 = G__6810;
          continue
        }else {
          var obj = cljs.core.first.call(null, seq__6799__$1);
          cljs.core._write.call(null, writer, " ");
          cljs.core.pr_writer.call(null, obj, writer, opts);
          var G__6811 = cljs.core.next.call(null, seq__6799__$1);
          var G__6812 = null;
          var G__6813 = 0;
          var G__6814 = 0;
          seq__6799 = G__6811;
          chunk__6800 = G__6812;
          count__6801 = G__6813;
          i__6802 = G__6814;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer.call(null, objs, writer, opts);
  cljs.core._flush.call(null, writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, new cljs.core.Keyword(null, "flush-on-newline", "flush-on-newline", 4338025857)))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6815) {
    var objs = cljs.core.seq(arglist__6815);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$core$IFn$_invoke$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6816) {
    var objs = cljs.core.seq(arglist__6816);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$core$IFn$_invoke$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6817) {
    var objs = cljs.core.seq(arglist__6817);
    return pr__delegate(objs)
  };
  pr.cljs$core$IFn$_invoke$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6818) {
    var objs = cljs.core.seq(arglist__6818);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$core$IFn$_invoke$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6819) {
    var objs = cljs.core.seq(arglist__6819);
    return print_str__delegate(objs)
  };
  print_str.cljs$core$IFn$_invoke$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6820) {
    var objs = cljs.core.seq(arglist__6820);
    return println__delegate(objs)
  };
  println.cljs$core$IFn$_invoke$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), new cljs.core.Keyword(null, "readably", "readably", 4441712502), false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6821) {
    var objs = cljs.core.seq(arglist__6821);
    return println_str__delegate(objs)
  };
  println_str.cljs$core$IFn$_invoke$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6822) {
    var objs = cljs.core.seq(arglist__6822);
    return prn__delegate(objs)
  };
  prn.cljs$core$IFn$_invoke$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.KeySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.KeySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ValSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ValSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Subvec.prototype.cljs$core$IComparable$ = true;
cljs.core.Subvec.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2153938944;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorStr = "cljs.core/Atom";
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var seq__6823 = cljs.core.seq.call(null, self__.watches);
  var chunk__6824 = null;
  var count__6825 = 0;
  var i__6826 = 0;
  while(true) {
    if(i__6826 < count__6825) {
      var vec__6827 = cljs.core._nth.call(null, chunk__6824, i__6826);
      var key = cljs.core.nth.call(null, vec__6827, 0, null);
      var f = cljs.core.nth.call(null, vec__6827, 1, null);
      f.call(null, key, this$, oldval, newval);
      var G__6829 = seq__6823;
      var G__6830 = chunk__6824;
      var G__6831 = count__6825;
      var G__6832 = i__6826 + 1;
      seq__6823 = G__6829;
      chunk__6824 = G__6830;
      count__6825 = G__6831;
      i__6826 = G__6832;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__6823);
      if(temp__4092__auto__) {
        var seq__6823__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__6823__$1)) {
          var c__3615__auto__ = cljs.core.chunk_first.call(null, seq__6823__$1);
          var G__6833 = cljs.core.chunk_rest.call(null, seq__6823__$1);
          var G__6834 = c__3615__auto__;
          var G__6835 = cljs.core.count.call(null, c__3615__auto__);
          var G__6836 = 0;
          seq__6823 = G__6833;
          chunk__6824 = G__6834;
          count__6825 = G__6835;
          i__6826 = G__6836;
          continue
        }else {
          var vec__6828 = cljs.core.first.call(null, seq__6823__$1);
          var key = cljs.core.nth.call(null, vec__6828, 0, null);
          var f = cljs.core.nth.call(null, vec__6828, 1, null);
          f.call(null, key, this$, oldval, newval);
          var G__6837 = cljs.core.next.call(null, seq__6823__$1);
          var G__6838 = null;
          var G__6839 = 0;
          var G__6840 = 0;
          seq__6823 = G__6837;
          chunk__6824 = G__6838;
          count__6825 = G__6839;
          i__6826 = G__6840;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.call(null, self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.call(null, self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  cljs.core._write.call(null, writer, "#\x3cAtom: ");
  cljs.core.pr_writer.call(null, self__.state, writer, opts);
  return cljs.core._write.call(null, writer, "\x3e")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return o === other
};
cljs.core.__GT_Atom = function __GT_Atom(state, meta, validator, watches) {
  return new cljs.core.Atom(state, meta, validator, watches)
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6844__delegate = function(x, p__6841) {
      var map__6843 = p__6841;
      var map__6843__$1 = cljs.core.seq_QMARK_.call(null, map__6843) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6843) : map__6843;
      var validator = cljs.core.get.call(null, map__6843__$1, new cljs.core.Keyword(null, "validator", "validator", 4199087812));
      var meta = cljs.core.get.call(null, map__6843__$1, new cljs.core.Keyword(null, "meta", "meta", 1017252215));
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__6844 = function(x, var_args) {
      var p__6841 = null;
      if(arguments.length > 1) {
        p__6841 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6844__delegate.call(this, x, p__6841)
    };
    G__6844.cljs$lang$maxFixedArity = 1;
    G__6844.cljs$lang$applyTo = function(arglist__6845) {
      var x = cljs.core.first(arglist__6845);
      var p__6841 = cljs.core.rest(arglist__6845);
      return G__6844__delegate(x, p__6841)
    };
    G__6844.cljs$core$IFn$_invoke$arity$variadic = G__6844__delegate;
    return G__6844
  }();
  atom = function(x, var_args) {
    var p__6841 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$core$IFn$_invoke$arity$1 = atom__1;
  atom.cljs$core$IFn$_invoke$arity$variadic = atom__2.cljs$core$IFn$_invoke$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto___6846 = a.validator;
  if(cljs.core.truth_(temp__4092__auto___6846)) {
    var validate_6847 = temp__4092__auto___6846;
    if(cljs.core.truth_(validate_6847.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "validate", "validate", 1233162959, null), new cljs.core.Symbol(null, "new-value", "new-value", 972165309, null))))].join(""));
    }
  }else {
  }
  var old_value_6848 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value_6848, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6849__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6849 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(arguments.length > 5) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6849__delegate.call(this, a, f, x, y, z, more)
    };
    G__6849.cljs$lang$maxFixedArity = 5;
    G__6849.cljs$lang$applyTo = function(arglist__6850) {
      var a = cljs.core.first(arglist__6850);
      arglist__6850 = cljs.core.next(arglist__6850);
      var f = cljs.core.first(arglist__6850);
      arglist__6850 = cljs.core.next(arglist__6850);
      var x = cljs.core.first(arglist__6850);
      arglist__6850 = cljs.core.next(arglist__6850);
      var y = cljs.core.first(arglist__6850);
      arglist__6850 = cljs.core.next(arglist__6850);
      var z = cljs.core.first(arglist__6850);
      var more = cljs.core.rest(arglist__6850);
      return G__6849__delegate(a, f, x, y, z, more)
    };
    G__6849.cljs$core$IFn$_invoke$arity$variadic = G__6849__delegate;
    return G__6849
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$core$IFn$_invoke$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$core$IFn$_invoke$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$core$IFn$_invoke$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$core$IFn$_invoke$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6851) {
    var iref = cljs.core.first(arglist__6851);
    arglist__6851 = cljs.core.next(arglist__6851);
    var f = cljs.core.first(arglist__6851);
    var args = cljs.core.rest(arglist__6851);
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$core$IFn$_invoke$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$core$IFn$_invoke$arity$0 = gensym__0;
  gensym.cljs$core$IFn$_invoke$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorStr = "cljs.core/Delay";
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  return(new cljs.core.Keyword(null, "done", "done", 1016993524)).call(null, cljs.core.deref.call(null, self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return(new cljs.core.Keyword(null, "value", "value", 1125876963)).call(null, cljs.core.swap_BANG_.call(null, self__.state, function(p__6852) {
    var map__6853 = p__6852;
    var map__6853__$1 = cljs.core.seq_QMARK_.call(null, map__6853) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6853) : map__6853;
    var curr_state = map__6853__$1;
    var done = cljs.core.get.call(null, map__6853__$1, new cljs.core.Keyword(null, "done", "done", 1016993524));
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "done", "done", 1016993524), true, new cljs.core.Keyword(null, "value", "value", 1125876963), self__.f.call(null)], true)
    }
  }))
};
cljs.core.__GT_Delay = function __GT_Delay(state, f) {
  return new cljs.core.Delay(state, f)
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return x instanceof cljs.core.Delay
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__3502__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj-\x3ejs", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__3502__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._key__GT_js[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key-\x3ejs", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.key__GT_js = function key__GT_js(k) {
  if(function() {
    var G__6855 = k;
    if(G__6855) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__6855.cljs$core$IEncodeJS$
        }
      }())) {
        return true
      }else {
        if(!G__6855.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__6855)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__6855)
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    if(function() {
      var or__3943__auto__ = typeof k === "string";
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = typeof k === "number";
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          var or__3943__auto____$2 = k instanceof cljs.core.Keyword;
          if(or__3943__auto____$2) {
            return or__3943__auto____$2
          }else {
            return k instanceof cljs.core.Symbol
          }
        }
      }
    }()) {
      return cljs.core.clj__GT_js.call(null, k)
    }else {
      return cljs.core.pr_str.call(null, k)
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  if(x == null) {
    return null
  }else {
    if(function() {
      var G__6863 = x;
      if(G__6863) {
        if(cljs.core.truth_(function() {
          var or__3943__auto__ = null;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return G__6863.cljs$core$IEncodeJS$
          }
        }())) {
          return true
        }else {
          if(!G__6863.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__6863)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeJS, G__6863)
      }
    }()) {
      return cljs.core._clj__GT_js.call(null, x)
    }else {
      if(x instanceof cljs.core.Keyword) {
        return cljs.core.name.call(null, x)
      }else {
        if(x instanceof cljs.core.Symbol) {
          return[cljs.core.str(x)].join("")
        }else {
          if(cljs.core.map_QMARK_.call(null, x)) {
            var m = {};
            var seq__6864_6870 = cljs.core.seq.call(null, x);
            var chunk__6865_6871 = null;
            var count__6866_6872 = 0;
            var i__6867_6873 = 0;
            while(true) {
              if(i__6867_6873 < count__6866_6872) {
                var vec__6868_6874 = cljs.core._nth.call(null, chunk__6865_6871, i__6867_6873);
                var k_6875 = cljs.core.nth.call(null, vec__6868_6874, 0, null);
                var v_6876 = cljs.core.nth.call(null, vec__6868_6874, 1, null);
                m[cljs.core.key__GT_js.call(null, k_6875)] = clj__GT_js.call(null, v_6876);
                var G__6877 = seq__6864_6870;
                var G__6878 = chunk__6865_6871;
                var G__6879 = count__6866_6872;
                var G__6880 = i__6867_6873 + 1;
                seq__6864_6870 = G__6877;
                chunk__6865_6871 = G__6878;
                count__6866_6872 = G__6879;
                i__6867_6873 = G__6880;
                continue
              }else {
                var temp__4092__auto___6881 = cljs.core.seq.call(null, seq__6864_6870);
                if(temp__4092__auto___6881) {
                  var seq__6864_6882__$1 = temp__4092__auto___6881;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__6864_6882__$1)) {
                    var c__3615__auto___6883 = cljs.core.chunk_first.call(null, seq__6864_6882__$1);
                    var G__6884 = cljs.core.chunk_rest.call(null, seq__6864_6882__$1);
                    var G__6885 = c__3615__auto___6883;
                    var G__6886 = cljs.core.count.call(null, c__3615__auto___6883);
                    var G__6887 = 0;
                    seq__6864_6870 = G__6884;
                    chunk__6865_6871 = G__6885;
                    count__6866_6872 = G__6886;
                    i__6867_6873 = G__6887;
                    continue
                  }else {
                    var vec__6869_6888 = cljs.core.first.call(null, seq__6864_6882__$1);
                    var k_6889 = cljs.core.nth.call(null, vec__6869_6888, 0, null);
                    var v_6890 = cljs.core.nth.call(null, vec__6869_6888, 1, null);
                    m[cljs.core.key__GT_js.call(null, k_6889)] = clj__GT_js.call(null, v_6890);
                    var G__6891 = cljs.core.next.call(null, seq__6864_6882__$1);
                    var G__6892 = null;
                    var G__6893 = 0;
                    var G__6894 = 0;
                    seq__6864_6870 = G__6891;
                    chunk__6865_6871 = G__6892;
                    count__6866_6872 = G__6893;
                    i__6867_6873 = G__6894;
                    continue
                  }
                }else {
                }
              }
              break
            }
            return m
          }else {
            if(cljs.core.coll_QMARK_.call(null, x)) {
              return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function _js__GT_clj(x, options) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
  }else {
    var x__3502__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._js__GT_clj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js-\x3eclj", x);
        }
      }
    }().call(null, x, options)
  }
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj = null;
  var js__GT_clj__1 = function(x) {
    return js__GT_clj.call(null, x, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "keywordize-keys", "keywordize-keys", 4191781672), false], true))
  };
  var js__GT_clj__2 = function() {
    var G__6915__delegate = function(x, opts) {
      if(function() {
        var G__6905 = x;
        if(G__6905) {
          if(cljs.core.truth_(function() {
            var or__3943__auto__ = null;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return G__6905.cljs$core$IEncodeClojure$
            }
          }())) {
            return true
          }else {
            if(!G__6905.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeClojure, G__6905)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEncodeClojure, G__6905)
        }
      }()) {
        return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
      }else {
        if(cljs.core.seq.call(null, opts)) {
          var map__6906 = opts;
          var map__6906__$1 = cljs.core.seq_QMARK_.call(null, map__6906) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6906) : map__6906;
          var keywordize_keys = cljs.core.get.call(null, map__6906__$1, new cljs.core.Keyword(null, "keywordize-keys", "keywordize-keys", 4191781672));
          var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
          var f = function(map__6906, map__6906__$1, keywordize_keys, keyfn) {
            return function thisfn(x__$1) {
              if(cljs.core.seq_QMARK_.call(null, x__$1)) {
                return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x__$1))
              }else {
                if(cljs.core.coll_QMARK_.call(null, x__$1)) {
                  return cljs.core.into.call(null, cljs.core.empty.call(null, x__$1), cljs.core.map.call(null, thisfn, x__$1))
                }else {
                  if(x__$1 instanceof Array) {
                    return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x__$1))
                  }else {
                    if(cljs.core.type.call(null, x__$1) === Object) {
                      return cljs.core.into.call(null, cljs.core.PersistentArrayMap.EMPTY, function() {
                        var iter__3584__auto__ = function(map__6906, map__6906__$1, keywordize_keys, keyfn) {
                          return function iter__6911(s__6912) {
                            return new cljs.core.LazySeq(null, function(map__6906, map__6906__$1, keywordize_keys, keyfn) {
                              return function() {
                                var s__6912__$1 = s__6912;
                                while(true) {
                                  var temp__4092__auto__ = cljs.core.seq.call(null, s__6912__$1);
                                  if(temp__4092__auto__) {
                                    var s__6912__$2 = temp__4092__auto__;
                                    if(cljs.core.chunked_seq_QMARK_.call(null, s__6912__$2)) {
                                      var c__3582__auto__ = cljs.core.chunk_first.call(null, s__6912__$2);
                                      var size__3583__auto__ = cljs.core.count.call(null, c__3582__auto__);
                                      var b__6914 = cljs.core.chunk_buffer.call(null, size__3583__auto__);
                                      if(function() {
                                        var i__6913 = 0;
                                        while(true) {
                                          if(i__6913 < size__3583__auto__) {
                                            var k = cljs.core._nth.call(null, c__3582__auto__, i__6913);
                                            cljs.core.chunk_append.call(null, b__6914, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true));
                                            var G__6916 = i__6913 + 1;
                                            i__6913 = G__6916;
                                            continue
                                          }else {
                                            return true
                                          }
                                          break
                                        }
                                      }()) {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6914), iter__6911.call(null, cljs.core.chunk_rest.call(null, s__6912__$2)))
                                      }else {
                                        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6914), null)
                                      }
                                    }else {
                                      var k = cljs.core.first.call(null, s__6912__$2);
                                      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true), iter__6911.call(null, cljs.core.rest.call(null, s__6912__$2)))
                                    }
                                  }else {
                                    return null
                                  }
                                  break
                                }
                              }
                            }(map__6906, map__6906__$1, keywordize_keys, keyfn), null, null)
                          }
                        }(map__6906, map__6906__$1, keywordize_keys, keyfn);
                        return iter__3584__auto__.call(null, cljs.core.js_keys.call(null, x__$1))
                      }())
                    }else {
                      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                        return x__$1
                      }else {
                        return null
                      }
                    }
                  }
                }
              }
            }
          }(map__6906, map__6906__$1, keywordize_keys, keyfn);
          return f.call(null, x)
        }else {
          return null
        }
      }
    };
    var G__6915 = function(x, var_args) {
      var opts = null;
      if(arguments.length > 1) {
        opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6915__delegate.call(this, x, opts)
    };
    G__6915.cljs$lang$maxFixedArity = 1;
    G__6915.cljs$lang$applyTo = function(arglist__6917) {
      var x = cljs.core.first(arglist__6917);
      var opts = cljs.core.rest(arglist__6917);
      return G__6915__delegate(x, opts)
    };
    G__6915.cljs$core$IFn$_invoke$arity$variadic = G__6915__delegate;
    return G__6915
  }();
  js__GT_clj = function(x, var_args) {
    var opts = var_args;
    switch(arguments.length) {
      case 1:
        return js__GT_clj__1.call(this, x);
      default:
        return js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = js__GT_clj__2.cljs$lang$applyTo;
  js__GT_clj.cljs$core$IFn$_invoke$arity$1 = js__GT_clj__1;
  js__GT_clj.cljs$core$IFn$_invoke$arity$variadic = js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  return function() {
    var G__6918__delegate = function(args) {
      var temp__4090__auto__ = cljs.core.get.call(null, cljs.core.deref.call(null, mem), args);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var v = temp__4090__auto__;
        return v
      }else {
        var ret = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__6918 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6918__delegate.call(this, args)
    };
    G__6918.cljs$lang$maxFixedArity = 0;
    G__6918.cljs$lang$applyTo = function(arglist__6919) {
      var args = cljs.core.seq(arglist__6919);
      return G__6918__delegate(args)
    };
    G__6918.cljs$core$IFn$_invoke$arity$variadic = G__6918__delegate;
    return G__6918
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret)) {
        var G__6920 = ret;
        f = G__6920;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6921__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6921 = function(f, var_args) {
      var args = null;
      if(arguments.length > 1) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6921__delegate.call(this, f, args)
    };
    G__6921.cljs$lang$maxFixedArity = 1;
    G__6921.cljs$lang$applyTo = function(arglist__6922) {
      var f = cljs.core.first(arglist__6922);
      var args = cljs.core.rest(arglist__6922);
      return G__6921__delegate(f, args)
    };
    G__6921.cljs$core$IFn$_invoke$arity$variadic = G__6921__delegate;
    return G__6921
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$core$IFn$_invoke$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$core$IFn$_invoke$arity$1 = trampoline__1;
  trampoline.cljs$core$IFn$_invoke$arity$variadic = trampoline__2.cljs$core$IFn$_invoke$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.PersistentArrayMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "parents", "parents", 4515496059), cljs.core.PersistentArrayMap.EMPTY, new cljs.core.Keyword(null, "descendants", "descendants", 768214664), cljs.core.PersistentArrayMap.EMPTY, new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442), cljs.core.PersistentArrayMap.EMPTY], true)
};
cljs.core._global_hierarchy = null;
cljs.core.get_global_hierarchy = function get_global_hierarchy() {
  if(cljs.core._global_hierarchy == null) {
    cljs.core._global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null))
  }else {
  }
  return cljs.core._global_hierarchy
};
cljs.core.swap_global_hierarchy_BANG_ = function() {
  var swap_global_hierarchy_BANG___delegate = function(f, args) {
    return cljs.core.apply.call(null, cljs.core.swap_BANG_, cljs.core.get_global_hierarchy.call(null), f, args)
  };
  var swap_global_hierarchy_BANG_ = function(f, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return swap_global_hierarchy_BANG___delegate.call(this, f, args)
  };
  swap_global_hierarchy_BANG_.cljs$lang$maxFixedArity = 1;
  swap_global_hierarchy_BANG_.cljs$lang$applyTo = function(arglist__6923) {
    var f = cljs.core.first(arglist__6923);
    var args = cljs.core.rest(arglist__6923);
    return swap_global_hierarchy_BANG___delegate(f, args)
  };
  swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_global_hierarchy_BANG___delegate;
  return swap_global_hierarchy_BANG_
}();
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto__ = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).call(null, h).call(null, child), parent);
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var and__3941__auto__ = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto__) {
          var and__3941__auto____$1 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____$1) {
            var and__3941__auto____$2 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____$2 = cljs.core.not.call(null, ret);
                  if(or__3943__auto____$2) {
                    return or__3943__auto____$2
                  }else {
                    return i === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret
                }else {
                  var G__6924 = isa_QMARK_.call(null, h, child.call(null, i), parent.call(null, i));
                  var G__6925 = i + 1;
                  ret = G__6924;
                  i = G__6925;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____$2
            }
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$core$IFn$_invoke$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$core$IFn$_invoke$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$core$IFn$_invoke$arity$1 = parents__1;
  parents.cljs$core$IFn$_invoke$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$core$IFn$_invoke$arity$1 = ancestors__1;
  ancestors.cljs$core$IFn$_invoke$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.get_global_hierarchy.call(null)), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, (new cljs.core.Keyword(null, "descendants", "descendants", 768214664)).call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$core$IFn$_invoke$arity$1 = descendants__1;
  descendants.cljs$core$IFn$_invoke$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "namespace", "namespace", -388313324, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null))))].join(""));
    }
    cljs.core.swap_global_hierarchy_BANG_.call(null, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "not\x3d", "not\x3d", -1637144189, null), new cljs.core.Symbol(null, "tag", "tag", -1640416941, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null))))].join(""));
    }
    var tp = (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).call(null, h);
    var td = (new cljs.core.Keyword(null, "descendants", "descendants", 768214664)).call(null, h);
    var ta = (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).call(null, h);
    var tf = function(tp, td, ta) {
      return function(m, source, sources, target, targets) {
        return cljs.core.reduce.call(null, function(tp, td, ta) {
          return function(ret, k) {
            return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
          }
        }(tp, td, ta), m, cljs.core.cons.call(null, source, sources.call(null, source)))
      }
    }(tp, td, ta);
    var or__3943__auto__ = cljs.core.contains_QMARK_.call(null, tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "parents", "parents", 4515496059), cljs.core.assoc.call(null, (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442), tf.call(null, (new cljs.core.Keyword(null, "ancestors", "ancestors", 889955442)).call(null, h), tag, td, 
      parent, ta), new cljs.core.Keyword(null, "descendants", "descendants", 768214664), tf.call(null, (new cljs.core.Keyword(null, "descendants", "descendants", 768214664)).call(null, h), parent, ta, tag, td)], true)
    }();
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$core$IFn$_invoke$arity$2 = derive__2;
  derive.cljs$core$IFn$_invoke$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_global_hierarchy_BANG_.call(null, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword(null, "parents", "parents", 4515496059)).call(null, h);
    var childsParents = cljs.core.truth_(parentMap.call(null, tag)) ? cljs.core.disj.call(null, parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents)) ? cljs.core.assoc.call(null, parentMap, tag, childsParents) : cljs.core.dissoc.call(null, parentMap, tag);
    var deriv_seq = cljs.core.flatten.call(null, cljs.core.map.call(null, function(parentMap, childsParents, newParents) {
      return function(p1__6926_SHARP_) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6926_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6926_SHARP_), cljs.core.second.call(null, p1__6926_SHARP_)))
      }
    }(parentMap, childsParents, newParents), cljs.core.seq.call(null, newParents)));
    if(cljs.core.contains_QMARK_.call(null, parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6927_SHARP_, p2__6928_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6927_SHARP_, p2__6928_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$core$IFn$_invoke$arity$2 = underive__2;
  underive.cljs$core$IFn$_invoke$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = xprefs;
    if(cljs.core.truth_(and__3941__auto__)) {
      return xprefs.call(null, y)
    }else {
      return and__3941__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var or__3943__auto____$1 = function() {
      var ps = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps), prefer_table))) {
          }else {
          }
          var G__6929 = cljs.core.rest.call(null, ps);
          ps = G__6929;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____$1)) {
      return or__3943__auto____$1
    }else {
      var or__3943__auto____$2 = function() {
        var ps = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps), y, prefer_table))) {
            }else {
            }
            var G__6930 = cljs.core.rest.call(null, ps);
            ps = G__6930;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____$2)) {
        return or__3943__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto__ = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.call(null, function(be, p__6933) {
    var vec__6934 = p__6933;
    var k = cljs.core.nth.call(null, vec__6934, 0, null);
    var _ = cljs.core.nth.call(null, vec__6934, 1, null);
    var e = vec__6934;
    if(cljs.core.isa_QMARK_.call(null, cljs.core.deref.call(null, hierarchy), dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3943__auto__ = be == null;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core.dominates.call(null, k, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -\x3e "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry));
      return cljs.core.second.call(null, best_entry)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._reset[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._reset["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._add_method[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._remove_method[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefer_method[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._get_method[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._get_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._methods[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._methods["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefers[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefers["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__3502__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._dispatch[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dispatch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, name, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn = cljs.core._get_method.call(null, mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.call(null, target_fn, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorStr = "cljs.core/MultiFn";
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, function(mf__$1) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.method_cache, function(mf__$1) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(mf__$1) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.cached_hierarchy, function(mf__$1) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, self__.cached_hierarchy), cljs.core.deref.call(null, self__.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__4090__auto__ = cljs.core.deref.call(null, self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var target_fn = temp__4090__auto__;
    return target_fn
  }else {
    var temp__4090__auto____$1 = cljs.core.find_and_cache_best_method.call(null, self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____$1)) {
      var target_fn = temp__4090__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref.call(null, self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  return cljs.core.do_dispatch.call(null, mf, self__.name, self__.dispatch_fn, args)
};
cljs.core.__GT_MultiFn = function __GT_MultiFn(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  return new cljs.core.MultiFn(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__6935__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch.call(null, self, args)
  };
  var G__6935 = function(_, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6935__delegate.call(this, _, args)
  };
  G__6935.cljs$lang$maxFixedArity = 1;
  G__6935.cljs$lang$applyTo = function(arglist__6936) {
    var _ = cljs.core.first(arglist__6936);
    var args = cljs.core.rest(arglist__6936);
    return G__6935__delegate(_, args)
  };
  G__6935.cljs$core$IFn$_invoke$arity$variadic = G__6935__delegate;
  return G__6935
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch.call(null, self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2153775104
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorStr = "cljs.core/UUID";
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__3443__auto__, writer__3444__auto__, opt__3445__auto__) {
  return cljs.core._write.call(null, writer__3444__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var and__3941__auto__ = other instanceof cljs.core.UUID;
  if(and__3941__auto__) {
    return self__.uuid === other.uuid
  }else {
    return and__3941__auto__
  }
};
cljs.core.__GT_UUID = function __GT_UUID(uuid) {
  return new cljs.core.UUID(uuid)
};
goog.provide("cljs.core.ExceptionInfo");
cljs.core.ExceptionInfo = function(message, data, cause) {
  this.message = message;
  this.data = data;
  this.cause = cause
};
cljs.core.ExceptionInfo.cljs$lang$type = true;
cljs.core.ExceptionInfo.cljs$lang$ctorStr = "cljs.core/ExceptionInfo";
cljs.core.ExceptionInfo.cljs$lang$ctorPrWriter = function(this__3446__auto__, writer__3447__auto__, opts__3448__auto__) {
  return cljs.core._write.call(null, writer__3447__auto__, "cljs.core/ExceptionInfo")
};
cljs.core.__GT_ExceptionInfo = function __GT_ExceptionInfo(message, data, cause) {
  return new cljs.core.ExceptionInfo(message, data, cause)
};
cljs.core.ExceptionInfo.prototype = new Error;
cljs.core.ExceptionInfo.prototype.constructor = cljs.core.ExceptionInfo;
cljs.core.ex_info = function() {
  var ex_info = null;
  var ex_info__2 = function(msg, map) {
    return new cljs.core.ExceptionInfo(msg, map, null)
  };
  var ex_info__3 = function(msg, map, cause) {
    return new cljs.core.ExceptionInfo(msg, map, cause)
  };
  ex_info = function(msg, map, cause) {
    switch(arguments.length) {
      case 2:
        return ex_info__2.call(this, msg, map);
      case 3:
        return ex_info__3.call(this, msg, map, cause)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ex_info.cljs$core$IFn$_invoke$arity$2 = ex_info__2;
  ex_info.cljs$core$IFn$_invoke$arity$3 = ex_info__3;
  return ex_info
}();
cljs.core.ex_data = function ex_data(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.data
  }else {
    return null
  }
};
cljs.core.ex_message = function ex_message(ex) {
  if(ex instanceof Error) {
    return ex.message
  }else {
    return null
  }
};
cljs.core.ex_cause = function ex_cause(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.cause
  }else {
    return null
  }
};
cljs.core.comparator = function comparator(pred) {
  return function(x, y) {
    if(cljs.core.truth_(pred.call(null, x, y))) {
      return-1
    }else {
      if(cljs.core.truth_(pred.call(null, y, x))) {
        return 1
      }else {
        if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
          return 0
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.special_symbol_QMARK_ = function special_symbol_QMARK_(x) {
  return cljs.core.contains_QMARK_.call(null, cljs.core.PersistentHashSet.fromArray([new cljs.core.Symbol(null, "deftype*", "deftype*", -978581244, null), null, new cljs.core.Symbol(null, "new", "new", -1640422567, null), null, new cljs.core.Symbol(null, "quote", "quote", -1532577739, null), null, new cljs.core.Symbol(null, "\x26", "\x26", -1640531489, null), null, new cljs.core.Symbol(null, "set!", "set!", -1637004872, null), null, new cljs.core.Symbol(null, "recur", "recur", -1532142362, null), 
  null, new cljs.core.Symbol(null, ".", ".", -1640531481, null), null, new cljs.core.Symbol(null, "ns", "ns", -1640528002, null), null, new cljs.core.Symbol(null, "do", "do", -1640528316, null), null, new cljs.core.Symbol(null, "fn*", "fn*", -1640430053, null), null, new cljs.core.Symbol(null, "throw", "throw", -1530191713, null), null, new cljs.core.Symbol(null, "letfn*", "letfn*", 1548249632, null), null, new cljs.core.Symbol(null, "js*", "js*", -1640426054, null), null, new cljs.core.Symbol(null, 
  "defrecord*", "defrecord*", 774272013, null), null, new cljs.core.Symbol(null, "let*", "let*", -1637213400, null), null, new cljs.core.Symbol(null, "loop*", "loop*", -1537374273, null), null, new cljs.core.Symbol(null, "try", "try", -1640416396, null), null, new cljs.core.Symbol(null, "if", "if", -1640528170, null), null, new cljs.core.Symbol(null, "def", "def", -1640432194, null), null], true), x)
};
goog.provide("flatride.utils");
goog.require("cljs.core");
flatride.utils.log = function log(stuff) {
  return console.log(stuff)
};
flatride.utils.slope_diff = function slope_diff(seq) {
  return(new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.last.call(null, seq)) - (new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.first.call(null, seq))
};
flatride.utils.toRad = function toRad(deg) {
  return deg * Math.PI / 180
};
flatride.utils.gps_distance = function gps_distance(from, to) {
  var R = 6371;
  var dLat = flatride.utils.toRad.call(null, (new cljs.core.Keyword(null, "lat", "lat", 1014011153)).call(null, to) - (new cljs.core.Keyword(null, "lat", "lat", 1014011153)).call(null, from));
  var dLon = flatride.utils.toRad.call(null, (new cljs.core.Keyword(null, "lng", "lng", 1014011543)).call(null, to) - (new cljs.core.Keyword(null, "lng", "lng", 1014011543)).call(null, from));
  var lat1 = flatride.utils.toRad.call(null, (new cljs.core.Keyword(null, "lat", "lat", 1014011153)).call(null, from));
  var lat2 = flatride.utils.toRad.call(null, (new cljs.core.Keyword(null, "lat", "lat", 1014011153)).call(null, to));
  var a = Math.sin.call(null, dLat / 2) * Math.sin.call(null, dLat / 2) + Math.sin.call(null, dLon / 2) * Math.sin.call(null, dLon / 2) * Math.cos.call(null, lat1) * Math.cos.call(null, lat2);
  var c = 2 * Math.atan2.call(null, Math.sqrt.call(null, a), Math.sqrt.call(null, 1 - a));
  return R * c
};
flatride.utils.slope_total_distance = function slope_total_distance(elev_objs) {
  if(cljs.core.count.call(null, elev_objs) <= 1) {
    return 0
  }else {
    return flatride.utils.gps_distance.call(null, (new cljs.core.Keyword(null, "coordinates", "coordinates", 2885823853)).call(null, cljs.core.first.call(null, elev_objs)), (new cljs.core.Keyword(null, "coordinates", "coordinates", 2885823853)).call(null, cljs.core.second.call(null, elev_objs))) + slope_total_distance.call(null, cljs.core.rest.call(null, elev_objs))
  }
};
flatride.utils.slope_percent = function slope_percent(elev_objs) {
  var rise = (new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.last.call(null, elev_objs)) - (new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.first.call(null, elev_objs));
  var run = 1E3 * flatride.utils.slope_total_distance.call(null, elev_objs);
  return 100 * (rise / run)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(typeof match === "string") {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$core$IFn$_invoke$arity$1 = join__1;
  join.cljs$core$IFn$_invoke$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.pop_last_while_empty = function pop_last_while_empty(v) {
  var v__$1 = v;
  while(true) {
    if(cljs.core._EQ_.call(null, "", cljs.core.peek.call(null, v__$1))) {
      var G__7324 = cljs.core.pop.call(null, v__$1);
      v__$1 = G__7324;
      continue
    }else {
      return v__$1
    }
    break
  }
};
clojure.string.discard_trailing_if_needed = function discard_trailing_if_needed(limit, v) {
  if(cljs.core._EQ_.call(null, 0, limit)) {
    return clojure.string.pop_last_while_empty.call(null, v)
  }else {
    return v
  }
};
clojure.string.split_with_empty_regex = function split_with_empty_regex(s, limit) {
  if(function() {
    var or__3943__auto__ = limit <= 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return limit >= 2 + cljs.core.count.call(null, s)
    }
  }()) {
    return cljs.core.conj.call(null, cljs.core.vec.call(null, cljs.core.cons.call(null, "", cljs.core.map.call(null, cljs.core.str, cljs.core.seq.call(null, s)))), "")
  }else {
    var pred__7328 = cljs.core._EQ_;
    var expr__7329 = limit;
    if(pred__7328.call(null, 1, expr__7329)) {
      return cljs.core.vector.call(null, s)
    }else {
      if(pred__7328.call(null, 2, expr__7329)) {
        return cljs.core.vector.call(null, "", s)
      }else {
        var c = limit - 2;
        return cljs.core.conj.call(null, cljs.core.vec.call(null, cljs.core.cons.call(null, "", cljs.core.subvec.call(null, cljs.core.vec.call(null, cljs.core.map.call(null, cljs.core.str, cljs.core.seq.call(null, s))), 0, c))), cljs.core.subs.call(null, s, c))
      }
    }
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return split.call(null, s, re, 0)
  };
  var split__3 = function(s, re, limit) {
    return clojure.string.discard_trailing_if_needed.call(null, limit, cljs.core._EQ_.call(null, [cljs.core.str(re)].join(""), "/(?:)/") ? clojure.string.split_with_empty_regex.call(null, s, limit) : limit < 1 ? cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re)) : function() {
      var s__$1 = s;
      var limit__$1 = limit;
      var parts = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__$1, 1)) {
          return cljs.core.conj.call(null, parts, s__$1)
        }else {
          var temp__4090__auto__ = cljs.core.re_find.call(null, re, s__$1);
          if(cljs.core.truth_(temp__4090__auto__)) {
            var m = temp__4090__auto__;
            var index = s__$1.indexOf(m);
            var G__7331 = s__$1.substring(index + cljs.core.count.call(null, m));
            var G__7332 = limit__$1 - 1;
            var G__7333 = cljs.core.conj.call(null, parts, s__$1.substring(0, index));
            s__$1 = G__7331;
            limit__$1 = G__7332;
            parts = G__7333;
            continue
          }else {
            return cljs.core.conj.call(null, parts, s__$1)
          }
        }
        break
      }
    }())
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  split.cljs$core$IFn$_invoke$arity$2 = split__2;
  split.cljs$core$IFn$_invoke$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index = s.length;
  while(true) {
    if(index === 0) {
      return""
    }else {
      var ch = cljs.core.get.call(null, s, index - 1);
      if(function() {
        var or__3943__auto__ = cljs.core._EQ_.call(null, ch, "\n");
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core._EQ_.call(null, ch, "\r")
        }
      }()) {
        var G__7334 = index - 1;
        index = G__7334;
        continue
      }else {
        return s.substring(0, index)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  return goog.string.isEmptySafe(s)
};
clojure.string.escape = function escape(s, cmap) {
  var buffer = new goog.string.StringBuffer;
  var length = s.length;
  var index = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length, index)) {
      return buffer.toString()
    }else {
      var ch = s.charAt(index);
      var temp__4090__auto___7335 = cljs.core.get.call(null, cmap, ch);
      if(cljs.core.truth_(temp__4090__auto___7335)) {
        var replacement_7336 = temp__4090__auto___7335;
        buffer.append([cljs.core.str(replacement_7336)].join(""))
      }else {
        buffer.append(ch)
      }
      var G__7337 = index + 1;
      index = G__7337;
      continue
    }
    break
  }
};
goog.provide("dommy.attrs");
goog.require("cljs.core");
goog.require("clojure.string");
goog.require("clojure.string");
dommy.attrs.class_match_QMARK_ = function class_match_QMARK_(class_name, class$, idx) {
  var and__3941__auto__ = function() {
    var or__3943__auto__ = idx === 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return" " === class_name.charAt(idx - 1)
    }
  }();
  if(cljs.core.truth_(and__3941__auto__)) {
    var total_len = class_name.length;
    var stop = idx + class$.length;
    if(stop <= total_len) {
      var or__3943__auto__ = stop === total_len;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return" " === class_name.charAt(stop)
      }
    }else {
      return null
    }
  }else {
    return and__3941__auto__
  }
};
dommy.attrs.class_index = function class_index(class_name, class$) {
  var start_from = 0;
  while(true) {
    var i = class_name.indexOf(class$, start_from);
    if(i >= 0) {
      if(dommy.attrs.class_match_QMARK_.call(null, class_name, class$, i)) {
        return i
      }else {
        var G__7491 = i + class$.length;
        start_from = G__7491;
        continue
      }
    }else {
      return null
    }
    break
  }
};
dommy.attrs.has_class_QMARK_ = function has_class_QMARK_(elem, class$) {
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  var class$__$1 = cljs.core.name.call(null, class$);
  var temp__4090__auto__ = elem__$1.classList;
  if(cljs.core.truth_(temp__4090__auto__)) {
    var class_list = temp__4090__auto__;
    return class_list.contains(class$__$1)
  }else {
    var temp__4092__auto__ = elem__$1.className;
    if(cljs.core.truth_(temp__4092__auto__)) {
      var class_name = temp__4092__auto__;
      var temp__4092__auto____$1 = dommy.attrs.class_index.call(null, class_name, class$__$1);
      if(cljs.core.truth_(temp__4092__auto____$1)) {
        var i = temp__4092__auto____$1;
        return i >= 0
      }else {
        return null
      }
    }else {
      return null
    }
  }
};
dommy.attrs.add_class_BANG_ = function() {
  var add_class_BANG_ = null;
  var add_class_BANG___2 = function(elem, classes) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    var classes__$1 = clojure.string.trim.call(null, cljs.core.name.call(null, classes));
    if(cljs.core.seq.call(null, classes__$1)) {
      var temp__4090__auto___7516 = elem__$1.classList;
      if(cljs.core.truth_(temp__4090__auto___7516)) {
        var class_list_7517 = temp__4090__auto___7516;
        var seq__7504_7518 = cljs.core.seq.call(null, classes__$1.split(/\s+/));
        var chunk__7505_7519 = null;
        var count__7506_7520 = 0;
        var i__7507_7521 = 0;
        while(true) {
          if(i__7507_7521 < count__7506_7520) {
            var class_7522 = cljs.core._nth.call(null, chunk__7505_7519, i__7507_7521);
            class_list_7517.add(class_7522);
            var G__7523 = seq__7504_7518;
            var G__7524 = chunk__7505_7519;
            var G__7525 = count__7506_7520;
            var G__7526 = i__7507_7521 + 1;
            seq__7504_7518 = G__7523;
            chunk__7505_7519 = G__7524;
            count__7506_7520 = G__7525;
            i__7507_7521 = G__7526;
            continue
          }else {
            var temp__4092__auto___7527 = cljs.core.seq.call(null, seq__7504_7518);
            if(temp__4092__auto___7527) {
              var seq__7504_7528__$1 = temp__4092__auto___7527;
              if(cljs.core.chunked_seq_QMARK_.call(null, seq__7504_7528__$1)) {
                var c__3615__auto___7529 = cljs.core.chunk_first.call(null, seq__7504_7528__$1);
                var G__7530 = cljs.core.chunk_rest.call(null, seq__7504_7528__$1);
                var G__7531 = c__3615__auto___7529;
                var G__7532 = cljs.core.count.call(null, c__3615__auto___7529);
                var G__7533 = 0;
                seq__7504_7518 = G__7530;
                chunk__7505_7519 = G__7531;
                count__7506_7520 = G__7532;
                i__7507_7521 = G__7533;
                continue
              }else {
                var class_7534 = cljs.core.first.call(null, seq__7504_7528__$1);
                class_list_7517.add(class_7534);
                var G__7535 = cljs.core.next.call(null, seq__7504_7528__$1);
                var G__7536 = null;
                var G__7537 = 0;
                var G__7538 = 0;
                seq__7504_7518 = G__7535;
                chunk__7505_7519 = G__7536;
                count__7506_7520 = G__7537;
                i__7507_7521 = G__7538;
                continue
              }
            }else {
            }
          }
          break
        }
      }else {
        var class_name_7539 = elem__$1.className;
        var seq__7508_7540 = cljs.core.seq.call(null, classes__$1.split(/\s+/));
        var chunk__7509_7541 = null;
        var count__7510_7542 = 0;
        var i__7511_7543 = 0;
        while(true) {
          if(i__7511_7543 < count__7510_7542) {
            var class_7544 = cljs.core._nth.call(null, chunk__7509_7541, i__7511_7543);
            if(cljs.core.truth_(dommy.attrs.class_index.call(null, class_name_7539, class_7544))) {
            }else {
              elem__$1.className = class_name_7539 === "" ? class_7544 : [cljs.core.str(class_name_7539), cljs.core.str(" "), cljs.core.str(class_7544)].join("")
            }
            var G__7545 = seq__7508_7540;
            var G__7546 = chunk__7509_7541;
            var G__7547 = count__7510_7542;
            var G__7548 = i__7511_7543 + 1;
            seq__7508_7540 = G__7545;
            chunk__7509_7541 = G__7546;
            count__7510_7542 = G__7547;
            i__7511_7543 = G__7548;
            continue
          }else {
            var temp__4092__auto___7549 = cljs.core.seq.call(null, seq__7508_7540);
            if(temp__4092__auto___7549) {
              var seq__7508_7550__$1 = temp__4092__auto___7549;
              if(cljs.core.chunked_seq_QMARK_.call(null, seq__7508_7550__$1)) {
                var c__3615__auto___7551 = cljs.core.chunk_first.call(null, seq__7508_7550__$1);
                var G__7552 = cljs.core.chunk_rest.call(null, seq__7508_7550__$1);
                var G__7553 = c__3615__auto___7551;
                var G__7554 = cljs.core.count.call(null, c__3615__auto___7551);
                var G__7555 = 0;
                seq__7508_7540 = G__7552;
                chunk__7509_7541 = G__7553;
                count__7510_7542 = G__7554;
                i__7511_7543 = G__7555;
                continue
              }else {
                var class_7556 = cljs.core.first.call(null, seq__7508_7550__$1);
                if(cljs.core.truth_(dommy.attrs.class_index.call(null, class_name_7539, class_7556))) {
                }else {
                  elem__$1.className = class_name_7539 === "" ? class_7556 : [cljs.core.str(class_name_7539), cljs.core.str(" "), cljs.core.str(class_7556)].join("")
                }
                var G__7557 = cljs.core.next.call(null, seq__7508_7550__$1);
                var G__7558 = null;
                var G__7559 = 0;
                var G__7560 = 0;
                seq__7508_7540 = G__7557;
                chunk__7509_7541 = G__7558;
                count__7510_7542 = G__7559;
                i__7511_7543 = G__7560;
                continue
              }
            }else {
            }
          }
          break
        }
      }
    }else {
    }
    return elem__$1
  };
  var add_class_BANG___3 = function() {
    var G__7561__delegate = function(elem, classes, more_classes) {
      var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
      var seq__7512_7562 = cljs.core.seq.call(null, cljs.core.conj.call(null, more_classes, classes));
      var chunk__7513_7563 = null;
      var count__7514_7564 = 0;
      var i__7515_7565 = 0;
      while(true) {
        if(i__7515_7565 < count__7514_7564) {
          var c_7566 = cljs.core._nth.call(null, chunk__7513_7563, i__7515_7565);
          add_class_BANG_.call(null, elem__$1, c_7566);
          var G__7567 = seq__7512_7562;
          var G__7568 = chunk__7513_7563;
          var G__7569 = count__7514_7564;
          var G__7570 = i__7515_7565 + 1;
          seq__7512_7562 = G__7567;
          chunk__7513_7563 = G__7568;
          count__7514_7564 = G__7569;
          i__7515_7565 = G__7570;
          continue
        }else {
          var temp__4092__auto___7571 = cljs.core.seq.call(null, seq__7512_7562);
          if(temp__4092__auto___7571) {
            var seq__7512_7572__$1 = temp__4092__auto___7571;
            if(cljs.core.chunked_seq_QMARK_.call(null, seq__7512_7572__$1)) {
              var c__3615__auto___7573 = cljs.core.chunk_first.call(null, seq__7512_7572__$1);
              var G__7574 = cljs.core.chunk_rest.call(null, seq__7512_7572__$1);
              var G__7575 = c__3615__auto___7573;
              var G__7576 = cljs.core.count.call(null, c__3615__auto___7573);
              var G__7577 = 0;
              seq__7512_7562 = G__7574;
              chunk__7513_7563 = G__7575;
              count__7514_7564 = G__7576;
              i__7515_7565 = G__7577;
              continue
            }else {
              var c_7578 = cljs.core.first.call(null, seq__7512_7572__$1);
              add_class_BANG_.call(null, elem__$1, c_7578);
              var G__7579 = cljs.core.next.call(null, seq__7512_7572__$1);
              var G__7580 = null;
              var G__7581 = 0;
              var G__7582 = 0;
              seq__7512_7562 = G__7579;
              chunk__7513_7563 = G__7580;
              count__7514_7564 = G__7581;
              i__7515_7565 = G__7582;
              continue
            }
          }else {
          }
        }
        break
      }
      return elem__$1
    };
    var G__7561 = function(elem, classes, var_args) {
      var more_classes = null;
      if(arguments.length > 2) {
        more_classes = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7561__delegate.call(this, elem, classes, more_classes)
    };
    G__7561.cljs$lang$maxFixedArity = 2;
    G__7561.cljs$lang$applyTo = function(arglist__7583) {
      var elem = cljs.core.first(arglist__7583);
      arglist__7583 = cljs.core.next(arglist__7583);
      var classes = cljs.core.first(arglist__7583);
      var more_classes = cljs.core.rest(arglist__7583);
      return G__7561__delegate(elem, classes, more_classes)
    };
    G__7561.cljs$core$IFn$_invoke$arity$variadic = G__7561__delegate;
    return G__7561
  }();
  add_class_BANG_ = function(elem, classes, var_args) {
    var more_classes = var_args;
    switch(arguments.length) {
      case 2:
        return add_class_BANG___2.call(this, elem, classes);
      default:
        return add_class_BANG___3.cljs$core$IFn$_invoke$arity$variadic(elem, classes, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  add_class_BANG_.cljs$lang$maxFixedArity = 2;
  add_class_BANG_.cljs$lang$applyTo = add_class_BANG___3.cljs$lang$applyTo;
  add_class_BANG_.cljs$core$IFn$_invoke$arity$2 = add_class_BANG___2;
  add_class_BANG_.cljs$core$IFn$_invoke$arity$variadic = add_class_BANG___3.cljs$core$IFn$_invoke$arity$variadic;
  return add_class_BANG_
}();
dommy.attrs.remove_class_str = function remove_class_str(init_class_name, class$) {
  var class_name = init_class_name;
  while(true) {
    var class_len = class_name.length;
    var temp__4090__auto__ = dommy.attrs.class_index.call(null, class_name, class$);
    if(cljs.core.truth_(temp__4090__auto__)) {
      var i = temp__4090__auto__;
      var G__7584 = function() {
        var end = i + class$.length;
        return[cljs.core.str(end < class_len ? [cljs.core.str(class_name.substring(0, i)), cljs.core.str(class_name.substr(end + 1))].join("") : class_name.substring(0, i - 1))].join("")
      }();
      class_name = G__7584;
      continue
    }else {
      return class_name
    }
    break
  }
};
dommy.attrs.remove_class_BANG_ = function() {
  var remove_class_BANG_ = null;
  var remove_class_BANG___2 = function(elem, class$) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    var class$__$1 = cljs.core.name.call(null, class$);
    var temp__4090__auto___7593 = elem__$1.classList;
    if(cljs.core.truth_(temp__4090__auto___7593)) {
      var class_list_7594 = temp__4090__auto___7593;
      class_list_7594.remove(class$__$1)
    }else {
      var class_name_7595 = elem__$1.className;
      var new_class_name_7596 = dommy.attrs.remove_class_str.call(null, class_name_7595, class$__$1);
      if(class_name_7595 === new_class_name_7596) {
      }else {
        elem__$1.className = new_class_name_7596
      }
    }
    return elem__$1
  };
  var remove_class_BANG___3 = function() {
    var G__7597__delegate = function(elem, class$, classes) {
      var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
      var seq__7589 = cljs.core.seq.call(null, cljs.core.conj.call(null, classes, class$));
      var chunk__7590 = null;
      var count__7591 = 0;
      var i__7592 = 0;
      while(true) {
        if(i__7592 < count__7591) {
          var c = cljs.core._nth.call(null, chunk__7590, i__7592);
          remove_class_BANG_.call(null, elem__$1, c);
          var G__7598 = seq__7589;
          var G__7599 = chunk__7590;
          var G__7600 = count__7591;
          var G__7601 = i__7592 + 1;
          seq__7589 = G__7598;
          chunk__7590 = G__7599;
          count__7591 = G__7600;
          i__7592 = G__7601;
          continue
        }else {
          var temp__4092__auto__ = cljs.core.seq.call(null, seq__7589);
          if(temp__4092__auto__) {
            var seq__7589__$1 = temp__4092__auto__;
            if(cljs.core.chunked_seq_QMARK_.call(null, seq__7589__$1)) {
              var c__3615__auto__ = cljs.core.chunk_first.call(null, seq__7589__$1);
              var G__7602 = cljs.core.chunk_rest.call(null, seq__7589__$1);
              var G__7603 = c__3615__auto__;
              var G__7604 = cljs.core.count.call(null, c__3615__auto__);
              var G__7605 = 0;
              seq__7589 = G__7602;
              chunk__7590 = G__7603;
              count__7591 = G__7604;
              i__7592 = G__7605;
              continue
            }else {
              var c = cljs.core.first.call(null, seq__7589__$1);
              remove_class_BANG_.call(null, elem__$1, c);
              var G__7606 = cljs.core.next.call(null, seq__7589__$1);
              var G__7607 = null;
              var G__7608 = 0;
              var G__7609 = 0;
              seq__7589 = G__7606;
              chunk__7590 = G__7607;
              count__7591 = G__7608;
              i__7592 = G__7609;
              continue
            }
          }else {
            return null
          }
        }
        break
      }
    };
    var G__7597 = function(elem, class$, var_args) {
      var classes = null;
      if(arguments.length > 2) {
        classes = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7597__delegate.call(this, elem, class$, classes)
    };
    G__7597.cljs$lang$maxFixedArity = 2;
    G__7597.cljs$lang$applyTo = function(arglist__7610) {
      var elem = cljs.core.first(arglist__7610);
      arglist__7610 = cljs.core.next(arglist__7610);
      var class$ = cljs.core.first(arglist__7610);
      var classes = cljs.core.rest(arglist__7610);
      return G__7597__delegate(elem, class$, classes)
    };
    G__7597.cljs$core$IFn$_invoke$arity$variadic = G__7597__delegate;
    return G__7597
  }();
  remove_class_BANG_ = function(elem, class$, var_args) {
    var classes = var_args;
    switch(arguments.length) {
      case 2:
        return remove_class_BANG___2.call(this, elem, class$);
      default:
        return remove_class_BANG___3.cljs$core$IFn$_invoke$arity$variadic(elem, class$, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  remove_class_BANG_.cljs$lang$maxFixedArity = 2;
  remove_class_BANG_.cljs$lang$applyTo = remove_class_BANG___3.cljs$lang$applyTo;
  remove_class_BANG_.cljs$core$IFn$_invoke$arity$2 = remove_class_BANG___2;
  remove_class_BANG_.cljs$core$IFn$_invoke$arity$variadic = remove_class_BANG___3.cljs$core$IFn$_invoke$arity$variadic;
  return remove_class_BANG_
}();
dommy.attrs.toggle_class_BANG_ = function() {
  var toggle_class_BANG_ = null;
  var toggle_class_BANG___2 = function(elem, class$) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    var temp__4090__auto___7611 = elem__$1.classList;
    if(cljs.core.truth_(temp__4090__auto___7611)) {
      var class_list_7612 = temp__4090__auto___7611;
      class_list_7612.toggle(class$)
    }else {
      toggle_class_BANG_.call(null, elem__$1, class$, !dommy.attrs.has_class_QMARK_.call(null, elem__$1, class$))
    }
    return elem__$1
  };
  var toggle_class_BANG___3 = function(elem, class$, add_QMARK_) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    if(add_QMARK_) {
      dommy.attrs.add_class_BANG_.call(null, elem__$1, class$)
    }else {
      dommy.attrs.remove_class_BANG_.call(null, elem__$1, class$)
    }
    return elem__$1
  };
  toggle_class_BANG_ = function(elem, class$, add_QMARK_) {
    switch(arguments.length) {
      case 2:
        return toggle_class_BANG___2.call(this, elem, class$);
      case 3:
        return toggle_class_BANG___3.call(this, elem, class$, add_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  toggle_class_BANG_.cljs$core$IFn$_invoke$arity$2 = toggle_class_BANG___2;
  toggle_class_BANG_.cljs$core$IFn$_invoke$arity$3 = toggle_class_BANG___3;
  return toggle_class_BANG_
}();
dommy.attrs.style_str = function style_str(x) {
  if(typeof x === "string") {
    return x
  }else {
    return clojure.string.join.call(null, " ", cljs.core.map.call(null, function(p__7615) {
      var vec__7616 = p__7615;
      var k = cljs.core.nth.call(null, vec__7616, 0, null);
      var v = cljs.core.nth.call(null, vec__7616, 1, null);
      return[cljs.core.str(cljs.core.name.call(null, k)), cljs.core.str(":"), cljs.core.str(cljs.core.name.call(null, v)), cljs.core.str(";")].join("")
    }, x))
  }
};
dommy.attrs.set_style_BANG_ = function() {
  var set_style_BANG___delegate = function(elem, kvs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "even?", "even?", -1543640034, null), cljs.core.list(new cljs.core.Symbol(null, "count", "count", -1545680184, null), new cljs.core.Symbol(null, "kvs", "kvs", -1640424927, null)))))].join(""));
    }
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    var style = elem__$1.style;
    var seq__7623_7629 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, kvs));
    var chunk__7624_7630 = null;
    var count__7625_7631 = 0;
    var i__7626_7632 = 0;
    while(true) {
      if(i__7626_7632 < count__7625_7631) {
        var vec__7627_7633 = cljs.core._nth.call(null, chunk__7624_7630, i__7626_7632);
        var k_7634 = cljs.core.nth.call(null, vec__7627_7633, 0, null);
        var v_7635 = cljs.core.nth.call(null, vec__7627_7633, 1, null);
        style[cljs.core.name.call(null, k_7634)] = v_7635;
        var G__7636 = seq__7623_7629;
        var G__7637 = chunk__7624_7630;
        var G__7638 = count__7625_7631;
        var G__7639 = i__7626_7632 + 1;
        seq__7623_7629 = G__7636;
        chunk__7624_7630 = G__7637;
        count__7625_7631 = G__7638;
        i__7626_7632 = G__7639;
        continue
      }else {
        var temp__4092__auto___7640 = cljs.core.seq.call(null, seq__7623_7629);
        if(temp__4092__auto___7640) {
          var seq__7623_7641__$1 = temp__4092__auto___7640;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7623_7641__$1)) {
            var c__3615__auto___7642 = cljs.core.chunk_first.call(null, seq__7623_7641__$1);
            var G__7643 = cljs.core.chunk_rest.call(null, seq__7623_7641__$1);
            var G__7644 = c__3615__auto___7642;
            var G__7645 = cljs.core.count.call(null, c__3615__auto___7642);
            var G__7646 = 0;
            seq__7623_7629 = G__7643;
            chunk__7624_7630 = G__7644;
            count__7625_7631 = G__7645;
            i__7626_7632 = G__7646;
            continue
          }else {
            var vec__7628_7647 = cljs.core.first.call(null, seq__7623_7641__$1);
            var k_7648 = cljs.core.nth.call(null, vec__7628_7647, 0, null);
            var v_7649 = cljs.core.nth.call(null, vec__7628_7647, 1, null);
            style[cljs.core.name.call(null, k_7648)] = v_7649;
            var G__7650 = cljs.core.next.call(null, seq__7623_7641__$1);
            var G__7651 = null;
            var G__7652 = 0;
            var G__7653 = 0;
            seq__7623_7629 = G__7650;
            chunk__7624_7630 = G__7651;
            count__7625_7631 = G__7652;
            i__7626_7632 = G__7653;
            continue
          }
        }else {
        }
      }
      break
    }
    return elem__$1
  };
  var set_style_BANG_ = function(elem, var_args) {
    var kvs = null;
    if(arguments.length > 1) {
      kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return set_style_BANG___delegate.call(this, elem, kvs)
  };
  set_style_BANG_.cljs$lang$maxFixedArity = 1;
  set_style_BANG_.cljs$lang$applyTo = function(arglist__7654) {
    var elem = cljs.core.first(arglist__7654);
    var kvs = cljs.core.rest(arglist__7654);
    return set_style_BANG___delegate(elem, kvs)
  };
  set_style_BANG_.cljs$core$IFn$_invoke$arity$variadic = set_style_BANG___delegate;
  return set_style_BANG_
}();
dommy.attrs.style = function style(elem, k) {
  if(cljs.core.truth_(k)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, new cljs.core.Symbol(null, "k", "k", -1640531420, null)))].join(""));
  }
  return window.getComputedStyle(dommy.template.__GT_node_like.call(null, elem))[cljs.core.name.call(null, k)]
};
dommy.attrs.set_px_BANG_ = function() {
  var set_px_BANG___delegate = function(elem, kvs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "even?", "even?", -1543640034, null), cljs.core.list(new cljs.core.Symbol(null, "count", "count", -1545680184, null), new cljs.core.Symbol(null, "kvs", "kvs", -1640424927, null)))))].join(""));
    }
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    var seq__7661_7667 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, kvs));
    var chunk__7662_7668 = null;
    var count__7663_7669 = 0;
    var i__7664_7670 = 0;
    while(true) {
      if(i__7664_7670 < count__7663_7669) {
        var vec__7665_7671 = cljs.core._nth.call(null, chunk__7662_7668, i__7664_7670);
        var k_7672 = cljs.core.nth.call(null, vec__7665_7671, 0, null);
        var v_7673 = cljs.core.nth.call(null, vec__7665_7671, 1, null);
        dommy.attrs.set_style_BANG_.call(null, elem__$1, k_7672, [cljs.core.str(v_7673), cljs.core.str("px")].join(""));
        var G__7674 = seq__7661_7667;
        var G__7675 = chunk__7662_7668;
        var G__7676 = count__7663_7669;
        var G__7677 = i__7664_7670 + 1;
        seq__7661_7667 = G__7674;
        chunk__7662_7668 = G__7675;
        count__7663_7669 = G__7676;
        i__7664_7670 = G__7677;
        continue
      }else {
        var temp__4092__auto___7678 = cljs.core.seq.call(null, seq__7661_7667);
        if(temp__4092__auto___7678) {
          var seq__7661_7679__$1 = temp__4092__auto___7678;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7661_7679__$1)) {
            var c__3615__auto___7680 = cljs.core.chunk_first.call(null, seq__7661_7679__$1);
            var G__7681 = cljs.core.chunk_rest.call(null, seq__7661_7679__$1);
            var G__7682 = c__3615__auto___7680;
            var G__7683 = cljs.core.count.call(null, c__3615__auto___7680);
            var G__7684 = 0;
            seq__7661_7667 = G__7681;
            chunk__7662_7668 = G__7682;
            count__7663_7669 = G__7683;
            i__7664_7670 = G__7684;
            continue
          }else {
            var vec__7666_7685 = cljs.core.first.call(null, seq__7661_7679__$1);
            var k_7686 = cljs.core.nth.call(null, vec__7666_7685, 0, null);
            var v_7687 = cljs.core.nth.call(null, vec__7666_7685, 1, null);
            dommy.attrs.set_style_BANG_.call(null, elem__$1, k_7686, [cljs.core.str(v_7687), cljs.core.str("px")].join(""));
            var G__7688 = cljs.core.next.call(null, seq__7661_7679__$1);
            var G__7689 = null;
            var G__7690 = 0;
            var G__7691 = 0;
            seq__7661_7667 = G__7688;
            chunk__7662_7668 = G__7689;
            count__7663_7669 = G__7690;
            i__7664_7670 = G__7691;
            continue
          }
        }else {
        }
      }
      break
    }
    return elem__$1
  };
  var set_px_BANG_ = function(elem, var_args) {
    var kvs = null;
    if(arguments.length > 1) {
      kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return set_px_BANG___delegate.call(this, elem, kvs)
  };
  set_px_BANG_.cljs$lang$maxFixedArity = 1;
  set_px_BANG_.cljs$lang$applyTo = function(arglist__7692) {
    var elem = cljs.core.first(arglist__7692);
    var kvs = cljs.core.rest(arglist__7692);
    return set_px_BANG___delegate(elem, kvs)
  };
  set_px_BANG_.cljs$core$IFn$_invoke$arity$variadic = set_px_BANG___delegate;
  return set_px_BANG_
}();
dommy.attrs.px = function px(elem, k) {
  var pixels = dommy.attrs.style.call(null, dommy.template.__GT_node_like.call(null, elem), k);
  if(cljs.core.seq.call(null, pixels)) {
    return parseInt(pixels)
  }else {
    return null
  }
};
dommy.attrs.set_attr_BANG_ = function() {
  var set_attr_BANG_ = null;
  var set_attr_BANG___2 = function(elem, k) {
    return set_attr_BANG_.call(null, dommy.template.__GT_node_like.call(null, elem), k, "true")
  };
  var set_attr_BANG___3 = function(elem, k, v) {
    if(cljs.core.truth_(v)) {
      if(cljs.core.fn_QMARK_.call(null, v)) {
        var G__7701 = dommy.template.__GT_node_like.call(null, elem);
        G__7701[cljs.core.name.call(null, k)] = v;
        return G__7701
      }else {
        var G__7702 = dommy.template.__GT_node_like.call(null, elem);
        G__7702.setAttribute(cljs.core.name.call(null, k), k === new cljs.core.Keyword(null, "style", "style", 1123684643) ? dommy.attrs.style_str.call(null, v) : v);
        return G__7702
      }
    }else {
      return null
    }
  };
  var set_attr_BANG___4 = function() {
    var G__7709__delegate = function(elem, k, v, kvs) {
      if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, kvs))) {
      }else {
        throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "even?", "even?", -1543640034, null), cljs.core.list(new cljs.core.Symbol(null, "count", "count", -1545680184, null), new cljs.core.Symbol(null, "kvs", "kvs", -1640424927, null)))))].join(""));
      }
      var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
      var seq__7703_7710 = cljs.core.seq.call(null, cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([k, v], true), cljs.core.partition.call(null, 2, kvs)));
      var chunk__7704_7711 = null;
      var count__7705_7712 = 0;
      var i__7706_7713 = 0;
      while(true) {
        if(i__7706_7713 < count__7705_7712) {
          var vec__7707_7714 = cljs.core._nth.call(null, chunk__7704_7711, i__7706_7713);
          var k_7715__$1 = cljs.core.nth.call(null, vec__7707_7714, 0, null);
          var v_7716__$1 = cljs.core.nth.call(null, vec__7707_7714, 1, null);
          set_attr_BANG_.call(null, elem__$1, k_7715__$1, v_7716__$1);
          var G__7717 = seq__7703_7710;
          var G__7718 = chunk__7704_7711;
          var G__7719 = count__7705_7712;
          var G__7720 = i__7706_7713 + 1;
          seq__7703_7710 = G__7717;
          chunk__7704_7711 = G__7718;
          count__7705_7712 = G__7719;
          i__7706_7713 = G__7720;
          continue
        }else {
          var temp__4092__auto___7721 = cljs.core.seq.call(null, seq__7703_7710);
          if(temp__4092__auto___7721) {
            var seq__7703_7722__$1 = temp__4092__auto___7721;
            if(cljs.core.chunked_seq_QMARK_.call(null, seq__7703_7722__$1)) {
              var c__3615__auto___7723 = cljs.core.chunk_first.call(null, seq__7703_7722__$1);
              var G__7724 = cljs.core.chunk_rest.call(null, seq__7703_7722__$1);
              var G__7725 = c__3615__auto___7723;
              var G__7726 = cljs.core.count.call(null, c__3615__auto___7723);
              var G__7727 = 0;
              seq__7703_7710 = G__7724;
              chunk__7704_7711 = G__7725;
              count__7705_7712 = G__7726;
              i__7706_7713 = G__7727;
              continue
            }else {
              var vec__7708_7728 = cljs.core.first.call(null, seq__7703_7722__$1);
              var k_7729__$1 = cljs.core.nth.call(null, vec__7708_7728, 0, null);
              var v_7730__$1 = cljs.core.nth.call(null, vec__7708_7728, 1, null);
              set_attr_BANG_.call(null, elem__$1, k_7729__$1, v_7730__$1);
              var G__7731 = cljs.core.next.call(null, seq__7703_7722__$1);
              var G__7732 = null;
              var G__7733 = 0;
              var G__7734 = 0;
              seq__7703_7710 = G__7731;
              chunk__7704_7711 = G__7732;
              count__7705_7712 = G__7733;
              i__7706_7713 = G__7734;
              continue
            }
          }else {
          }
        }
        break
      }
      return elem__$1
    };
    var G__7709 = function(elem, k, v, var_args) {
      var kvs = null;
      if(arguments.length > 3) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7709__delegate.call(this, elem, k, v, kvs)
    };
    G__7709.cljs$lang$maxFixedArity = 3;
    G__7709.cljs$lang$applyTo = function(arglist__7735) {
      var elem = cljs.core.first(arglist__7735);
      arglist__7735 = cljs.core.next(arglist__7735);
      var k = cljs.core.first(arglist__7735);
      arglist__7735 = cljs.core.next(arglist__7735);
      var v = cljs.core.first(arglist__7735);
      var kvs = cljs.core.rest(arglist__7735);
      return G__7709__delegate(elem, k, v, kvs)
    };
    G__7709.cljs$core$IFn$_invoke$arity$variadic = G__7709__delegate;
    return G__7709
  }();
  set_attr_BANG_ = function(elem, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 2:
        return set_attr_BANG___2.call(this, elem, k);
      case 3:
        return set_attr_BANG___3.call(this, elem, k, v);
      default:
        return set_attr_BANG___4.cljs$core$IFn$_invoke$arity$variadic(elem, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  set_attr_BANG_.cljs$lang$maxFixedArity = 3;
  set_attr_BANG_.cljs$lang$applyTo = set_attr_BANG___4.cljs$lang$applyTo;
  set_attr_BANG_.cljs$core$IFn$_invoke$arity$2 = set_attr_BANG___2;
  set_attr_BANG_.cljs$core$IFn$_invoke$arity$3 = set_attr_BANG___3;
  set_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic = set_attr_BANG___4.cljs$core$IFn$_invoke$arity$variadic;
  return set_attr_BANG_
}();
dommy.attrs.remove_attr_BANG_ = function() {
  var remove_attr_BANG_ = null;
  var remove_attr_BANG___2 = function(elem, k) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([new cljs.core.Keyword(null, "class", "class", 1108647146), null, new cljs.core.Keyword(null, "classes", "classes", 1867525016), null], true).call(null, k))) {
      elem__$1.className = ""
    }else {
      elem__$1.removeAttribute(cljs.core.name.call(null, k))
    }
    return elem__$1
  };
  var remove_attr_BANG___3 = function() {
    var G__7744__delegate = function(elem, k, ks) {
      var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
      var seq__7740_7745 = cljs.core.seq.call(null, cljs.core.cons.call(null, k, ks));
      var chunk__7741_7746 = null;
      var count__7742_7747 = 0;
      var i__7743_7748 = 0;
      while(true) {
        if(i__7743_7748 < count__7742_7747) {
          var k_7749__$1 = cljs.core._nth.call(null, chunk__7741_7746, i__7743_7748);
          remove_attr_BANG_.call(null, elem__$1, k_7749__$1);
          var G__7750 = seq__7740_7745;
          var G__7751 = chunk__7741_7746;
          var G__7752 = count__7742_7747;
          var G__7753 = i__7743_7748 + 1;
          seq__7740_7745 = G__7750;
          chunk__7741_7746 = G__7751;
          count__7742_7747 = G__7752;
          i__7743_7748 = G__7753;
          continue
        }else {
          var temp__4092__auto___7754 = cljs.core.seq.call(null, seq__7740_7745);
          if(temp__4092__auto___7754) {
            var seq__7740_7755__$1 = temp__4092__auto___7754;
            if(cljs.core.chunked_seq_QMARK_.call(null, seq__7740_7755__$1)) {
              var c__3615__auto___7756 = cljs.core.chunk_first.call(null, seq__7740_7755__$1);
              var G__7757 = cljs.core.chunk_rest.call(null, seq__7740_7755__$1);
              var G__7758 = c__3615__auto___7756;
              var G__7759 = cljs.core.count.call(null, c__3615__auto___7756);
              var G__7760 = 0;
              seq__7740_7745 = G__7757;
              chunk__7741_7746 = G__7758;
              count__7742_7747 = G__7759;
              i__7743_7748 = G__7760;
              continue
            }else {
              var k_7761__$1 = cljs.core.first.call(null, seq__7740_7755__$1);
              remove_attr_BANG_.call(null, elem__$1, k_7761__$1);
              var G__7762 = cljs.core.next.call(null, seq__7740_7755__$1);
              var G__7763 = null;
              var G__7764 = 0;
              var G__7765 = 0;
              seq__7740_7745 = G__7762;
              chunk__7741_7746 = G__7763;
              count__7742_7747 = G__7764;
              i__7743_7748 = G__7765;
              continue
            }
          }else {
          }
        }
        break
      }
      return elem__$1
    };
    var G__7744 = function(elem, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7744__delegate.call(this, elem, k, ks)
    };
    G__7744.cljs$lang$maxFixedArity = 2;
    G__7744.cljs$lang$applyTo = function(arglist__7766) {
      var elem = cljs.core.first(arglist__7766);
      arglist__7766 = cljs.core.next(arglist__7766);
      var k = cljs.core.first(arglist__7766);
      var ks = cljs.core.rest(arglist__7766);
      return G__7744__delegate(elem, k, ks)
    };
    G__7744.cljs$core$IFn$_invoke$arity$variadic = G__7744__delegate;
    return G__7744
  }();
  remove_attr_BANG_ = function(elem, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 2:
        return remove_attr_BANG___2.call(this, elem, k);
      default:
        return remove_attr_BANG___3.cljs$core$IFn$_invoke$arity$variadic(elem, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  remove_attr_BANG_.cljs$lang$maxFixedArity = 2;
  remove_attr_BANG_.cljs$lang$applyTo = remove_attr_BANG___3.cljs$lang$applyTo;
  remove_attr_BANG_.cljs$core$IFn$_invoke$arity$2 = remove_attr_BANG___2;
  remove_attr_BANG_.cljs$core$IFn$_invoke$arity$variadic = remove_attr_BANG___3.cljs$core$IFn$_invoke$arity$variadic;
  return remove_attr_BANG_
}();
dommy.attrs.attr = function attr(elem, k) {
  if(cljs.core.truth_(k)) {
    return dommy.template.__GT_node_like.call(null, elem).getAttribute(cljs.core.name.call(null, k))
  }else {
    return null
  }
};
dommy.attrs.hidden_QMARK_ = function hidden_QMARK_(elem) {
  return"none" === dommy.template.__GT_node_like.call(null, elem).style.display
};
dommy.attrs.toggle_BANG_ = function() {
  var toggle_BANG_ = null;
  var toggle_BANG___1 = function(elem) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    toggle_BANG_.call(null, elem__$1, dommy.attrs.hidden_QMARK_.call(null, elem__$1));
    return elem__$1
  };
  var toggle_BANG___2 = function(elem, show_QMARK_) {
    var G__7768 = dommy.template.__GT_node_like.call(null, elem);
    G__7768.style.display = show_QMARK_ ? "" : "none";
    return G__7768
  };
  toggle_BANG_ = function(elem, show_QMARK_) {
    switch(arguments.length) {
      case 1:
        return toggle_BANG___1.call(this, elem);
      case 2:
        return toggle_BANG___2.call(this, elem, show_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  toggle_BANG_.cljs$core$IFn$_invoke$arity$1 = toggle_BANG___1;
  toggle_BANG_.cljs$core$IFn$_invoke$arity$2 = toggle_BANG___2;
  return toggle_BANG_
}();
dommy.attrs.hide_BANG_ = function hide_BANG_(elem) {
  var G__7770 = dommy.template.__GT_node_like.call(null, elem);
  dommy.attrs.toggle_BANG_.call(null, G__7770, false);
  return G__7770
};
dommy.attrs.show_BANG_ = function show_BANG_(elem) {
  var G__7772 = dommy.template.__GT_node_like.call(null, elem);
  dommy.attrs.toggle_BANG_.call(null, G__7772, true);
  return G__7772
};
dommy.attrs.bounding_client_rect = function bounding_client_rect(elem) {
  return cljs.core.js__GT_clj.call(null, function() {
    var G__7774 = dommy.template.__GT_node_like.call(null, elem).getBoundingClientRect();
    G__7774["constructor"] = Object;
    return G__7774
  }(), new cljs.core.Keyword(null, "keywordize-keys", "keywordize-keys", 4191781672), true)
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("dommy.template");
goog.require("cljs.core");
goog.require("dommy.attrs");
goog.require("dommy.attrs");
goog.require("clojure.string");
goog.require("clojure.string");
dommy.template.PElement = {};
dommy.template._elem = function _elem(this$) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.dommy$template$PElement$_elem$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.dommy$template$PElement$_elem$arity$1(this$)
  }else {
    var x__3502__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = dommy.template._elem[goog.typeOf(x__3502__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = dommy.template._elem["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "PElement.-elem", this$);
        }
      }
    }().call(null, this$)
  }
};
dommy.template.next_css_index = function next_css_index(s, start_idx) {
  var id_idx = s.indexOf("#", start_idx);
  var class_idx = s.indexOf(".", start_idx);
  var idx = Math.min(id_idx, class_idx);
  if(idx < 0) {
    return Math.max(id_idx, class_idx)
  }else {
    return idx
  }
};
dommy.template.base_element = function base_element(node_key) {
  var node_str = cljs.core.name.call(null, node_key);
  var base_idx = dommy.template.next_css_index.call(null, node_str, 0);
  var tag = base_idx > 0 ? node_str.substring(0, base_idx) : base_idx === 0 ? "div" : new cljs.core.Keyword(null, "else", "else", 1017020587) ? node_str : null;
  var node = document.createElement(tag);
  if(base_idx >= 0) {
    var str_7343 = node_str.substring(base_idx);
    while(true) {
      var next_idx_7344 = dommy.template.next_css_index.call(null, str_7343, 1);
      var frag_7345 = next_idx_7344 >= 0 ? str_7343.substring(0, next_idx_7344) : str_7343;
      var G__7342_7346 = frag_7345.charAt(0);
      if(cljs.core._EQ_.call(null, "#", G__7342_7346)) {
        node.setAttribute("id", frag_7345.substring(1))
      }else {
        if(cljs.core._EQ_.call(null, ".", G__7342_7346)) {
          dommy.attrs.add_class_BANG_.call(null, node, frag_7345.substring(1))
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(frag_7345.charAt(0))].join(""));
          }else {
          }
        }
      }
      if(next_idx_7344 >= 0) {
        var G__7347 = str_7343.substring(next_idx_7344);
        str_7343 = G__7347;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return node
};
dommy.template.throw_unable_to_make_node = function throw_unable_to_make_node(node_data) {
  throw[cljs.core.str("Don't know how to make node from: "), cljs.core.str(cljs.core.pr_str.call(null, node_data))].join("");
};
dommy.template.__GT_document_fragment = function() {
  var __GT_document_fragment = null;
  var __GT_document_fragment__1 = function(data) {
    return __GT_document_fragment.call(null, document.createDocumentFragment(), data)
  };
  var __GT_document_fragment__2 = function(result_frag, data) {
    if(function() {
      var G__7353 = data;
      if(G__7353) {
        if(cljs.core.truth_(function() {
          var or__3943__auto__ = null;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return G__7353.dommy$template$PElement$
          }
        }())) {
          return true
        }else {
          if(!G__7353.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7353)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7353)
      }
    }()) {
      result_frag.appendChild(dommy.template._elem.call(null, data));
      return result_frag
    }else {
      if(cljs.core.seq_QMARK_.call(null, data)) {
        var seq__7354_7358 = cljs.core.seq.call(null, data);
        var chunk__7355_7359 = null;
        var count__7356_7360 = 0;
        var i__7357_7361 = 0;
        while(true) {
          if(i__7357_7361 < count__7356_7360) {
            var child_7362 = cljs.core._nth.call(null, chunk__7355_7359, i__7357_7361);
            __GT_document_fragment.call(null, result_frag, child_7362);
            var G__7363 = seq__7354_7358;
            var G__7364 = chunk__7355_7359;
            var G__7365 = count__7356_7360;
            var G__7366 = i__7357_7361 + 1;
            seq__7354_7358 = G__7363;
            chunk__7355_7359 = G__7364;
            count__7356_7360 = G__7365;
            i__7357_7361 = G__7366;
            continue
          }else {
            var temp__4092__auto___7367 = cljs.core.seq.call(null, seq__7354_7358);
            if(temp__4092__auto___7367) {
              var seq__7354_7368__$1 = temp__4092__auto___7367;
              if(cljs.core.chunked_seq_QMARK_.call(null, seq__7354_7368__$1)) {
                var c__3615__auto___7369 = cljs.core.chunk_first.call(null, seq__7354_7368__$1);
                var G__7370 = cljs.core.chunk_rest.call(null, seq__7354_7368__$1);
                var G__7371 = c__3615__auto___7369;
                var G__7372 = cljs.core.count.call(null, c__3615__auto___7369);
                var G__7373 = 0;
                seq__7354_7358 = G__7370;
                chunk__7355_7359 = G__7371;
                count__7356_7360 = G__7372;
                i__7357_7361 = G__7373;
                continue
              }else {
                var child_7374 = cljs.core.first.call(null, seq__7354_7368__$1);
                __GT_document_fragment.call(null, result_frag, child_7374);
                var G__7375 = cljs.core.next.call(null, seq__7354_7368__$1);
                var G__7376 = null;
                var G__7377 = 0;
                var G__7378 = 0;
                seq__7354_7358 = G__7375;
                chunk__7355_7359 = G__7376;
                count__7356_7360 = G__7377;
                i__7357_7361 = G__7378;
                continue
              }
            }else {
            }
          }
          break
        }
        return result_frag
      }else {
        if(data == null) {
          return result_frag
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            return dommy.template.throw_unable_to_make_node.call(null, data)
          }else {
            return null
          }
        }
      }
    }
  };
  __GT_document_fragment = function(result_frag, data) {
    switch(arguments.length) {
      case 1:
        return __GT_document_fragment__1.call(this, result_frag);
      case 2:
        return __GT_document_fragment__2.call(this, result_frag, data)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  __GT_document_fragment.cljs$core$IFn$_invoke$arity$1 = __GT_document_fragment__1;
  __GT_document_fragment.cljs$core$IFn$_invoke$arity$2 = __GT_document_fragment__2;
  return __GT_document_fragment
}();
dommy.template.__GT_node_like = function __GT_node_like(data) {
  if(function() {
    var G__7380 = data;
    if(G__7380) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__7380.dommy$template$PElement$
        }
      }())) {
        return true
      }else {
        if(!G__7380.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7380)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7380)
    }
  }()) {
    return dommy.template._elem.call(null, data)
  }else {
    return dommy.template.__GT_document_fragment.call(null, data)
  }
};
dommy.template.compound_element = function compound_element(p__7381) {
  var vec__7400 = p__7381;
  var tag_name = cljs.core.nth.call(null, vec__7400, 0, null);
  var maybe_attrs = cljs.core.nth.call(null, vec__7400, 1, null);
  var children = cljs.core.nthnext.call(null, vec__7400, 2);
  var n = dommy.template.base_element.call(null, tag_name);
  var attrs = function() {
    var and__3941__auto__ = cljs.core.map_QMARK_.call(null, maybe_attrs);
    if(and__3941__auto__) {
      return!function() {
        var G__7401 = maybe_attrs;
        if(G__7401) {
          if(cljs.core.truth_(function() {
            var or__3943__auto__ = null;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return G__7401.dommy$template$PElement$
            }
          }())) {
            return true
          }else {
            if(!G__7401.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7401)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7401)
        }
      }()
    }else {
      return and__3941__auto__
    }
  }() ? maybe_attrs : null;
  var children__$1 = cljs.core.truth_(attrs) ? children : cljs.core.cons.call(null, maybe_attrs, children);
  var seq__7402_7418 = cljs.core.seq.call(null, attrs);
  var chunk__7403_7419 = null;
  var count__7404_7420 = 0;
  var i__7405_7421 = 0;
  while(true) {
    if(i__7405_7421 < count__7404_7420) {
      var vec__7406_7422 = cljs.core._nth.call(null, chunk__7403_7419, i__7405_7421);
      var k_7423 = cljs.core.nth.call(null, vec__7406_7422, 0, null);
      var v_7424 = cljs.core.nth.call(null, vec__7406_7422, 1, null);
      var G__7407_7425 = k_7423;
      if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "classes", "classes", 1867525016), G__7407_7425)) {
        var seq__7408_7426 = cljs.core.seq.call(null, v_7424);
        var chunk__7409_7427 = null;
        var count__7410_7428 = 0;
        var i__7411_7429 = 0;
        while(true) {
          if(i__7411_7429 < count__7410_7428) {
            var c_7430 = cljs.core._nth.call(null, chunk__7409_7427, i__7411_7429);
            dommy.attrs.add_class_BANG_.call(null, n, c_7430);
            var G__7431 = seq__7408_7426;
            var G__7432 = chunk__7409_7427;
            var G__7433 = count__7410_7428;
            var G__7434 = i__7411_7429 + 1;
            seq__7408_7426 = G__7431;
            chunk__7409_7427 = G__7432;
            count__7410_7428 = G__7433;
            i__7411_7429 = G__7434;
            continue
          }else {
            var temp__4092__auto___7435 = cljs.core.seq.call(null, seq__7408_7426);
            if(temp__4092__auto___7435) {
              var seq__7408_7436__$1 = temp__4092__auto___7435;
              if(cljs.core.chunked_seq_QMARK_.call(null, seq__7408_7436__$1)) {
                var c__3615__auto___7437 = cljs.core.chunk_first.call(null, seq__7408_7436__$1);
                var G__7438 = cljs.core.chunk_rest.call(null, seq__7408_7436__$1);
                var G__7439 = c__3615__auto___7437;
                var G__7440 = cljs.core.count.call(null, c__3615__auto___7437);
                var G__7441 = 0;
                seq__7408_7426 = G__7438;
                chunk__7409_7427 = G__7439;
                count__7410_7428 = G__7440;
                i__7411_7429 = G__7441;
                continue
              }else {
                var c_7442 = cljs.core.first.call(null, seq__7408_7436__$1);
                dommy.attrs.add_class_BANG_.call(null, n, c_7442);
                var G__7443 = cljs.core.next.call(null, seq__7408_7436__$1);
                var G__7444 = null;
                var G__7445 = 0;
                var G__7446 = 0;
                seq__7408_7426 = G__7443;
                chunk__7409_7427 = G__7444;
                count__7410_7428 = G__7445;
                i__7411_7429 = G__7446;
                continue
              }
            }else {
            }
          }
          break
        }
      }else {
        if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "class", "class", 1108647146), G__7407_7425)) {
          dommy.attrs.add_class_BANG_.call(null, n, v_7424)
        }else {
          if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
            dommy.attrs.set_attr_BANG_.call(null, n, k_7423, v_7424)
          }else {
          }
        }
      }
      var G__7447 = seq__7402_7418;
      var G__7448 = chunk__7403_7419;
      var G__7449 = count__7404_7420;
      var G__7450 = i__7405_7421 + 1;
      seq__7402_7418 = G__7447;
      chunk__7403_7419 = G__7448;
      count__7404_7420 = G__7449;
      i__7405_7421 = G__7450;
      continue
    }else {
      var temp__4092__auto___7451 = cljs.core.seq.call(null, seq__7402_7418);
      if(temp__4092__auto___7451) {
        var seq__7402_7452__$1 = temp__4092__auto___7451;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__7402_7452__$1)) {
          var c__3615__auto___7453 = cljs.core.chunk_first.call(null, seq__7402_7452__$1);
          var G__7454 = cljs.core.chunk_rest.call(null, seq__7402_7452__$1);
          var G__7455 = c__3615__auto___7453;
          var G__7456 = cljs.core.count.call(null, c__3615__auto___7453);
          var G__7457 = 0;
          seq__7402_7418 = G__7454;
          chunk__7403_7419 = G__7455;
          count__7404_7420 = G__7456;
          i__7405_7421 = G__7457;
          continue
        }else {
          var vec__7412_7458 = cljs.core.first.call(null, seq__7402_7452__$1);
          var k_7459 = cljs.core.nth.call(null, vec__7412_7458, 0, null);
          var v_7460 = cljs.core.nth.call(null, vec__7412_7458, 1, null);
          var G__7413_7461 = k_7459;
          if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "classes", "classes", 1867525016), G__7413_7461)) {
            var seq__7414_7462 = cljs.core.seq.call(null, v_7460);
            var chunk__7415_7463 = null;
            var count__7416_7464 = 0;
            var i__7417_7465 = 0;
            while(true) {
              if(i__7417_7465 < count__7416_7464) {
                var c_7466 = cljs.core._nth.call(null, chunk__7415_7463, i__7417_7465);
                dommy.attrs.add_class_BANG_.call(null, n, c_7466);
                var G__7467 = seq__7414_7462;
                var G__7468 = chunk__7415_7463;
                var G__7469 = count__7416_7464;
                var G__7470 = i__7417_7465 + 1;
                seq__7414_7462 = G__7467;
                chunk__7415_7463 = G__7468;
                count__7416_7464 = G__7469;
                i__7417_7465 = G__7470;
                continue
              }else {
                var temp__4092__auto___7471__$1 = cljs.core.seq.call(null, seq__7414_7462);
                if(temp__4092__auto___7471__$1) {
                  var seq__7414_7472__$1 = temp__4092__auto___7471__$1;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__7414_7472__$1)) {
                    var c__3615__auto___7473 = cljs.core.chunk_first.call(null, seq__7414_7472__$1);
                    var G__7474 = cljs.core.chunk_rest.call(null, seq__7414_7472__$1);
                    var G__7475 = c__3615__auto___7473;
                    var G__7476 = cljs.core.count.call(null, c__3615__auto___7473);
                    var G__7477 = 0;
                    seq__7414_7462 = G__7474;
                    chunk__7415_7463 = G__7475;
                    count__7416_7464 = G__7476;
                    i__7417_7465 = G__7477;
                    continue
                  }else {
                    var c_7478 = cljs.core.first.call(null, seq__7414_7472__$1);
                    dommy.attrs.add_class_BANG_.call(null, n, c_7478);
                    var G__7479 = cljs.core.next.call(null, seq__7414_7472__$1);
                    var G__7480 = null;
                    var G__7481 = 0;
                    var G__7482 = 0;
                    seq__7414_7462 = G__7479;
                    chunk__7415_7463 = G__7480;
                    count__7416_7464 = G__7481;
                    i__7417_7465 = G__7482;
                    continue
                  }
                }else {
                }
              }
              break
            }
          }else {
            if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "class", "class", 1108647146), G__7413_7461)) {
              dommy.attrs.add_class_BANG_.call(null, n, v_7460)
            }else {
              if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
                dommy.attrs.set_attr_BANG_.call(null, n, k_7459, v_7460)
              }else {
              }
            }
          }
          var G__7483 = cljs.core.next.call(null, seq__7402_7452__$1);
          var G__7484 = null;
          var G__7485 = 0;
          var G__7486 = 0;
          seq__7402_7418 = G__7483;
          chunk__7403_7419 = G__7484;
          count__7404_7420 = G__7485;
          i__7405_7421 = G__7486;
          continue
        }
      }else {
      }
    }
    break
  }
  n.appendChild(dommy.template.__GT_node_like.call(null, children__$1));
  return n
};
dommy.template.PElement["string"] = true;
dommy.template._elem["string"] = function(this$) {
  if(this$ instanceof cljs.core.Keyword) {
    return dommy.template.base_element.call(null, this$)
  }else {
    return document.createTextNode([cljs.core.str(this$)].join(""))
  }
};
dommy.template.PElement["number"] = true;
dommy.template._elem["number"] = function(this$) {
  return document.createTextNode([cljs.core.str(this$)].join(""))
};
cljs.core.PersistentVector.prototype.dommy$template$PElement$ = true;
cljs.core.PersistentVector.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return dommy.template.compound_element.call(null, this$)
};
Document.prototype.dommy$template$PElement$ = true;
Document.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
Text.prototype.dommy$template$PElement$ = true;
Text.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
DocumentFragment.prototype.dommy$template$PElement$ = true;
DocumentFragment.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
HTMLElement.prototype.dommy$template$PElement$ = true;
HTMLElement.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
  return this$
};
try {
  Window.prototype.dommy$template$PElement$ = true;
  Window.prototype.dommy$template$PElement$_elem$arity$1 = function(this$) {
    return this$
  }
}catch(e7487) {
  if(e7487 instanceof ReferenceError) {
    var __7488 = e7487;
    console.log("PElement: js/Window not defined by browser, skipping it... (running on phantomjs?)")
  }else {
    if(new cljs.core.Keyword(null, "else", "else", 1017020587)) {
      throw e7487;
    }else {
    }
  }
}
dommy.template.node = function node(data) {
  if(function() {
    var G__7490 = data;
    if(G__7490) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__7490.dommy$template$PElement$
        }
      }())) {
        return true
      }else {
        if(!G__7490.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7490)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, dommy.template.PElement, G__7490)
    }
  }()) {
    return dommy.template._elem.call(null, data)
  }else {
    return dommy.template.throw_unable_to_make_node.call(null, data)
  }
};
dommy.template.html__GT_nodes = function html__GT_nodes(html) {
  var parent = document.createElement("div");
  parent.insertAdjacentHTML("beforeend", html);
  return cljs.core.seq.call(null, Array.prototype.slice.call(parent.childNodes))
};
goog.provide("dommy.utils");
goog.require("cljs.core");
dommy.utils.dissoc_in = function dissoc_in(m, p__7338) {
  var vec__7340 = p__7338;
  var k = cljs.core.nth.call(null, vec__7340, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__7340, 1);
  if(cljs.core.truth_(m)) {
    var temp__4090__auto__ = function() {
      var and__3941__auto__ = ks;
      if(cljs.core.truth_(and__3941__auto__)) {
        return dissoc_in.call(null, m.call(null, k), ks)
      }else {
        return and__3941__auto__
      }
    }();
    if(cljs.core.truth_(temp__4090__auto__)) {
      var res = temp__4090__auto__;
      return cljs.core.assoc.call(null, m, k, res)
    }else {
      var res = cljs.core.dissoc.call(null, m, k);
      if(cljs.core.empty_QMARK_.call(null, res)) {
        return null
      }else {
        return res
      }
    }
  }else {
    return null
  }
};
dommy.utils.__GT_Array = function __GT_Array(array_like) {
  return Array.prototype.slice.call(array_like)
};
goog.provide("dommy.core");
goog.require("cljs.core");
goog.require("dommy.template");
goog.require("dommy.template");
goog.require("dommy.attrs");
goog.require("dommy.attrs");
goog.require("dommy.utils");
goog.require("dommy.utils");
goog.require("clojure.string");
goog.require("clojure.string");
dommy.core.has_class_QMARK_ = dommy.attrs.has_class_QMARK_;
dommy.core.add_class_BANG_ = dommy.attrs.add_class_BANG_;
dommy.core.remove_class_BANG_ = dommy.attrs.remove_class_BANG_;
dommy.core.toggle_class_BANG_ = dommy.attrs.toggle_class_BANG_;
dommy.core.set_attr_BANG_ = dommy.attrs.set_attr_BANG_;
dommy.core.set_style_BANG_ = dommy.attrs.set_style_BANG_;
dommy.core.set_px_BANG_ = dommy.attrs.set_px_BANG_;
dommy.core.px = dommy.attrs.px;
dommy.core.style_str = dommy.attrs.style_str;
dommy.core.style = dommy.attrs.style;
dommy.core.remove_attr_BANG_ = dommy.attrs.remove_attr_BANG_;
dommy.core.attr = dommy.attrs.attr;
dommy.core.hidden_QMARK_ = dommy.attrs.hidden_QMARK_;
dommy.core.toggle_BANG_ = dommy.attrs.toggle_BANG_;
dommy.core.hide_BANG_ = dommy.attrs.hide_BANG_;
dommy.core.show_BANG_ = dommy.attrs.show_BANG_;
dommy.core.bounding_client_rect = dommy.attrs.bounding_client_rect;
dommy.core.dissoc_in = dommy.utils.dissoc_in;
dommy.core.__GT_Array = dommy.utils.__GT_Array;
dommy.core.set_html_BANG_ = function set_html_BANG_(elem, html) {
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  elem__$1.innerHTML = html;
  return elem__$1
};
dommy.core.html = function html(elem) {
  return dommy.template.__GT_node_like.call(null, elem).innerHTML
};
dommy.core.set_text_BANG_ = function set_text_BANG_(elem, text) {
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  var prop = cljs.core.truth_(elem__$1.textContent) ? "textContent" : "innerText";
  elem__$1[prop] = text;
  return elem__$1
};
dommy.core.text = function text(elem) {
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  var or__3943__auto__ = elem__$1.textContent;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return elem__$1.innerText
  }
};
dommy.core.value = function value(elem) {
  return dommy.template.__GT_node_like.call(null, elem).value
};
dommy.core.set_value_BANG_ = function set_value_BANG_(elem, value) {
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  elem__$1.value = value;
  return elem__$1
};
dommy.core.append_BANG_ = function() {
  var append_BANG_ = null;
  var append_BANG___2 = function(parent, child) {
    var G__6942 = dommy.template.__GT_node_like.call(null, parent);
    G__6942.appendChild(dommy.template.__GT_node_like.call(null, child));
    return G__6942
  };
  var append_BANG___3 = function() {
    var G__6947__delegate = function(parent, child, more_children) {
      var parent__$1 = dommy.template.__GT_node_like.call(null, parent);
      var seq__6943_6948 = cljs.core.seq.call(null, cljs.core.cons.call(null, child, more_children));
      var chunk__6944_6949 = null;
      var count__6945_6950 = 0;
      var i__6946_6951 = 0;
      while(true) {
        if(i__6946_6951 < count__6945_6950) {
          var c_6952 = cljs.core._nth.call(null, chunk__6944_6949, i__6946_6951);
          append_BANG_.call(null, parent__$1, c_6952);
          var G__6953 = seq__6943_6948;
          var G__6954 = chunk__6944_6949;
          var G__6955 = count__6945_6950;
          var G__6956 = i__6946_6951 + 1;
          seq__6943_6948 = G__6953;
          chunk__6944_6949 = G__6954;
          count__6945_6950 = G__6955;
          i__6946_6951 = G__6956;
          continue
        }else {
          var temp__4092__auto___6957 = cljs.core.seq.call(null, seq__6943_6948);
          if(temp__4092__auto___6957) {
            var seq__6943_6958__$1 = temp__4092__auto___6957;
            if(cljs.core.chunked_seq_QMARK_.call(null, seq__6943_6958__$1)) {
              var c__3615__auto___6959 = cljs.core.chunk_first.call(null, seq__6943_6958__$1);
              var G__6960 = cljs.core.chunk_rest.call(null, seq__6943_6958__$1);
              var G__6961 = c__3615__auto___6959;
              var G__6962 = cljs.core.count.call(null, c__3615__auto___6959);
              var G__6963 = 0;
              seq__6943_6948 = G__6960;
              chunk__6944_6949 = G__6961;
              count__6945_6950 = G__6962;
              i__6946_6951 = G__6963;
              continue
            }else {
              var c_6964 = cljs.core.first.call(null, seq__6943_6958__$1);
              append_BANG_.call(null, parent__$1, c_6964);
              var G__6965 = cljs.core.next.call(null, seq__6943_6958__$1);
              var G__6966 = null;
              var G__6967 = 0;
              var G__6968 = 0;
              seq__6943_6948 = G__6965;
              chunk__6944_6949 = G__6966;
              count__6945_6950 = G__6967;
              i__6946_6951 = G__6968;
              continue
            }
          }else {
          }
        }
        break
      }
      return parent__$1
    };
    var G__6947 = function(parent, child, var_args) {
      var more_children = null;
      if(arguments.length > 2) {
        more_children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6947__delegate.call(this, parent, child, more_children)
    };
    G__6947.cljs$lang$maxFixedArity = 2;
    G__6947.cljs$lang$applyTo = function(arglist__6969) {
      var parent = cljs.core.first(arglist__6969);
      arglist__6969 = cljs.core.next(arglist__6969);
      var child = cljs.core.first(arglist__6969);
      var more_children = cljs.core.rest(arglist__6969);
      return G__6947__delegate(parent, child, more_children)
    };
    G__6947.cljs$core$IFn$_invoke$arity$variadic = G__6947__delegate;
    return G__6947
  }();
  append_BANG_ = function(parent, child, var_args) {
    var more_children = var_args;
    switch(arguments.length) {
      case 2:
        return append_BANG___2.call(this, parent, child);
      default:
        return append_BANG___3.cljs$core$IFn$_invoke$arity$variadic(parent, child, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  append_BANG_.cljs$lang$maxFixedArity = 2;
  append_BANG_.cljs$lang$applyTo = append_BANG___3.cljs$lang$applyTo;
  append_BANG_.cljs$core$IFn$_invoke$arity$2 = append_BANG___2;
  append_BANG_.cljs$core$IFn$_invoke$arity$variadic = append_BANG___3.cljs$core$IFn$_invoke$arity$variadic;
  return append_BANG_
}();
dommy.core.prepend_BANG_ = function() {
  var prepend_BANG_ = null;
  var prepend_BANG___2 = function(parent, child) {
    var G__6975 = dommy.template.__GT_node_like.call(null, parent);
    G__6975.insertBefore(dommy.template.__GT_node_like.call(null, child), parent.firstChild);
    return G__6975
  };
  var prepend_BANG___3 = function() {
    var G__6980__delegate = function(parent, child, more_children) {
      var parent__$1 = dommy.template.__GT_node_like.call(null, parent);
      var seq__6976_6981 = cljs.core.seq.call(null, cljs.core.cons.call(null, child, more_children));
      var chunk__6977_6982 = null;
      var count__6978_6983 = 0;
      var i__6979_6984 = 0;
      while(true) {
        if(i__6979_6984 < count__6978_6983) {
          var c_6985 = cljs.core._nth.call(null, chunk__6977_6982, i__6979_6984);
          prepend_BANG_.call(null, parent__$1, c_6985);
          var G__6986 = seq__6976_6981;
          var G__6987 = chunk__6977_6982;
          var G__6988 = count__6978_6983;
          var G__6989 = i__6979_6984 + 1;
          seq__6976_6981 = G__6986;
          chunk__6977_6982 = G__6987;
          count__6978_6983 = G__6988;
          i__6979_6984 = G__6989;
          continue
        }else {
          var temp__4092__auto___6990 = cljs.core.seq.call(null, seq__6976_6981);
          if(temp__4092__auto___6990) {
            var seq__6976_6991__$1 = temp__4092__auto___6990;
            if(cljs.core.chunked_seq_QMARK_.call(null, seq__6976_6991__$1)) {
              var c__3615__auto___6992 = cljs.core.chunk_first.call(null, seq__6976_6991__$1);
              var G__6993 = cljs.core.chunk_rest.call(null, seq__6976_6991__$1);
              var G__6994 = c__3615__auto___6992;
              var G__6995 = cljs.core.count.call(null, c__3615__auto___6992);
              var G__6996 = 0;
              seq__6976_6981 = G__6993;
              chunk__6977_6982 = G__6994;
              count__6978_6983 = G__6995;
              i__6979_6984 = G__6996;
              continue
            }else {
              var c_6997 = cljs.core.first.call(null, seq__6976_6991__$1);
              prepend_BANG_.call(null, parent__$1, c_6997);
              var G__6998 = cljs.core.next.call(null, seq__6976_6991__$1);
              var G__6999 = null;
              var G__7000 = 0;
              var G__7001 = 0;
              seq__6976_6981 = G__6998;
              chunk__6977_6982 = G__6999;
              count__6978_6983 = G__7000;
              i__6979_6984 = G__7001;
              continue
            }
          }else {
          }
        }
        break
      }
      return parent__$1
    };
    var G__6980 = function(parent, child, var_args) {
      var more_children = null;
      if(arguments.length > 2) {
        more_children = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6980__delegate.call(this, parent, child, more_children)
    };
    G__6980.cljs$lang$maxFixedArity = 2;
    G__6980.cljs$lang$applyTo = function(arglist__7002) {
      var parent = cljs.core.first(arglist__7002);
      arglist__7002 = cljs.core.next(arglist__7002);
      var child = cljs.core.first(arglist__7002);
      var more_children = cljs.core.rest(arglist__7002);
      return G__6980__delegate(parent, child, more_children)
    };
    G__6980.cljs$core$IFn$_invoke$arity$variadic = G__6980__delegate;
    return G__6980
  }();
  prepend_BANG_ = function(parent, child, var_args) {
    var more_children = var_args;
    switch(arguments.length) {
      case 2:
        return prepend_BANG___2.call(this, parent, child);
      default:
        return prepend_BANG___3.cljs$core$IFn$_invoke$arity$variadic(parent, child, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prepend_BANG_.cljs$lang$maxFixedArity = 2;
  prepend_BANG_.cljs$lang$applyTo = prepend_BANG___3.cljs$lang$applyTo;
  prepend_BANG_.cljs$core$IFn$_invoke$arity$2 = prepend_BANG___2;
  prepend_BANG_.cljs$core$IFn$_invoke$arity$variadic = prepend_BANG___3.cljs$core$IFn$_invoke$arity$variadic;
  return prepend_BANG_
}();
dommy.core.insert_before_BANG_ = function insert_before_BANG_(elem, other) {
  var actual_node = dommy.template.__GT_node_like.call(null, elem);
  var other__$1 = dommy.template.__GT_node_like.call(null, other);
  if(cljs.core.truth_(other__$1.parentNode)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, ".-parentNode", ".-parentNode", 499016324, null), new cljs.core.Symbol(null, "other", "other", -1534461751, null))))].join(""));
  }
  other__$1.parentNode.insertBefore(actual_node, other__$1);
  return actual_node
};
dommy.core.insert_after_BANG_ = function insert_after_BANG_(elem, other) {
  var actual_node = dommy.template.__GT_node_like.call(null, elem);
  var other__$1 = dommy.template.__GT_node_like.call(null, other);
  var parent = other__$1.parentNode;
  var temp__4090__auto___7003 = other__$1.nextSibling;
  if(cljs.core.truth_(temp__4090__auto___7003)) {
    var next_7004 = temp__4090__auto___7003;
    parent.insertBefore(actual_node, next_7004)
  }else {
    parent.appendChild(actual_node)
  }
  return actual_node
};
dommy.core.replace_BANG_ = function replace_BANG_(elem, new$) {
  var new$__$1 = dommy.template.__GT_node_like.call(null, new$);
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  if(cljs.core.truth_(elem__$1.parentNode)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, ".-parentNode", ".-parentNode", 499016324, null), new cljs.core.Symbol(null, "elem", "elem", -1637415608, null))))].join(""));
  }
  elem__$1.parentNode.replaceChild(new$__$1, elem__$1);
  return new$__$1
};
dommy.core.replace_contents_BANG_ = function replace_contents_BANG_(parent, node_like) {
  var G__7006 = dommy.template.__GT_node_like.call(null, parent);
  G__7006.innerHTML = "";
  dommy.core.append_BANG_.call(null, G__7006, node_like);
  return G__7006
};
dommy.core.remove_BANG_ = function remove_BANG_(elem) {
  var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
  var G__7008 = elem__$1.parentNode;
  G__7008.removeChild(elem__$1);
  return G__7008
};
dommy.core.selector = function selector(data) {
  if(cljs.core.coll_QMARK_.call(null, data)) {
    return clojure.string.join.call(null, " ", cljs.core.map.call(null, selector, data))
  }else {
    if(function() {
      var or__3943__auto__ = typeof data === "string";
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return data instanceof cljs.core.Keyword
      }
    }()) {
      return cljs.core.name.call(null, data)
    }else {
      return null
    }
  }
};
dommy.core.ancestor_nodes = function ancestor_nodes(elem) {
  return cljs.core.take_while.call(null, cljs.core.identity, cljs.core.iterate.call(null, function(p1__7009_SHARP_) {
    return p1__7009_SHARP_.parentNode
  }, dommy.template.__GT_node_like.call(null, elem)))
};
dommy.core.matches_pred = function() {
  var matches_pred = null;
  var matches_pred__1 = function(selector) {
    return matches_pred.call(null, document, selector)
  };
  var matches_pred__2 = function(base, selector) {
    var matches = dommy.utils.__GT_Array.call(null, dommy.template.__GT_node_like.call(null, dommy.template.__GT_node_like.call(null, base)).querySelectorAll(dommy.core.selector.call(null, selector)));
    return function(elem) {
      return matches.indexOf(elem) >= 0
    }
  };
  matches_pred = function(base, selector) {
    switch(arguments.length) {
      case 1:
        return matches_pred__1.call(this, base);
      case 2:
        return matches_pred__2.call(this, base, selector)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  matches_pred.cljs$core$IFn$_invoke$arity$1 = matches_pred__1;
  matches_pred.cljs$core$IFn$_invoke$arity$2 = matches_pred__2;
  return matches_pred
}();
dommy.core.closest = function() {
  var closest = null;
  var closest__2 = function(elem, selector) {
    return cljs.core.first.call(null, cljs.core.filter.call(null, dommy.core.matches_pred.call(null, selector), dommy.core.ancestor_nodes.call(null, dommy.template.__GT_node_like.call(null, elem))))
  };
  var closest__3 = function(base, elem, selector) {
    var base__$1 = dommy.template.__GT_node_like.call(null, base);
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    return cljs.core.first.call(null, cljs.core.filter.call(null, dommy.core.matches_pred.call(null, base__$1, selector), cljs.core.take_while.call(null, function(p1__7010_SHARP_) {
      return!(p1__7010_SHARP_ === base__$1)
    }, dommy.core.ancestor_nodes.call(null, elem__$1))))
  };
  closest = function(base, elem, selector) {
    switch(arguments.length) {
      case 2:
        return closest__2.call(this, base, elem);
      case 3:
        return closest__3.call(this, base, elem, selector)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  closest.cljs$core$IFn$_invoke$arity$2 = closest__2;
  closest.cljs$core$IFn$_invoke$arity$3 = closest__3;
  return closest
}();
dommy.core.descendant_QMARK_ = function descendant_QMARK_(descendant, ancestor) {
  var descendant__$1 = dommy.template.__GT_node_like.call(null, descendant);
  var ancestor__$1 = dommy.template.__GT_node_like.call(null, ancestor);
  if(cljs.core.truth_(ancestor__$1.contains)) {
    return ancestor__$1.contains(descendant__$1)
  }else {
    if(cljs.core.truth_(ancestor__$1.compareDocumentPosition)) {
      return(ancestor__$1.compareDocumentPosition(descendant__$1) & 1 << 4) != 0
    }else {
      return null
    }
  }
};
dommy.core.special_listener_makers = cljs.core.into.call(null, cljs.core.PersistentArrayMap.EMPTY, cljs.core.map.call(null, function(p__7011) {
  var vec__7012 = p__7011;
  var special_mouse_event = cljs.core.nth.call(null, vec__7012, 0, null);
  var real_mouse_event = cljs.core.nth.call(null, vec__7012, 1, null);
  return cljs.core.PersistentVector.fromArray([special_mouse_event, cljs.core.PersistentArrayMap.fromArray([real_mouse_event, function(f) {
    return function(event) {
      var related_target = event.relatedTarget;
      var listener_target = function() {
        var or__3943__auto__ = event.selectedTarget;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return event.currentTarget
        }
      }();
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = related_target;
        if(cljs.core.truth_(and__3941__auto__)) {
          return dommy.core.descendant_QMARK_.call(null, related_target, listener_target)
        }else {
          return and__3941__auto__
        }
      }())) {
        return null
      }else {
        return f.call(null, event)
      }
    }
  }], true)], true)
}, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "mouseenter", "mouseenter", 2027084997), new cljs.core.Keyword(null, "mouseover", "mouseover", 1601081963), new cljs.core.Keyword(null, "mouseleave", "mouseleave", 2033263780), new cljs.core.Keyword(null, "mouseout", "mouseout", 894298107)], true)));
dommy.core.live_listener = function live_listener(elem, selector, f) {
  return function(event) {
    var temp__4092__auto__ = dommy.core.closest.call(null, dommy.template.__GT_node_like.call(null, elem), event.target, selector);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var selected_target = temp__4092__auto__;
      event.selectedTarget = selected_target;
      return f.call(null, event)
    }else {
      return null
    }
  }
};
dommy.core.event_listeners = function event_listeners(elem) {
  var or__3943__auto__ = dommy.template.__GT_node_like.call(null, elem).dommyEventListeners;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return cljs.core.PersistentArrayMap.EMPTY
  }
};
dommy.core.update_event_listeners_BANG_ = function() {
  var update_event_listeners_BANG___delegate = function(elem, f, args) {
    var elem__$1 = dommy.template.__GT_node_like.call(null, elem);
    return elem__$1.dommyEventListeners = cljs.core.apply.call(null, f, dommy.core.event_listeners.call(null, elem__$1), args)
  };
  var update_event_listeners_BANG_ = function(elem, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return update_event_listeners_BANG___delegate.call(this, elem, f, args)
  };
  update_event_listeners_BANG_.cljs$lang$maxFixedArity = 2;
  update_event_listeners_BANG_.cljs$lang$applyTo = function(arglist__7013) {
    var elem = cljs.core.first(arglist__7013);
    arglist__7013 = cljs.core.next(arglist__7013);
    var f = cljs.core.first(arglist__7013);
    var args = cljs.core.rest(arglist__7013);
    return update_event_listeners_BANG___delegate(elem, f, args)
  };
  update_event_listeners_BANG_.cljs$core$IFn$_invoke$arity$variadic = update_event_listeners_BANG___delegate;
  return update_event_listeners_BANG_
}();
dommy.core.elem_and_selector = function elem_and_selector(elem_sel) {
  if(cljs.core.sequential_QMARK_.call(null, elem_sel)) {
    return cljs.core.juxt.call(null, function(p1__7014_SHARP_) {
      return dommy.template.__GT_node_like.call(null, cljs.core.first.call(null, p1__7014_SHARP_))
    }, cljs.core.rest).call(null, elem_sel)
  }else {
    return cljs.core.PersistentVector.fromArray([dommy.template.__GT_node_like.call(null, elem_sel), null], true)
  }
};
dommy.core.listen_BANG_ = function() {
  var listen_BANG___delegate = function(elem_sel, type_fs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, type_fs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "even?", "even?", -1543640034, null), cljs.core.list(new cljs.core.Symbol(null, "count", "count", -1545680184, null), new cljs.core.Symbol(null, "type-fs", "type-fs", 1801297401, null)))))].join(""));
    }
    var vec__7038_7061 = dommy.core.elem_and_selector.call(null, elem_sel);
    var elem_7062 = cljs.core.nth.call(null, vec__7038_7061, 0, null);
    var selector_7063 = cljs.core.nth.call(null, vec__7038_7061, 1, null);
    var seq__7039_7064 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, type_fs));
    var chunk__7046_7065 = null;
    var count__7047_7066 = 0;
    var i__7048_7067 = 0;
    while(true) {
      if(i__7048_7067 < count__7047_7066) {
        var vec__7055_7068 = cljs.core._nth.call(null, chunk__7046_7065, i__7048_7067);
        var orig_type_7069 = cljs.core.nth.call(null, vec__7055_7068, 0, null);
        var f_7070 = cljs.core.nth.call(null, vec__7055_7068, 1, null);
        var seq__7049_7071 = cljs.core.seq.call(null, cljs.core.get.call(null, dommy.core.special_listener_makers, orig_type_7069, cljs.core.PersistentArrayMap.fromArray([orig_type_7069, cljs.core.identity], true)));
        var chunk__7051_7072 = null;
        var count__7052_7073 = 0;
        var i__7053_7074 = 0;
        while(true) {
          if(i__7053_7074 < count__7052_7073) {
            var vec__7056_7075 = cljs.core._nth.call(null, chunk__7051_7072, i__7053_7074);
            var actual_type_7076 = cljs.core.nth.call(null, vec__7056_7075, 0, null);
            var factory_7077 = cljs.core.nth.call(null, vec__7056_7075, 1, null);
            var canonical_f_7078 = (cljs.core.truth_(selector_7063) ? cljs.core.partial.call(null, dommy.core.live_listener, elem_7062, selector_7063) : cljs.core.identity).call(null, factory_7077.call(null, f_7070));
            dommy.core.update_event_listeners_BANG_.call(null, elem_7062, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray([selector_7063, actual_type_7076, f_7070], true), canonical_f_7078);
            if(cljs.core.truth_(elem_7062.addEventListener)) {
              elem_7062.addEventListener(cljs.core.name.call(null, actual_type_7076), canonical_f_7078)
            }else {
              elem_7062.attachEvent(cljs.core.name.call(null, actual_type_7076), canonical_f_7078)
            }
            var G__7079 = seq__7049_7071;
            var G__7080 = chunk__7051_7072;
            var G__7081 = count__7052_7073;
            var G__7082 = i__7053_7074 + 1;
            seq__7049_7071 = G__7079;
            chunk__7051_7072 = G__7080;
            count__7052_7073 = G__7081;
            i__7053_7074 = G__7082;
            continue
          }else {
            var temp__4092__auto___7083 = cljs.core.seq.call(null, seq__7049_7071);
            if(temp__4092__auto___7083) {
              var seq__7049_7084__$1 = temp__4092__auto___7083;
              if(cljs.core.chunked_seq_QMARK_.call(null, seq__7049_7084__$1)) {
                var c__3615__auto___7085 = cljs.core.chunk_first.call(null, seq__7049_7084__$1);
                var G__7086 = cljs.core.chunk_rest.call(null, seq__7049_7084__$1);
                var G__7087 = c__3615__auto___7085;
                var G__7088 = cljs.core.count.call(null, c__3615__auto___7085);
                var G__7089 = 0;
                seq__7049_7071 = G__7086;
                chunk__7051_7072 = G__7087;
                count__7052_7073 = G__7088;
                i__7053_7074 = G__7089;
                continue
              }else {
                var vec__7057_7090 = cljs.core.first.call(null, seq__7049_7084__$1);
                var actual_type_7091 = cljs.core.nth.call(null, vec__7057_7090, 0, null);
                var factory_7092 = cljs.core.nth.call(null, vec__7057_7090, 1, null);
                var canonical_f_7093 = (cljs.core.truth_(selector_7063) ? cljs.core.partial.call(null, dommy.core.live_listener, elem_7062, selector_7063) : cljs.core.identity).call(null, factory_7092.call(null, f_7070));
                dommy.core.update_event_listeners_BANG_.call(null, elem_7062, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray([selector_7063, actual_type_7091, f_7070], true), canonical_f_7093);
                if(cljs.core.truth_(elem_7062.addEventListener)) {
                  elem_7062.addEventListener(cljs.core.name.call(null, actual_type_7091), canonical_f_7093)
                }else {
                  elem_7062.attachEvent(cljs.core.name.call(null, actual_type_7091), canonical_f_7093)
                }
                var G__7094 = cljs.core.next.call(null, seq__7049_7084__$1);
                var G__7095 = null;
                var G__7096 = 0;
                var G__7097 = 0;
                seq__7049_7071 = G__7094;
                chunk__7051_7072 = G__7095;
                count__7052_7073 = G__7096;
                i__7053_7074 = G__7097;
                continue
              }
            }else {
            }
          }
          break
        }
        var G__7098 = seq__7039_7064;
        var G__7099 = chunk__7046_7065;
        var G__7100 = count__7047_7066;
        var G__7101 = i__7048_7067 + 1;
        seq__7039_7064 = G__7098;
        chunk__7046_7065 = G__7099;
        count__7047_7066 = G__7100;
        i__7048_7067 = G__7101;
        continue
      }else {
        var temp__4092__auto___7102 = cljs.core.seq.call(null, seq__7039_7064);
        if(temp__4092__auto___7102) {
          var seq__7039_7103__$1 = temp__4092__auto___7102;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7039_7103__$1)) {
            var c__3615__auto___7104 = cljs.core.chunk_first.call(null, seq__7039_7103__$1);
            var G__7105 = cljs.core.chunk_rest.call(null, seq__7039_7103__$1);
            var G__7106 = c__3615__auto___7104;
            var G__7107 = cljs.core.count.call(null, c__3615__auto___7104);
            var G__7108 = 0;
            seq__7039_7064 = G__7105;
            chunk__7046_7065 = G__7106;
            count__7047_7066 = G__7107;
            i__7048_7067 = G__7108;
            continue
          }else {
            var vec__7058_7109 = cljs.core.first.call(null, seq__7039_7103__$1);
            var orig_type_7110 = cljs.core.nth.call(null, vec__7058_7109, 0, null);
            var f_7111 = cljs.core.nth.call(null, vec__7058_7109, 1, null);
            var seq__7040_7112 = cljs.core.seq.call(null, cljs.core.get.call(null, dommy.core.special_listener_makers, orig_type_7110, cljs.core.PersistentArrayMap.fromArray([orig_type_7110, cljs.core.identity], true)));
            var chunk__7042_7113 = null;
            var count__7043_7114 = 0;
            var i__7044_7115 = 0;
            while(true) {
              if(i__7044_7115 < count__7043_7114) {
                var vec__7059_7116 = cljs.core._nth.call(null, chunk__7042_7113, i__7044_7115);
                var actual_type_7117 = cljs.core.nth.call(null, vec__7059_7116, 0, null);
                var factory_7118 = cljs.core.nth.call(null, vec__7059_7116, 1, null);
                var canonical_f_7119 = (cljs.core.truth_(selector_7063) ? cljs.core.partial.call(null, dommy.core.live_listener, elem_7062, selector_7063) : cljs.core.identity).call(null, factory_7118.call(null, f_7111));
                dommy.core.update_event_listeners_BANG_.call(null, elem_7062, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray([selector_7063, actual_type_7117, f_7111], true), canonical_f_7119);
                if(cljs.core.truth_(elem_7062.addEventListener)) {
                  elem_7062.addEventListener(cljs.core.name.call(null, actual_type_7117), canonical_f_7119)
                }else {
                  elem_7062.attachEvent(cljs.core.name.call(null, actual_type_7117), canonical_f_7119)
                }
                var G__7120 = seq__7040_7112;
                var G__7121 = chunk__7042_7113;
                var G__7122 = count__7043_7114;
                var G__7123 = i__7044_7115 + 1;
                seq__7040_7112 = G__7120;
                chunk__7042_7113 = G__7121;
                count__7043_7114 = G__7122;
                i__7044_7115 = G__7123;
                continue
              }else {
                var temp__4092__auto___7124__$1 = cljs.core.seq.call(null, seq__7040_7112);
                if(temp__4092__auto___7124__$1) {
                  var seq__7040_7125__$1 = temp__4092__auto___7124__$1;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__7040_7125__$1)) {
                    var c__3615__auto___7126 = cljs.core.chunk_first.call(null, seq__7040_7125__$1);
                    var G__7127 = cljs.core.chunk_rest.call(null, seq__7040_7125__$1);
                    var G__7128 = c__3615__auto___7126;
                    var G__7129 = cljs.core.count.call(null, c__3615__auto___7126);
                    var G__7130 = 0;
                    seq__7040_7112 = G__7127;
                    chunk__7042_7113 = G__7128;
                    count__7043_7114 = G__7129;
                    i__7044_7115 = G__7130;
                    continue
                  }else {
                    var vec__7060_7131 = cljs.core.first.call(null, seq__7040_7125__$1);
                    var actual_type_7132 = cljs.core.nth.call(null, vec__7060_7131, 0, null);
                    var factory_7133 = cljs.core.nth.call(null, vec__7060_7131, 1, null);
                    var canonical_f_7134 = (cljs.core.truth_(selector_7063) ? cljs.core.partial.call(null, dommy.core.live_listener, elem_7062, selector_7063) : cljs.core.identity).call(null, factory_7133.call(null, f_7111));
                    dommy.core.update_event_listeners_BANG_.call(null, elem_7062, cljs.core.assoc_in, cljs.core.PersistentVector.fromArray([selector_7063, actual_type_7132, f_7111], true), canonical_f_7134);
                    if(cljs.core.truth_(elem_7062.addEventListener)) {
                      elem_7062.addEventListener(cljs.core.name.call(null, actual_type_7132), canonical_f_7134)
                    }else {
                      elem_7062.attachEvent(cljs.core.name.call(null, actual_type_7132), canonical_f_7134)
                    }
                    var G__7135 = cljs.core.next.call(null, seq__7040_7125__$1);
                    var G__7136 = null;
                    var G__7137 = 0;
                    var G__7138 = 0;
                    seq__7040_7112 = G__7135;
                    chunk__7042_7113 = G__7136;
                    count__7043_7114 = G__7137;
                    i__7044_7115 = G__7138;
                    continue
                  }
                }else {
                }
              }
              break
            }
            var G__7139 = cljs.core.next.call(null, seq__7039_7103__$1);
            var G__7140 = null;
            var G__7141 = 0;
            var G__7142 = 0;
            seq__7039_7064 = G__7139;
            chunk__7046_7065 = G__7140;
            count__7047_7066 = G__7141;
            i__7048_7067 = G__7142;
            continue
          }
        }else {
        }
      }
      break
    }
    return elem_sel
  };
  var listen_BANG_ = function(elem_sel, var_args) {
    var type_fs = null;
    if(arguments.length > 1) {
      type_fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return listen_BANG___delegate.call(this, elem_sel, type_fs)
  };
  listen_BANG_.cljs$lang$maxFixedArity = 1;
  listen_BANG_.cljs$lang$applyTo = function(arglist__7143) {
    var elem_sel = cljs.core.first(arglist__7143);
    var type_fs = cljs.core.rest(arglist__7143);
    return listen_BANG___delegate(elem_sel, type_fs)
  };
  listen_BANG_.cljs$core$IFn$_invoke$arity$variadic = listen_BANG___delegate;
  return listen_BANG_
}();
dommy.core.unlisten_BANG_ = function() {
  var unlisten_BANG___delegate = function(elem_sel, type_fs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, type_fs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "even?", "even?", -1543640034, null), cljs.core.list(new cljs.core.Symbol(null, "count", "count", -1545680184, null), new cljs.core.Symbol(null, "type-fs", "type-fs", 1801297401, null)))))].join(""));
    }
    var vec__7167_7190 = dommy.core.elem_and_selector.call(null, elem_sel);
    var elem_7191 = cljs.core.nth.call(null, vec__7167_7190, 0, null);
    var selector_7192 = cljs.core.nth.call(null, vec__7167_7190, 1, null);
    var seq__7168_7193 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, type_fs));
    var chunk__7175_7194 = null;
    var count__7176_7195 = 0;
    var i__7177_7196 = 0;
    while(true) {
      if(i__7177_7196 < count__7176_7195) {
        var vec__7184_7197 = cljs.core._nth.call(null, chunk__7175_7194, i__7177_7196);
        var orig_type_7198 = cljs.core.nth.call(null, vec__7184_7197, 0, null);
        var f_7199 = cljs.core.nth.call(null, vec__7184_7197, 1, null);
        var seq__7178_7200 = cljs.core.seq.call(null, cljs.core.get.call(null, dommy.core.special_listener_makers, orig_type_7198, cljs.core.PersistentArrayMap.fromArray([orig_type_7198, cljs.core.identity], true)));
        var chunk__7180_7201 = null;
        var count__7181_7202 = 0;
        var i__7182_7203 = 0;
        while(true) {
          if(i__7182_7203 < count__7181_7202) {
            var vec__7185_7204 = cljs.core._nth.call(null, chunk__7180_7201, i__7182_7203);
            var actual_type_7205 = cljs.core.nth.call(null, vec__7185_7204, 0, null);
            var __7206 = cljs.core.nth.call(null, vec__7185_7204, 1, null);
            var keys_7207 = cljs.core.PersistentVector.fromArray([selector_7192, actual_type_7205, f_7199], true);
            var canonical_f_7208 = cljs.core.get_in.call(null, dommy.core.event_listeners.call(null, elem_7191), keys_7207);
            dommy.core.update_event_listeners_BANG_.call(null, elem_7191, dommy.utils.dissoc_in, keys_7207);
            if(cljs.core.truth_(elem_7191.removeEventListener)) {
              elem_7191.removeEventListener(cljs.core.name.call(null, actual_type_7205), canonical_f_7208)
            }else {
              elem_7191.detachEvent(cljs.core.name.call(null, actual_type_7205), canonical_f_7208)
            }
            var G__7209 = seq__7178_7200;
            var G__7210 = chunk__7180_7201;
            var G__7211 = count__7181_7202;
            var G__7212 = i__7182_7203 + 1;
            seq__7178_7200 = G__7209;
            chunk__7180_7201 = G__7210;
            count__7181_7202 = G__7211;
            i__7182_7203 = G__7212;
            continue
          }else {
            var temp__4092__auto___7213 = cljs.core.seq.call(null, seq__7178_7200);
            if(temp__4092__auto___7213) {
              var seq__7178_7214__$1 = temp__4092__auto___7213;
              if(cljs.core.chunked_seq_QMARK_.call(null, seq__7178_7214__$1)) {
                var c__3615__auto___7215 = cljs.core.chunk_first.call(null, seq__7178_7214__$1);
                var G__7216 = cljs.core.chunk_rest.call(null, seq__7178_7214__$1);
                var G__7217 = c__3615__auto___7215;
                var G__7218 = cljs.core.count.call(null, c__3615__auto___7215);
                var G__7219 = 0;
                seq__7178_7200 = G__7216;
                chunk__7180_7201 = G__7217;
                count__7181_7202 = G__7218;
                i__7182_7203 = G__7219;
                continue
              }else {
                var vec__7186_7220 = cljs.core.first.call(null, seq__7178_7214__$1);
                var actual_type_7221 = cljs.core.nth.call(null, vec__7186_7220, 0, null);
                var __7222 = cljs.core.nth.call(null, vec__7186_7220, 1, null);
                var keys_7223 = cljs.core.PersistentVector.fromArray([selector_7192, actual_type_7221, f_7199], true);
                var canonical_f_7224 = cljs.core.get_in.call(null, dommy.core.event_listeners.call(null, elem_7191), keys_7223);
                dommy.core.update_event_listeners_BANG_.call(null, elem_7191, dommy.utils.dissoc_in, keys_7223);
                if(cljs.core.truth_(elem_7191.removeEventListener)) {
                  elem_7191.removeEventListener(cljs.core.name.call(null, actual_type_7221), canonical_f_7224)
                }else {
                  elem_7191.detachEvent(cljs.core.name.call(null, actual_type_7221), canonical_f_7224)
                }
                var G__7225 = cljs.core.next.call(null, seq__7178_7214__$1);
                var G__7226 = null;
                var G__7227 = 0;
                var G__7228 = 0;
                seq__7178_7200 = G__7225;
                chunk__7180_7201 = G__7226;
                count__7181_7202 = G__7227;
                i__7182_7203 = G__7228;
                continue
              }
            }else {
            }
          }
          break
        }
        var G__7229 = seq__7168_7193;
        var G__7230 = chunk__7175_7194;
        var G__7231 = count__7176_7195;
        var G__7232 = i__7177_7196 + 1;
        seq__7168_7193 = G__7229;
        chunk__7175_7194 = G__7230;
        count__7176_7195 = G__7231;
        i__7177_7196 = G__7232;
        continue
      }else {
        var temp__4092__auto___7233 = cljs.core.seq.call(null, seq__7168_7193);
        if(temp__4092__auto___7233) {
          var seq__7168_7234__$1 = temp__4092__auto___7233;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7168_7234__$1)) {
            var c__3615__auto___7235 = cljs.core.chunk_first.call(null, seq__7168_7234__$1);
            var G__7236 = cljs.core.chunk_rest.call(null, seq__7168_7234__$1);
            var G__7237 = c__3615__auto___7235;
            var G__7238 = cljs.core.count.call(null, c__3615__auto___7235);
            var G__7239 = 0;
            seq__7168_7193 = G__7236;
            chunk__7175_7194 = G__7237;
            count__7176_7195 = G__7238;
            i__7177_7196 = G__7239;
            continue
          }else {
            var vec__7187_7240 = cljs.core.first.call(null, seq__7168_7234__$1);
            var orig_type_7241 = cljs.core.nth.call(null, vec__7187_7240, 0, null);
            var f_7242 = cljs.core.nth.call(null, vec__7187_7240, 1, null);
            var seq__7169_7243 = cljs.core.seq.call(null, cljs.core.get.call(null, dommy.core.special_listener_makers, orig_type_7241, cljs.core.PersistentArrayMap.fromArray([orig_type_7241, cljs.core.identity], true)));
            var chunk__7171_7244 = null;
            var count__7172_7245 = 0;
            var i__7173_7246 = 0;
            while(true) {
              if(i__7173_7246 < count__7172_7245) {
                var vec__7188_7247 = cljs.core._nth.call(null, chunk__7171_7244, i__7173_7246);
                var actual_type_7248 = cljs.core.nth.call(null, vec__7188_7247, 0, null);
                var __7249 = cljs.core.nth.call(null, vec__7188_7247, 1, null);
                var keys_7250 = cljs.core.PersistentVector.fromArray([selector_7192, actual_type_7248, f_7242], true);
                var canonical_f_7251 = cljs.core.get_in.call(null, dommy.core.event_listeners.call(null, elem_7191), keys_7250);
                dommy.core.update_event_listeners_BANG_.call(null, elem_7191, dommy.utils.dissoc_in, keys_7250);
                if(cljs.core.truth_(elem_7191.removeEventListener)) {
                  elem_7191.removeEventListener(cljs.core.name.call(null, actual_type_7248), canonical_f_7251)
                }else {
                  elem_7191.detachEvent(cljs.core.name.call(null, actual_type_7248), canonical_f_7251)
                }
                var G__7252 = seq__7169_7243;
                var G__7253 = chunk__7171_7244;
                var G__7254 = count__7172_7245;
                var G__7255 = i__7173_7246 + 1;
                seq__7169_7243 = G__7252;
                chunk__7171_7244 = G__7253;
                count__7172_7245 = G__7254;
                i__7173_7246 = G__7255;
                continue
              }else {
                var temp__4092__auto___7256__$1 = cljs.core.seq.call(null, seq__7169_7243);
                if(temp__4092__auto___7256__$1) {
                  var seq__7169_7257__$1 = temp__4092__auto___7256__$1;
                  if(cljs.core.chunked_seq_QMARK_.call(null, seq__7169_7257__$1)) {
                    var c__3615__auto___7258 = cljs.core.chunk_first.call(null, seq__7169_7257__$1);
                    var G__7259 = cljs.core.chunk_rest.call(null, seq__7169_7257__$1);
                    var G__7260 = c__3615__auto___7258;
                    var G__7261 = cljs.core.count.call(null, c__3615__auto___7258);
                    var G__7262 = 0;
                    seq__7169_7243 = G__7259;
                    chunk__7171_7244 = G__7260;
                    count__7172_7245 = G__7261;
                    i__7173_7246 = G__7262;
                    continue
                  }else {
                    var vec__7189_7263 = cljs.core.first.call(null, seq__7169_7257__$1);
                    var actual_type_7264 = cljs.core.nth.call(null, vec__7189_7263, 0, null);
                    var __7265 = cljs.core.nth.call(null, vec__7189_7263, 1, null);
                    var keys_7266 = cljs.core.PersistentVector.fromArray([selector_7192, actual_type_7264, f_7242], true);
                    var canonical_f_7267 = cljs.core.get_in.call(null, dommy.core.event_listeners.call(null, elem_7191), keys_7266);
                    dommy.core.update_event_listeners_BANG_.call(null, elem_7191, dommy.utils.dissoc_in, keys_7266);
                    if(cljs.core.truth_(elem_7191.removeEventListener)) {
                      elem_7191.removeEventListener(cljs.core.name.call(null, actual_type_7264), canonical_f_7267)
                    }else {
                      elem_7191.detachEvent(cljs.core.name.call(null, actual_type_7264), canonical_f_7267)
                    }
                    var G__7268 = cljs.core.next.call(null, seq__7169_7257__$1);
                    var G__7269 = null;
                    var G__7270 = 0;
                    var G__7271 = 0;
                    seq__7169_7243 = G__7268;
                    chunk__7171_7244 = G__7269;
                    count__7172_7245 = G__7270;
                    i__7173_7246 = G__7271;
                    continue
                  }
                }else {
                }
              }
              break
            }
            var G__7272 = cljs.core.next.call(null, seq__7168_7234__$1);
            var G__7273 = null;
            var G__7274 = 0;
            var G__7275 = 0;
            seq__7168_7193 = G__7272;
            chunk__7175_7194 = G__7273;
            count__7176_7195 = G__7274;
            i__7177_7196 = G__7275;
            continue
          }
        }else {
        }
      }
      break
    }
    return elem_sel
  };
  var unlisten_BANG_ = function(elem_sel, var_args) {
    var type_fs = null;
    if(arguments.length > 1) {
      type_fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return unlisten_BANG___delegate.call(this, elem_sel, type_fs)
  };
  unlisten_BANG_.cljs$lang$maxFixedArity = 1;
  unlisten_BANG_.cljs$lang$applyTo = function(arglist__7276) {
    var elem_sel = cljs.core.first(arglist__7276);
    var type_fs = cljs.core.rest(arglist__7276);
    return unlisten_BANG___delegate(elem_sel, type_fs)
  };
  unlisten_BANG_.cljs$core$IFn$_invoke$arity$variadic = unlisten_BANG___delegate;
  return unlisten_BANG_
}();
dommy.core.listen_once_BANG_ = function() {
  var listen_once_BANG___delegate = function(elem_sel, type_fs) {
    if(cljs.core.even_QMARK_.call(null, cljs.core.count.call(null, type_fs))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "even?", "even?", -1543640034, null), cljs.core.list(new cljs.core.Symbol(null, "count", "count", -1545680184, null), new cljs.core.Symbol(null, "type-fs", "type-fs", 1801297401, null)))))].join(""));
    }
    var vec__7284_7291 = dommy.core.elem_and_selector.call(null, elem_sel);
    var elem_7292 = cljs.core.nth.call(null, vec__7284_7291, 0, null);
    var selector_7293 = cljs.core.nth.call(null, vec__7284_7291, 1, null);
    var seq__7285_7294 = cljs.core.seq.call(null, cljs.core.partition.call(null, 2, type_fs));
    var chunk__7286_7295 = null;
    var count__7287_7296 = 0;
    var i__7288_7297 = 0;
    while(true) {
      if(i__7288_7297 < count__7287_7296) {
        var vec__7289_7298 = cljs.core._nth.call(null, chunk__7286_7295, i__7288_7297);
        var type_7299 = cljs.core.nth.call(null, vec__7289_7298, 0, null);
        var f_7300 = cljs.core.nth.call(null, vec__7289_7298, 1, null);
        dommy.core.listen_BANG_.call(null, elem_sel, type_7299, function(seq__7285_7294, chunk__7286_7295, count__7287_7296, i__7288_7297, vec__7289_7298, type_7299, f_7300) {
          return function this_fn(e) {
            dommy.core.unlisten_BANG_.call(null, elem_sel, type_7299, this_fn);
            return f_7300.call(null, e)
          }
        }(seq__7285_7294, chunk__7286_7295, count__7287_7296, i__7288_7297, vec__7289_7298, type_7299, f_7300));
        var G__7301 = seq__7285_7294;
        var G__7302 = chunk__7286_7295;
        var G__7303 = count__7287_7296;
        var G__7304 = i__7288_7297 + 1;
        seq__7285_7294 = G__7301;
        chunk__7286_7295 = G__7302;
        count__7287_7296 = G__7303;
        i__7288_7297 = G__7304;
        continue
      }else {
        var temp__4092__auto___7305 = cljs.core.seq.call(null, seq__7285_7294);
        if(temp__4092__auto___7305) {
          var seq__7285_7306__$1 = temp__4092__auto___7305;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__7285_7306__$1)) {
            var c__3615__auto___7307 = cljs.core.chunk_first.call(null, seq__7285_7306__$1);
            var G__7308 = cljs.core.chunk_rest.call(null, seq__7285_7306__$1);
            var G__7309 = c__3615__auto___7307;
            var G__7310 = cljs.core.count.call(null, c__3615__auto___7307);
            var G__7311 = 0;
            seq__7285_7294 = G__7308;
            chunk__7286_7295 = G__7309;
            count__7287_7296 = G__7310;
            i__7288_7297 = G__7311;
            continue
          }else {
            var vec__7290_7312 = cljs.core.first.call(null, seq__7285_7306__$1);
            var type_7313 = cljs.core.nth.call(null, vec__7290_7312, 0, null);
            var f_7314 = cljs.core.nth.call(null, vec__7290_7312, 1, null);
            dommy.core.listen_BANG_.call(null, elem_sel, type_7313, function(seq__7285_7294, chunk__7286_7295, count__7287_7296, i__7288_7297, vec__7290_7312, type_7313, f_7314, seq__7285_7306__$1, temp__4092__auto___7305) {
              return function this_fn(e) {
                dommy.core.unlisten_BANG_.call(null, elem_sel, type_7313, this_fn);
                return f_7314.call(null, e)
              }
            }(seq__7285_7294, chunk__7286_7295, count__7287_7296, i__7288_7297, vec__7290_7312, type_7313, f_7314, seq__7285_7306__$1, temp__4092__auto___7305));
            var G__7315 = cljs.core.next.call(null, seq__7285_7306__$1);
            var G__7316 = null;
            var G__7317 = 0;
            var G__7318 = 0;
            seq__7285_7294 = G__7315;
            chunk__7286_7295 = G__7316;
            count__7287_7296 = G__7317;
            i__7288_7297 = G__7318;
            continue
          }
        }else {
        }
      }
      break
    }
    return elem_sel
  };
  var listen_once_BANG_ = function(elem_sel, var_args) {
    var type_fs = null;
    if(arguments.length > 1) {
      type_fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return listen_once_BANG___delegate.call(this, elem_sel, type_fs)
  };
  listen_once_BANG_.cljs$lang$maxFixedArity = 1;
  listen_once_BANG_.cljs$lang$applyTo = function(arglist__7319) {
    var elem_sel = cljs.core.first(arglist__7319);
    var type_fs = cljs.core.rest(arglist__7319);
    return listen_once_BANG___delegate(elem_sel, type_fs)
  };
  listen_once_BANG_.cljs$core$IFn$_invoke$arity$variadic = listen_once_BANG___delegate;
  return listen_once_BANG_
}();
dommy.core.fire_BANG_ = function() {
  var fire_BANG___delegate = function(node, event_type, p__7320) {
    var vec__7322 = p__7320;
    var update_event_BANG_ = cljs.core.nth.call(null, vec__7322, 0, null);
    if(dommy.core.descendant_QMARK_.call(null, node, document.documentElement)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.list(new cljs.core.Symbol(null, "descendant?", "descendant?", -1886221157, null), new cljs.core.Symbol(null, "node", "node", -1637144645, null), new cljs.core.Symbol("js", "document.documentElement", "js/document.documentElement", -1449696112, null))))].join(""));
    }
    var update_event_BANG___$1 = function() {
      var or__3943__auto__ = update_event_BANG_;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return cljs.core.identity
      }
    }();
    if(cljs.core.truth_(document.createEvent)) {
      var event = document.createEvent("Event");
      event.initEvent(cljs.core.name.call(null, event_type), true, true);
      return node.dispatchEvent(update_event_BANG___$1.call(null, event))
    }else {
      return node.fireEvent([cljs.core.str("on"), cljs.core.str(cljs.core.name.call(null, event_type))].join(""), update_event_BANG___$1.call(null, document.createEventObject()))
    }
  };
  var fire_BANG_ = function(node, event_type, var_args) {
    var p__7320 = null;
    if(arguments.length > 2) {
      p__7320 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return fire_BANG___delegate.call(this, node, event_type, p__7320)
  };
  fire_BANG_.cljs$lang$maxFixedArity = 2;
  fire_BANG_.cljs$lang$applyTo = function(arglist__7323) {
    var node = cljs.core.first(arglist__7323);
    arglist__7323 = cljs.core.next(arglist__7323);
    var event_type = cljs.core.first(arglist__7323);
    var p__7320 = cljs.core.rest(arglist__7323);
    return fire_BANG___delegate(node, event_type, p__7320)
  };
  fire_BANG_.cljs$core$IFn$_invoke$arity$variadic = fire_BANG___delegate;
  return fire_BANG_
}();
goog.provide("flatride.core");
goog.require("cljs.core");
goog.require("flatride.utils");
goog.require("dommy.core");
goog.require("dommy.core");
goog.require("flatride.utils");
flatride.core.directions_config_obj = function directions_config_obj(from, to, mode) {
  var cfg_obj = {"origin":from, "destination":to, "provideRouteAlternatives":true};
  if(cljs.core._EQ_.call(null, new cljs.core.Keyword(null, "drive", "drive", 1109757180), mode)) {
    cfg_obj.travelMode = window.google.maps.DirectionsTravelMode.DRIVING
  }else {
    cfg_obj.travelMode = window.google.maps.DirectionsTravelMode.BICYCLING
  }
  return cfg_obj
};
flatride.core._STAR_compute_routes_args_STAR_ = null;
flatride.core.start_compute_routes = function start_compute_routes(from, to, display_route_fn, display_elev_fn, mode) {
  flatride.core._STAR_compute_routes_args_STAR_ = cljs.core.PersistentVector.fromArray([from, to, display_route_fn, display_elev_fn], true);
  var req_obj = flatride.core.directions_config_obj.call(null, from, to, mode);
  var ds = new window.google.maps.DirectionsService;
  return ds.route(req_obj, cljs.core.partial.call(null, flatride.core.process_routes, display_route_fn, display_elev_fn))
};
flatride.core.increasing_seqs = function increasing_seqs(coll) {
  return cljs.core.filter.call(null, function(p1__5814_SHARP_) {
    return cljs.core.count.call(null, p1__5814_SHARP_) > 1
  }, cljs.core.reductions.call(null, function(current_seq, next_elem) {
    if((new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, next_elem) + 2 >= (new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.last.call(null, current_seq))) {
      return cljs.core.conj.call(null, current_seq, next_elem)
    }else {
      return cljs.core.PersistentVector.fromArray([next_elem], true)
    }
  }, cljs.core.PersistentVector.fromArray([cljs.core.first.call(null, coll)], true), cljs.core.rest.call(null, coll)))
};
flatride.core.longest_seq = function longest_seq(seqs) {
  return cljs.core.reduce.call(null, function(p1__5815_SHARP_, p2__5816_SHARP_) {
    if(cljs.core.count.call(null, p1__5815_SHARP_) >= cljs.core.count.call(null, p2__5816_SHARP_)) {
      return p1__5815_SHARP_
    }else {
      return p2__5816_SHARP_
    }
  }, cljs.core.PersistentVector.EMPTY, seqs)
};
flatride.core.greatest_diff_seq = function greatest_diff_seq(seqs) {
  return cljs.core.apply.call(null, cljs.core.max_key, function(p1__5817_SHARP_) {
    return(new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.last.call(null, p1__5817_SHARP_)) - (new cljs.core.Keyword(null, "altitude", "altitude", 3050454548)).call(null, cljs.core.first.call(null, p1__5817_SHARP_))
  }, seqs)
};
flatride.core.process_elevation_data = function process_elevation_data(display_elev_fn, idx, elevation_data, status) {
  var elevations = cljs.core.map.call(null, function(p1__5818_SHARP_) {
    return p1__5818_SHARP_.elevation
  }, elevation_data);
  var coordinates = cljs.core.map.call(null, function(elevations) {
    return function(p1__5819_SHARP_) {
      return p1__5819_SHARP_.location
    }
  }(elevations), elevation_data);
  var elev_objs = function() {
    var iter__3584__auto__ = function(elevations, coordinates) {
      return function iter__5824(s__5825) {
        return new cljs.core.LazySeq(null, function(elevations, coordinates) {
          return function() {
            var s__5825__$1 = s__5825;
            while(true) {
              var temp__4092__auto__ = cljs.core.seq.call(null, s__5825__$1);
              if(temp__4092__auto__) {
                var s__5825__$2 = temp__4092__auto__;
                if(cljs.core.chunked_seq_QMARK_.call(null, s__5825__$2)) {
                  var c__3582__auto__ = cljs.core.chunk_first.call(null, s__5825__$2);
                  var size__3583__auto__ = cljs.core.count.call(null, c__3582__auto__);
                  var b__5827 = cljs.core.chunk_buffer.call(null, size__3583__auto__);
                  if(function() {
                    var i__5826 = 0;
                    while(true) {
                      if(i__5826 < size__3583__auto__) {
                        var idx__$1 = cljs.core._nth.call(null, c__3582__auto__, i__5826);
                        cljs.core.chunk_append.call(null, b__5827, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "altitude", "altitude", 3050454548), cljs.core.nth.call(null, elevations, idx__$1), new cljs.core.Keyword(null, "coordinates", "coordinates", 2885823853), cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "lat", "lat", 1014011153), cljs.core.nth.call(null, coordinates, idx__$1).lat(), new cljs.core.Keyword(null, "lng", "lng", 1014011543), cljs.core.nth.call(null, 
                        coordinates, idx__$1).lng()], true)], true));
                        var G__5828 = i__5826 + 1;
                        i__5826 = G__5828;
                        continue
                      }else {
                        return true
                      }
                      break
                    }
                  }()) {
                    return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__5827), iter__5824.call(null, cljs.core.chunk_rest.call(null, s__5825__$2)))
                  }else {
                    return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__5827), null)
                  }
                }else {
                  var idx__$1 = cljs.core.first.call(null, s__5825__$2);
                  return cljs.core.cons.call(null, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "altitude", "altitude", 3050454548), cljs.core.nth.call(null, elevations, idx__$1), new cljs.core.Keyword(null, "coordinates", "coordinates", 2885823853), cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "lat", "lat", 1014011153), cljs.core.nth.call(null, coordinates, idx__$1).lat(), new cljs.core.Keyword(null, "lng", "lng", 1014011543), cljs.core.nth.call(null, 
                  coordinates, idx__$1).lng()], true)], true), iter__5824.call(null, cljs.core.rest.call(null, s__5825__$2)))
                }
              }else {
                return null
              }
              break
            }
          }
        }(elevations, coordinates), null, null)
      }
    }(elevations, coordinates);
    return iter__3584__auto__.call(null, cljs.core.range.call(null, cljs.core.count.call(null, elevations)))
  }();
  var slopes = flatride.core.increasing_seqs.call(null, elev_objs);
  var longest_slope = flatride.core.longest_seq.call(null, slopes);
  var steepest_slope = flatride.core.greatest_diff_seq.call(null, slopes);
  return display_elev_fn.call(null, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "idx", "idx", 1014008367), idx, new cljs.core.Keyword(null, "longest-slope", "longest-slope", 3931696922), longest_slope, new cljs.core.Keyword(null, "steepest-slope", "steepest-slope", 3802984743), steepest_slope], true))
};
flatride.core.start_compute_elevation_data = function start_compute_elevation_data(route, idx, display_elev_fn) {
  var es = new window.google.maps.ElevationService;
  var path_req = {"path":route.overview_path, "samples":200};
  return es.getElevationAlongPath(path_req, cljs.core.partial.call(null, flatride.core.process_elevation_data, display_elev_fn, idx))
};
flatride.core.parse_route = function parse_route(route) {
  var route_info = cljs.core.nth.call(null, route.legs, 0);
  return cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "distance", "distance", 1302364007), route_info.distance.text, new cljs.core.Keyword(null, "duration", "duration", 3316859142), route_info.duration.text, new cljs.core.Keyword(null, "summary", "summary", 3451231E3), route.summary], true)
};
flatride.core.process_routes = function process_routes(display_route_fn, display_elev_fn, routes, status) {
  var num_routes = routes.routes.length;
  if(cljs.core._EQ_.call(null, num_routes, 0)) {
    return cljs.core.apply.call(null, flatride.core.start_compute_routes, cljs.core.conj.call(null, flatride.core._STAR_compute_routes_args_STAR_, new cljs.core.Keyword(null, "drive", "drive", 1109757180)))
  }else {
    var seq__5833_5837 = cljs.core.seq.call(null, cljs.core.range.call(null, routes.routes.length));
    var chunk__5834_5838 = null;
    var count__5835_5839 = 0;
    var i__5836_5840 = 0;
    while(true) {
      if(i__5836_5840 < count__5835_5839) {
        var idx_5841 = cljs.core._nth.call(null, chunk__5834_5838, i__5836_5840);
        flatride.core.start_compute_elevation_data.call(null, cljs.core.nth.call(null, routes.routes, idx_5841), idx_5841, display_elev_fn);
        var G__5842 = seq__5833_5837;
        var G__5843 = chunk__5834_5838;
        var G__5844 = count__5835_5839;
        var G__5845 = i__5836_5840 + 1;
        seq__5833_5837 = G__5842;
        chunk__5834_5838 = G__5843;
        count__5835_5839 = G__5844;
        i__5836_5840 = G__5845;
        continue
      }else {
        var temp__4092__auto___5846 = cljs.core.seq.call(null, seq__5833_5837);
        if(temp__4092__auto___5846) {
          var seq__5833_5847__$1 = temp__4092__auto___5846;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__5833_5847__$1)) {
            var c__3615__auto___5848 = cljs.core.chunk_first.call(null, seq__5833_5847__$1);
            var G__5849 = cljs.core.chunk_rest.call(null, seq__5833_5847__$1);
            var G__5850 = c__3615__auto___5848;
            var G__5851 = cljs.core.count.call(null, c__3615__auto___5848);
            var G__5852 = 0;
            seq__5833_5837 = G__5849;
            chunk__5834_5838 = G__5850;
            count__5835_5839 = G__5851;
            i__5836_5840 = G__5852;
            continue
          }else {
            var idx_5853 = cljs.core.first.call(null, seq__5833_5847__$1);
            flatride.core.start_compute_elevation_data.call(null, cljs.core.nth.call(null, routes.routes, idx_5853), idx_5853, display_elev_fn);
            var G__5854 = cljs.core.next.call(null, seq__5833_5847__$1);
            var G__5855 = null;
            var G__5856 = 0;
            var G__5857 = 0;
            seq__5833_5837 = G__5854;
            chunk__5834_5838 = G__5855;
            count__5835_5839 = G__5856;
            i__5836_5840 = G__5857;
            continue
          }
        }else {
        }
      }
      break
    }
    return display_route_fn.call(null, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "to-display", "to-display", 3718009570), routes, new cljs.core.Keyword(null, "routes-data", "routes-data", 4046023615), cljs.core.map.call(null, flatride.core.parse_route, routes.routes)], true))
  }
};
goog.provide("flatride.frontend");
goog.require("cljs.core");
goog.require("flatride.utils");
goog.require("dommy.core");
goog.require("dommy.core");
goog.require("goog.string.format");
goog.require("goog.string");
goog.require("goog.string");
goog.require("flatride.core");
goog.require("flatride.core");
goog.require("flatride.utils");
flatride.frontend.gautocomplete_from = null;
flatride.frontend.gautocomplete_to = null;
flatride.frontend._STAR_mapInstance_STAR_ = null;
flatride.frontend.map_config_obj = function map_config_obj(latlng) {
  return{"zoom":14, "mapTypeId":window.google.maps.MapTypeId.ROADMAP, "disableDefaultUI":true, "center":latlng}
};
flatride.frontend.stroke_colors = cljs.core.PersistentVector.fromArray(["red", "green", "blue", "yellow", "purple"], true);
flatride.frontend._STAR_directionDisplays_STAR_ = cljs.core.atom.call(null, cljs.core.PersistentVector.EMPTY);
flatride.frontend._STAR_counter_STAR_ = cljs.core.atom.call(null, 0);
flatride.frontend.display_routes = function display_routes(routes_data) {
  cljs.core.reset_BANG_.call(null, flatride.frontend._STAR_counter_STAR_, 0);
  var seq__5674_5700 = cljs.core.seq.call(null, (new cljs.core.Keyword(null, "routes-data", "routes-data", 4046023615)).call(null, routes_data));
  var chunk__5675_5701 = null;
  var count__5676_5702 = 0;
  var i__5677_5703 = 0;
  while(true) {
    if(i__5677_5703 < count__5676_5702) {
      var route_5704 = cljs.core._nth.call(null, chunk__5675_5701, i__5677_5703);
      dommy.core.append_BANG_.call(null, document.getElementById("div-routes-display"), function() {
        var dom5678 = document.createElement("div");
        dom5678.className = "route-data";
        if(cljs.core.truth_(flatride.frontend.stroke_colors.call(null, cljs.core.deref.call(null, flatride.frontend._STAR_counter_STAR_)))) {
          dom5678.setAttribute("data-color", flatride.frontend.stroke_colors.call(null, cljs.core.deref.call(null, flatride.frontend._STAR_counter_STAR_)))
        }else {
        }
        dom5678.appendChild(function() {
          var dom5679 = document.createElement("ul");
          dom5679.className = "route-card";
          dom5679.appendChild(function() {
            var dom5680 = document.createElement("li");
            dom5680.className = "card-title";
            dom5680.appendChild(function() {
              var dom5681 = document.createElement("img");
              if("img/distance.png") {
                dom5681.setAttribute("src", "img/distance.png")
              }else {
              }
              if("icon-distance") {
                dom5681.className = [cljs.core.str(dom5681.className), cljs.core.str(" "), cljs.core.str("icon-distance")].join("").trim()
              }else {
              }
              return dom5681
            }());
            dom5680.appendChild(dommy.template.__GT_node_like.call(null, (new cljs.core.Keyword(null, "distance", "distance", 1302364007)).call(null, route_5704)));
            dom5680.appendChild(function() {
              var dom5682 = document.createElement("br");
              return dom5682
            }());
            dom5680.appendChild(function() {
              var dom5683 = document.createElement("img");
              if("img/time.svg") {
                dom5683.setAttribute("src", "img/time.svg")
              }else {
              }
              if("icon-time") {
                dom5683.className = [cljs.core.str(dom5683.className), cljs.core.str(" "), cljs.core.str("icon-time")].join("").trim()
              }else {
              }
              return dom5683
            }());
            dom5680.appendChild(dommy.template.__GT_node_like.call(null, (new cljs.core.Keyword(null, "duration", "duration", 3316859142)).call(null, route_5704)));
            dom5680.appendChild(function() {
              var dom5684 = document.createElement("br");
              return dom5684
            }());
            return dom5680
          }());
          dom5679.appendChild(function() {
            var dom5685 = document.createElement("small");
            dom5685.appendChild(document.createTextNode(" via "));
            dom5685.appendChild(dommy.template.__GT_node_like.call(null, (new cljs.core.Keyword(null, "summary", "summary", 3451231E3)).call(null, route_5704)));
            return dom5685
          }());
          dom5679.appendChild(function() {
            var dom5686 = document.createElement("hr");
            return dom5686
          }());
          return dom5679
        }());
        return dom5678
      }());
      cljs.core.swap_BANG_.call(null, flatride.frontend._STAR_counter_STAR_, cljs.core.inc);
      var G__5705 = seq__5674_5700;
      var G__5706 = chunk__5675_5701;
      var G__5707 = count__5676_5702;
      var G__5708 = i__5677_5703 + 1;
      seq__5674_5700 = G__5705;
      chunk__5675_5701 = G__5706;
      count__5676_5702 = G__5707;
      i__5677_5703 = G__5708;
      continue
    }else {
      var temp__4092__auto___5709 = cljs.core.seq.call(null, seq__5674_5700);
      if(temp__4092__auto___5709) {
        var seq__5674_5710__$1 = temp__4092__auto___5709;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5674_5710__$1)) {
          var c__3615__auto___5711 = cljs.core.chunk_first.call(null, seq__5674_5710__$1);
          var G__5712 = cljs.core.chunk_rest.call(null, seq__5674_5710__$1);
          var G__5713 = c__3615__auto___5711;
          var G__5714 = cljs.core.count.call(null, c__3615__auto___5711);
          var G__5715 = 0;
          seq__5674_5700 = G__5712;
          chunk__5675_5701 = G__5713;
          count__5676_5702 = G__5714;
          i__5677_5703 = G__5715;
          continue
        }else {
          var route_5716 = cljs.core.first.call(null, seq__5674_5710__$1);
          dommy.core.append_BANG_.call(null, document.getElementById("div-routes-display"), function() {
            var dom5687 = document.createElement("div");
            dom5687.className = "route-data";
            if(cljs.core.truth_(flatride.frontend.stroke_colors.call(null, cljs.core.deref.call(null, flatride.frontend._STAR_counter_STAR_)))) {
              dom5687.setAttribute("data-color", flatride.frontend.stroke_colors.call(null, cljs.core.deref.call(null, flatride.frontend._STAR_counter_STAR_)))
            }else {
            }
            dom5687.appendChild(function() {
              var dom5688 = document.createElement("ul");
              dom5688.className = "route-card";
              dom5688.appendChild(function() {
                var dom5689 = document.createElement("li");
                dom5689.className = "card-title";
                dom5689.appendChild(function() {
                  var dom5690 = document.createElement("img");
                  if("img/distance.png") {
                    dom5690.setAttribute("src", "img/distance.png")
                  }else {
                  }
                  if("icon-distance") {
                    dom5690.className = [cljs.core.str(dom5690.className), cljs.core.str(" "), cljs.core.str("icon-distance")].join("").trim()
                  }else {
                  }
                  return dom5690
                }());
                dom5689.appendChild(dommy.template.__GT_node_like.call(null, (new cljs.core.Keyword(null, "distance", "distance", 1302364007)).call(null, route_5716)));
                dom5689.appendChild(function() {
                  var dom5691 = document.createElement("br");
                  return dom5691
                }());
                dom5689.appendChild(function() {
                  var dom5692 = document.createElement("img");
                  if("img/time.svg") {
                    dom5692.setAttribute("src", "img/time.svg")
                  }else {
                  }
                  if("icon-time") {
                    dom5692.className = [cljs.core.str(dom5692.className), cljs.core.str(" "), cljs.core.str("icon-time")].join("").trim()
                  }else {
                  }
                  return dom5692
                }());
                dom5689.appendChild(dommy.template.__GT_node_like.call(null, (new cljs.core.Keyword(null, "duration", "duration", 3316859142)).call(null, route_5716)));
                dom5689.appendChild(function() {
                  var dom5693 = document.createElement("br");
                  return dom5693
                }());
                return dom5689
              }());
              dom5688.appendChild(function() {
                var dom5694 = document.createElement("small");
                dom5694.appendChild(document.createTextNode(" via "));
                dom5694.appendChild(dommy.template.__GT_node_like.call(null, (new cljs.core.Keyword(null, "summary", "summary", 3451231E3)).call(null, route_5716)));
                return dom5694
              }());
              dom5688.appendChild(function() {
                var dom5695 = document.createElement("hr");
                return dom5695
              }());
              return dom5688
            }());
            return dom5687
          }());
          cljs.core.swap_BANG_.call(null, flatride.frontend._STAR_counter_STAR_, cljs.core.inc);
          var G__5717 = cljs.core.next.call(null, seq__5674_5710__$1);
          var G__5718 = null;
          var G__5719 = 0;
          var G__5720 = 0;
          seq__5674_5700 = G__5717;
          chunk__5675_5701 = G__5718;
          count__5676_5702 = G__5719;
          i__5677_5703 = G__5720;
          continue
        }
      }else {
      }
    }
    break
  }
  var seq__5696 = cljs.core.seq.call(null, cljs.core.range.call(null, (new cljs.core.Keyword(null, "to-display", "to-display", 3718009570)).call(null, routes_data).routes.length));
  var chunk__5697 = null;
  var count__5698 = 0;
  var i__5699 = 0;
  while(true) {
    if(i__5699 < count__5698) {
      var idx = cljs.core._nth.call(null, chunk__5697, i__5699);
      var directionsDisplay_5721 = new window.google.maps.DirectionsRenderer({"polylineOptions":{"strokeColor":flatride.frontend.stroke_colors.call(null, idx)}});
      directionsDisplay_5721.setMap(flatride.frontend._STAR_mapInstance_STAR_);
      directionsDisplay_5721.setDirections((new cljs.core.Keyword(null, "to-display", "to-display", 3718009570)).call(null, routes_data));
      directionsDisplay_5721.setRouteIndex(idx);
      cljs.core.swap_BANG_.call(null, flatride.frontend._STAR_directionDisplays_STAR_, cljs.core.conj, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "idx", "idx", 1014008367), idx, new cljs.core.Keyword(null, "obj", "obj", 1014014057), directionsDisplay_5721], true));
      var G__5722 = seq__5696;
      var G__5723 = chunk__5697;
      var G__5724 = count__5698;
      var G__5725 = i__5699 + 1;
      seq__5696 = G__5722;
      chunk__5697 = G__5723;
      count__5698 = G__5724;
      i__5699 = G__5725;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq.call(null, seq__5696);
      if(temp__4092__auto__) {
        var seq__5696__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, seq__5696__$1)) {
          var c__3615__auto__ = cljs.core.chunk_first.call(null, seq__5696__$1);
          var G__5726 = cljs.core.chunk_rest.call(null, seq__5696__$1);
          var G__5727 = c__3615__auto__;
          var G__5728 = cljs.core.count.call(null, c__3615__auto__);
          var G__5729 = 0;
          seq__5696 = G__5726;
          chunk__5697 = G__5727;
          count__5698 = G__5728;
          i__5699 = G__5729;
          continue
        }else {
          var idx = cljs.core.first.call(null, seq__5696__$1);
          var directionsDisplay_5730 = new window.google.maps.DirectionsRenderer({"polylineOptions":{"strokeColor":flatride.frontend.stroke_colors.call(null, idx)}});
          directionsDisplay_5730.setMap(flatride.frontend._STAR_mapInstance_STAR_);
          directionsDisplay_5730.setDirections((new cljs.core.Keyword(null, "to-display", "to-display", 3718009570)).call(null, routes_data));
          directionsDisplay_5730.setRouteIndex(idx);
          cljs.core.swap_BANG_.call(null, flatride.frontend._STAR_directionDisplays_STAR_, cljs.core.conj, cljs.core.PersistentArrayMap.fromArray([new cljs.core.Keyword(null, "idx", "idx", 1014008367), idx, new cljs.core.Keyword(null, "obj", "obj", 1014014057), directionsDisplay_5730], true));
          var G__5731 = cljs.core.next.call(null, seq__5696__$1);
          var G__5732 = null;
          var G__5733 = 0;
          var G__5734 = 0;
          seq__5696 = G__5731;
          chunk__5697 = G__5732;
          count__5698 = G__5733;
          i__5699 = G__5734;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
flatride.frontend.select_route = function select_route(idx, evt) {
  if(cljs.core.count.call(null, cljs.core.deref.call(null, flatride.frontend._STAR_directionDisplays_STAR_)) > 1) {
    var obsolete_displays = cljs.core.map.call(null, function(p1__5735_SHARP_) {
      return(new cljs.core.Keyword(null, "obj", "obj", 1014014057)).call(null, p1__5735_SHARP_)
    }, cljs.core.filter.call(null, function(p1__5736_SHARP_) {
      return cljs.core.not_EQ_.call(null, (new cljs.core.Keyword(null, "idx", "idx", 1014008367)).call(null, p1__5736_SHARP_), idx)
    }, cljs.core.deref.call(null, flatride.frontend._STAR_directionDisplays_STAR_)));
    var seq__5746_5754 = cljs.core.seq.call(null, cljs.core.range.call(null, cljs.core.count.call(null, cljs.core.deref.call(null, flatride.frontend._STAR_directionDisplays_STAR_))));
    var chunk__5747_5755 = null;
    var count__5748_5756 = 0;
    var i__5749_5757 = 0;
    while(true) {
      if(i__5749_5757 < count__5748_5756) {
        var loop_idx_5758 = cljs.core._nth.call(null, chunk__5747_5755, i__5749_5757);
        if(cljs.core._EQ_.call(null, idx, loop_idx_5758)) {
        }else {
          var div_5759 = document.querySelector(dommy.core.selector.call(null, cljs.core.keyword.call(null, [cljs.core.str("#route-"), cljs.core.str(loop_idx_5758)].join(""))));
          dommy.core.add_class_BANG_.call(null, div_5759, "fade-out")
        }
        var G__5760 = seq__5746_5754;
        var G__5761 = chunk__5747_5755;
        var G__5762 = count__5748_5756;
        var G__5763 = i__5749_5757 + 1;
        seq__5746_5754 = G__5760;
        chunk__5747_5755 = G__5761;
        count__5748_5756 = G__5762;
        i__5749_5757 = G__5763;
        continue
      }else {
        var temp__4092__auto___5764 = cljs.core.seq.call(null, seq__5746_5754);
        if(temp__4092__auto___5764) {
          var seq__5746_5765__$1 = temp__4092__auto___5764;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__5746_5765__$1)) {
            var c__3615__auto___5766 = cljs.core.chunk_first.call(null, seq__5746_5765__$1);
            var G__5767 = cljs.core.chunk_rest.call(null, seq__5746_5765__$1);
            var G__5768 = c__3615__auto___5766;
            var G__5769 = cljs.core.count.call(null, c__3615__auto___5766);
            var G__5770 = 0;
            seq__5746_5754 = G__5767;
            chunk__5747_5755 = G__5768;
            count__5748_5756 = G__5769;
            i__5749_5757 = G__5770;
            continue
          }else {
            var loop_idx_5771 = cljs.core.first.call(null, seq__5746_5765__$1);
            if(cljs.core._EQ_.call(null, idx, loop_idx_5771)) {
            }else {
              var div_5772 = document.querySelector(dommy.core.selector.call(null, cljs.core.keyword.call(null, [cljs.core.str("#route-"), cljs.core.str(loop_idx_5771)].join(""))));
              dommy.core.add_class_BANG_.call(null, div_5772, "fade-out")
            }
            var G__5773 = cljs.core.next.call(null, seq__5746_5765__$1);
            var G__5774 = null;
            var G__5775 = 0;
            var G__5776 = 0;
            seq__5746_5754 = G__5773;
            chunk__5747_5755 = G__5774;
            count__5748_5756 = G__5775;
            i__5749_5757 = G__5776;
            continue
          }
        }else {
        }
      }
      break
    }
    var seq__5750_5777 = cljs.core.seq.call(null, obsolete_displays);
    var chunk__5751_5778 = null;
    var count__5752_5779 = 0;
    var i__5753_5780 = 0;
    while(true) {
      if(i__5753_5780 < count__5752_5779) {
        var display_5781 = cljs.core._nth.call(null, chunk__5751_5778, i__5753_5780);
        display_5781.setMap(null);
        var G__5782 = seq__5750_5777;
        var G__5783 = chunk__5751_5778;
        var G__5784 = count__5752_5779;
        var G__5785 = i__5753_5780 + 1;
        seq__5750_5777 = G__5782;
        chunk__5751_5778 = G__5783;
        count__5752_5779 = G__5784;
        i__5753_5780 = G__5785;
        continue
      }else {
        var temp__4092__auto___5786 = cljs.core.seq.call(null, seq__5750_5777);
        if(temp__4092__auto___5786) {
          var seq__5750_5787__$1 = temp__4092__auto___5786;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__5750_5787__$1)) {
            var c__3615__auto___5788 = cljs.core.chunk_first.call(null, seq__5750_5787__$1);
            var G__5789 = cljs.core.chunk_rest.call(null, seq__5750_5787__$1);
            var G__5790 = c__3615__auto___5788;
            var G__5791 = cljs.core.count.call(null, c__3615__auto___5788);
            var G__5792 = 0;
            seq__5750_5777 = G__5789;
            chunk__5751_5778 = G__5790;
            count__5752_5779 = G__5791;
            i__5753_5780 = G__5792;
            continue
          }else {
            var display_5793 = cljs.core.first.call(null, seq__5750_5787__$1);
            display_5793.setMap(null);
            var G__5794 = cljs.core.next.call(null, seq__5750_5787__$1);
            var G__5795 = null;
            var G__5796 = 0;
            var G__5797 = 0;
            seq__5750_5777 = G__5794;
            chunk__5751_5778 = G__5795;
            count__5752_5779 = G__5796;
            i__5753_5780 = G__5797;
            continue
          }
        }else {
        }
      }
      break
    }
    return cljs.core.swap_BANG_.call(null, flatride.frontend._STAR_directionDisplays_STAR_, cljs.core.partial.call(null, cljs.core.remove, function(p1__5737_SHARP_) {
      return cljs.core._EQ_.call(null, (new cljs.core.Keyword(null, "idx", "idx", 1014008367)).call(null, p1__5737_SHARP_), idx)
    }))
  }else {
    return null
  }
};
flatride.frontend.display_elevations = function display_elevations(p__5798) {
  var map__5802 = p__5798;
  var map__5802__$1 = cljs.core.seq_QMARK_.call(null, map__5802) ? cljs.core.apply.call(null, cljs.core.hash_map, map__5802) : map__5802;
  var idx = cljs.core.get.call(null, map__5802__$1, new cljs.core.Keyword(null, "idx", "idx", 1014008367));
  var longest_slope = cljs.core.get.call(null, map__5802__$1, new cljs.core.Keyword(null, "longest-slope", "longest-slope", 3931696922));
  var steepest_slope = cljs.core.get.call(null, map__5802__$1, new cljs.core.Keyword(null, "steepest-slope", "steepest-slope", 3802984743));
  var div_5805 = cljs.core.nth.call(null, dommy.utils.__GT_Array.call(null, document.querySelectorAll("div.route-data")), idx);
  dommy.core.set_attr_BANG_.call(null, div_5805, "id", [cljs.core.str("route-"), cljs.core.str(idx)].join(""));
  dommy.core.listen_BANG_.call(null, div_5805, new cljs.core.Keyword(null, "click", "click", 1108654330), cljs.core.partial.call(null, flatride.frontend.select_route, idx));
  var ul = cljs.core.nth.call(null, dommy.utils.__GT_Array.call(null, document.querySelectorAll("ul.route-card")), idx);
  dommy.core.append_BANG_.call(null, ul, function() {
    var dom5803 = document.createElement("li");
    dom5803.appendChild(document.createTextNode("The longest slope is "));
    dom5803.appendChild(dommy.template.__GT_node_like.call(null, goog.string.format("%.2f%%", flatride.utils.slope_percent.call(null, longest_slope))));
    dom5803.appendChild(document.createTextNode(" for a distance of "));
    dom5803.appendChild(dommy.template.__GT_node_like.call(null, goog.string.format("%.2f", flatride.utils.slope_total_distance.call(null, longest_slope))));
    dom5803.appendChild(document.createTextNode("km"));
    return dom5803
  }());
  return dommy.core.append_BANG_.call(null, ul, function() {
    var dom5804 = document.createElement("li");
    dom5804.appendChild(document.createTextNode("The steepest slope is "));
    dom5804.appendChild(dommy.template.__GT_node_like.call(null, goog.string.format("%.2f%%", flatride.utils.slope_percent.call(null, steepest_slope))));
    dom5804.appendChild(document.createTextNode(" for a distance of "));
    dom5804.appendChild(dommy.template.__GT_node_like.call(null, goog.string.format("%.2f", flatride.utils.slope_total_distance.call(null, steepest_slope))));
    dom5804.appendChild(document.createTextNode("km"));
    return dom5804
  }())
};
flatride.frontend.get_routes = function get_routes() {
  dommy.core.add_class_BANG_.call(null, dommy.utils.__GT_Array.call(null, document.getElementsByTagName("header"))[0], "toggle-header");
  var from = dommy.core.value.call(null, document.getElementById("input-from"));
  var to = dommy.core.value.call(null, document.getElementById("input-to"));
  cljs.core.doall.call(null, cljs.core.map.call(null, dommy.core.remove_BANG_, dommy.utils.__GT_Array.call(null, document.querySelectorAll("div.route-data"))));
  return flatride.core.start_compute_routes.call(null, from, to, flatride.frontend.display_routes, flatride.frontend.display_elevations, new cljs.core.Keyword(null, "bike", "bike", 1016928083))
};
flatride.frontend.init_autocomplete = function init_autocomplete() {
  flatride.frontend.gautocomplete_from = new window.google.maps.places.Autocomplete(document.getElementById("input-from"));
  return flatride.frontend.gautocomplete_to = new window.google.maps.places.Autocomplete(document.getElementById("input-to"))
};
flatride.frontend.fill_from_field = function fill_from_field(results, status) {
  if(cljs.core._EQ_.call(null, status, window.google.maps.GeocoderStatus.OK)) {
    return dommy.core.set_value_BANG_.call(null, document.getElementById("input-from"), cljs.core.nth.call(null, results, 1).formatted_address)
  }else {
    return dommy.core.set_value_BANG_.call(null, document.getElementById("input-from"), "Type in your location")
  }
};
flatride.frontend.reverse_geocode = function reverse_geocode(coords) {
  var lat = coords.coords.latitude;
  var lng = coords.coords.longitude;
  var geocoder = new window.google.maps.Geocoder;
  var latlng = new window.google.maps.LatLng(lat, lng);
  flatride.frontend._STAR_mapInstance_STAR_ = new window.google.maps.Map(document.getElementById("div-map-canvas"), flatride.frontend.map_config_obj.call(null, latlng));
  return geocoder.geocode({"latLng":latlng}, flatride.frontend.fill_from_field)
};
flatride.frontend.get_position_error = function get_position_error(code) {
  return flatride.frontend._STAR_mapInstance_STAR_ = new window.google.maps.Map(document.getElementById("div-map-canvas"), {"zoom":14, "mapTypeId":window.google.maps.MapTypeId.ROADMAP, "disableDefaultUI":true, "center":new window.google.maps.LatLng(64.135, -21.919)})
};
flatride.frontend.init_current_position = function init_current_position() {
  return navigator.geolocation.getCurrentPosition(flatride.frontend.reverse_geocode, flatride.frontend.get_position_error)
};
flatride.frontend.hide_header_bar = function hide_header_bar(e) {
  dommy.core.set_value_BANG_.call(null, function() {
    var or__3943__auto__ = e.target;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return e.srcElement
    }
  }(), "");
  return dommy.core.add_class_BANG_.call(null, dommy.utils.__GT_Array.call(null, document.getElementsByTagName("header"))[0], "toggle-header")
};
flatride.frontend.init = function init() {
  flatride.frontend.init_autocomplete.call(null);
  dommy.core.listen_BANG_.call(null, document.getElementById("button-submit"), new cljs.core.Keyword(null, "click", "click", 1108654330), flatride.frontend.get_routes);
  flatride.frontend.init_current_position.call(null);
  dommy.core.listen_BANG_.call(null, document.getElementById("input-from"), new cljs.core.Keyword(null, "focus", "focus", 1111509066), flatride.frontend.hide_header_bar);
  return dommy.core.listen_BANG_.call(null, document.getElementById("input-to"), new cljs.core.Keyword(null, "focus", "focus", 1111509066), flatride.frontend.hide_header_bar)
};
window.onload = flatride.frontend.init;
