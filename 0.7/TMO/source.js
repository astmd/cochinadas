(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var decode_codepoint_1 = __importDefault(require("./decode_codepoint"));
var strictEntityRe = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
exports.decodeXML = getStrictDecoder(xml_json_1.default);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
function getStrictDecoder(map) {
    var replace = getReplacer(map);
    return function (str) { return String(str).replace(strictEntityRe, replace); };
}
var sorter = function (a, b) { return (a < b ? 1 : -1); };
exports.decodeHTML = (function () {
    var legacy = Object.keys(legacy_json_1.default).sort(sorter);
    var keys = Object.keys(entities_json_1.default).sort(sorter);
    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        }
        else {
            keys[i] += ";";
        }
    }
    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
    var replace = getReplacer(entities_json_1.default);
    function replacer(str) {
        if (str.substr(-1) !== ";")
            str += ";";
        return replace(str);
    }
    // TODO consider creating a merged map
    return function (str) { return String(str).replace(re, replacer); };
})();
function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            var secondChar = str.charAt(2);
            if (secondChar === "X" || secondChar === "x") {
                return decode_codepoint_1.default(parseInt(str.substr(3), 16));
            }
            return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return map[str.slice(1, -1)] || str;
    };
}

},{"./decode_codepoint":3,"./maps/entities.json":7,"./maps/legacy.json":8,"./maps/xml.json":9}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_json_1 = __importDefault(require("./maps/decode.json"));
// Adapted from https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
var fromCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.fromCodePoint ||
    function (codePoint) {
        var output = "";
        if (codePoint > 0xffff) {
            codePoint -= 0x10000;
            output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
            codePoint = 0xdc00 | (codePoint & 0x3ff);
        }
        output += String.fromCharCode(codePoint);
        return output;
    };
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }
    if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
    }
    return fromCodePoint(codePoint);
}
exports.default = decodeCodePoint;

},{"./maps/decode.json":6}],4:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var inverseXML = getInverseObj(xml_json_1.default);
var xmlReplacer = getInverseReplacer(inverseXML);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using XML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeXML = getASCIIEncoder(inverseXML);
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var inverseHTML = getInverseObj(entities_json_1.default);
var htmlReplacer = getInverseReplacer(inverseHTML);
/**
 * Encodes all entities and non-ASCII characters in the input.
 *
 * This includes characters that are valid ASCII characters in HTML documents.
 * For example `#` will be encoded as `&num;`. To get a more compact output,
 * consider using the `encodeNonAsciiHTML` function.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
/**
 * Encodes all non-ASCII characters, as well as characters not valid in HTML
 * documents using HTML entities.
 *
 * If a character has no equivalent entity, a
 * numeric hexadecimal reference (eg. `&#xfc;`) will be used.
 */
exports.encodeNonAsciiHTML = getASCIIEncoder(inverseHTML);
function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
    }, {});
}
function getInverseReplacer(inverse) {
    var single = [];
    var multiple = [];
    for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
            // Add value to single array
            single.push("\\" + k);
        }
        else {
            // Add value to multiple array
            multiple.push(k);
        }
    }
    // Add ranges to single characters.
    single.sort();
    for (var start = 0; start < single.length - 1; start++) {
        // Find the end of a run of characters
        var end = start;
        while (end < single.length - 1 &&
            single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
            end += 1;
        }
        var count = 1 + end - start;
        // We want to replace at least three characters
        if (count < 3)
            continue;
        single.splice(start, count, single[start] + "-" + single[end]);
    }
    multiple.unshift("[" + single.join("") + "]");
    return new RegExp(multiple.join("|"), "g");
}
// /[^\0-\x7F]/gu
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
var getCodePoint = 
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
String.prototype.codePointAt != null
    ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        function (str) { return str.codePointAt(0); }
    : // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        function (c) {
            return (c.charCodeAt(0) - 0xd800) * 0x400 +
                c.charCodeAt(1) -
                0xdc00 +
                0x10000;
        };
function singleCharReplacer(c) {
    return "&#x" + (c.length > 1 ? getCodePoint(c) : c.charCodeAt(0))
        .toString(16)
        .toUpperCase() + ";";
}
function getInverse(inverse, re) {
    return function (data) {
        return data
            .replace(re, function (name) { return inverse[name]; })
            .replace(reNonASCII, singleCharReplacer);
    };
}
var reEscapeChars = new RegExp(xmlReplacer.source + "|" + reNonASCII.source, "g");
/**
 * Encodes all non-ASCII characters, as well as characters not valid in XML
 * documents using numeric hexadecimal reference (eg. `&#xfc;`).
 *
 * Have a look at `escapeUTF8` if you want a more concise output at the expense
 * of reduced transportability.
 *
 * @param data String to escape.
 */
function escape(data) {
    return data.replace(reEscapeChars, singleCharReplacer);
}
exports.escape = escape;
/**
 * Encodes all characters not valid in XML documents using numeric hexadecimal
 * reference (eg. `&#xfc;`).
 *
 * Note that the output will be character-set dependent.
 *
 * @param data String to escape.
 */
function escapeUTF8(data) {
    return data.replace(xmlReplacer, singleCharReplacer);
}
exports.escapeUTF8 = escapeUTF8;
function getASCIIEncoder(obj) {
    return function (data) {
        return data.replace(reEscapeChars, function (c) { return obj[c] || singleCharReplacer(c); });
    };
}

},{"./maps/entities.json":7,"./maps/xml.json":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeXMLStrict = exports.decodeHTML5Strict = exports.decodeHTML4Strict = exports.decodeHTML5 = exports.decodeHTML4 = exports.decodeHTMLStrict = exports.decodeHTML = exports.decodeXML = exports.encodeHTML5 = exports.encodeHTML4 = exports.escapeUTF8 = exports.escape = exports.encodeNonAsciiHTML = exports.encodeHTML = exports.encodeXML = exports.encode = exports.decodeStrict = exports.decode = void 0;
var decode_1 = require("./decode");
var encode_1 = require("./encode");
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeXML` or `decodeHTML` directly.
 */
function decode(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `decodeHTMLStrict` or `decodeXML` directly.
 */
function decodeStrict(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 * @deprecated Use `encodeHTML`, `encodeXML` or `encodeNonAsciiHTML` directly.
 */
function encode(data, level) {
    return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
}
exports.encode = encode;
var encode_2 = require("./encode");
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeNonAsciiHTML", { enumerable: true, get: function () { return encode_2.encodeNonAsciiHTML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
Object.defineProperty(exports, "escapeUTF8", { enumerable: true, get: function () { return encode_2.escapeUTF8; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
var decode_2 = require("./decode");
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
// Legacy aliases (deprecated)
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });

},{"./decode":2,"./encode":4}],6:[function(require,module,exports){
module.exports={"0":65533,"128":8364,"130":8218,"131":402,"132":8222,"133":8230,"134":8224,"135":8225,"136":710,"137":8240,"138":352,"139":8249,"140":338,"142":381,"145":8216,"146":8217,"147":8220,"148":8221,"149":8226,"150":8211,"151":8212,"152":732,"153":8482,"154":353,"155":8250,"156":339,"158":382,"159":376}

},{}],7:[function(require,module,exports){
module.exports={"Aacute":"Á","aacute":"á","Abreve":"?","abreve":"?","ac":"?","acd":"?","acE":"??","Acirc":"Â","acirc":"â","acute":"´","Acy":"?","acy":"?","AElig":"Æ","aelig":"æ","af":"?","Afr":"??","afr":"??","Agrave":"À","agrave":"à","alefsym":"?","aleph":"?","Alpha":"?","alpha":"?","Amacr":"?","amacr":"?","amalg":"?","amp":"&","AMP":"&","andand":"?","And":"?","and":"?","andd":"?","andslope":"?","andv":"?","ang":"?","ange":"?","angle":"?","angmsdaa":"?","angmsdab":"?","angmsdac":"?","angmsdad":"?","angmsdae":"?","angmsdaf":"?","angmsdag":"?","angmsdah":"?","angmsd":"?","angrt":"?","angrtvb":"?","angrtvbd":"?","angsph":"?","angst":"Å","angzarr":"?","Aogon":"?","aogon":"?","Aopf":"??","aopf":"??","apacir":"?","ap":"?","apE":"?","ape":"?","apid":"?","apos":"'","ApplyFunction":"?","approx":"?","approxeq":"?","Aring":"Å","aring":"å","Ascr":"??","ascr":"??","Assign":"?","ast":"*","asymp":"?","asympeq":"?","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","awconint":"?","awint":"?","backcong":"?","backepsilon":"?","backprime":"?","backsim":"?","backsimeq":"?","Backslash":"?","Barv":"?","barvee":"?","barwed":"?","Barwed":"?","barwedge":"?","bbrk":"?","bbrktbrk":"?","bcong":"?","Bcy":"?","bcy":"?","bdquo":"„","becaus":"?","because":"?","Because":"?","bemptyv":"?","bepsi":"?","bernou":"?","Bernoullis":"?","Beta":"?","beta":"?","beth":"?","between":"?","Bfr":"??","bfr":"??","bigcap":"?","bigcirc":"?","bigcup":"?","bigodot":"?","bigoplus":"?","bigotimes":"?","bigsqcup":"?","bigstar":"?","bigtriangledown":"?","bigtriangleup":"?","biguplus":"?","bigvee":"?","bigwedge":"?","bkarow":"?","blacklozenge":"?","blacksquare":"?","blacktriangle":"?","blacktriangledown":"?","blacktriangleleft":"?","blacktriangleright":"?","blank":"?","blk12":"?","blk14":"?","blk34":"?","block":"?","bne":"=?","bnequiv":"??","bNot":"?","bnot":"?","Bopf":"??","bopf":"??","bot":"?","bottom":"?","bowtie":"?","boxbox":"?","boxdl":"?","boxdL":"?","boxDl":"?","boxDL":"?","boxdr":"?","boxdR":"?","boxDr":"?","boxDR":"?","boxh":"?","boxH":"?","boxhd":"?","boxHd":"?","boxhD":"?","boxHD":"?","boxhu":"?","boxHu":"?","boxhU":"?","boxHU":"?","boxminus":"?","boxplus":"?","boxtimes":"?","boxul":"?","boxuL":"?","boxUl":"?","boxUL":"?","boxur":"?","boxuR":"?","boxUr":"?","boxUR":"?","boxv":"?","boxV":"?","boxvh":"?","boxvH":"?","boxVh":"?","boxVH":"?","boxvl":"?","boxvL":"?","boxVl":"?","boxVL":"?","boxvr":"?","boxvR":"?","boxVr":"?","boxVR":"?","bprime":"?","breve":"?","Breve":"?","brvbar":"¦","bscr":"??","Bscr":"?","bsemi":"?","bsim":"?","bsime":"?","bsolb":"?","bsol":"\\","bsolhsub":"?","bull":"•","bullet":"•","bump":"?","bumpE":"?","bumpe":"?","Bumpeq":"?","bumpeq":"?","Cacute":"?","cacute":"?","capand":"?","capbrcup":"?","capcap":"?","cap":"?","Cap":"?","capcup":"?","capdot":"?","CapitalDifferentialD":"?","caps":"??","caret":"?","caron":"?","Cayleys":"?","ccaps":"?","Ccaron":"?","ccaron":"?","Ccedil":"Ç","ccedil":"ç","Ccirc":"?","ccirc":"?","Cconint":"?","ccups":"?","ccupssm":"?","Cdot":"?","cdot":"?","cedil":"¸","Cedilla":"¸","cemptyv":"?","cent":"¢","centerdot":"·","CenterDot":"·","cfr":"??","Cfr":"?","CHcy":"?","chcy":"?","check":"?","checkmark":"?","Chi":"?","chi":"?","circ":"ˆ","circeq":"?","circlearrowleft":"?","circlearrowright":"?","circledast":"?","circledcirc":"?","circleddash":"?","CircleDot":"?","circledR":"®","circledS":"?","CircleMinus":"?","CirclePlus":"?","CircleTimes":"?","cir":"?","cirE":"?","cire":"?","cirfnint":"?","cirmid":"?","cirscir":"?","ClockwiseContourIntegral":"?","CloseCurlyDoubleQuote":"”","CloseCurlyQuote":"’","clubs":"?","clubsuit":"?","colon":":","Colon":"?","Colone":"?","colone":"?","coloneq":"?","comma":",","commat":"@","comp":"?","compfn":"?","complement":"?","complexes":"?","cong":"?","congdot":"?","Congruent":"?","conint":"?","Conint":"?","ContourIntegral":"?","copf":"??","Copf":"?","coprod":"?","Coproduct":"?","copy":"©","COPY":"©","copysr":"?","CounterClockwiseContourIntegral":"?","crarr":"?","cross":"?","Cross":"?","Cscr":"??","cscr":"??","csub":"?","csube":"?","csup":"?","csupe":"?","ctdot":"?","cudarrl":"?","cudarrr":"?","cuepr":"?","cuesc":"?","cularr":"?","cularrp":"?","cupbrcap":"?","cupcap":"?","CupCap":"?","cup":"?","Cup":"?","cupcup":"?","cupdot":"?","cupor":"?","cups":"??","curarr":"?","curarrm":"?","curlyeqprec":"?","curlyeqsucc":"?","curlyvee":"?","curlywedge":"?","curren":"¤","curvearrowleft":"?","curvearrowright":"?","cuvee":"?","cuwed":"?","cwconint":"?","cwint":"?","cylcty":"?","dagger":"†","Dagger":"‡","daleth":"?","darr":"?","Darr":"?","dArr":"?","dash":"?","Dashv":"?","dashv":"?","dbkarow":"?","dblac":"?","Dcaron":"?","dcaron":"?","Dcy":"?","dcy":"?","ddagger":"‡","ddarr":"?","DD":"?","dd":"?","DDotrahd":"?","ddotseq":"?","deg":"°","Del":"?","Delta":"?","delta":"?","demptyv":"?","dfisht":"?","Dfr":"??","dfr":"??","dHar":"?","dharl":"?","dharr":"?","DiacriticalAcute":"´","DiacriticalDot":"?","DiacriticalDoubleAcute":"?","DiacriticalGrave":"`","DiacriticalTilde":"˜","diam":"?","diamond":"?","Diamond":"?","diamondsuit":"?","diams":"?","die":"¨","DifferentialD":"?","digamma":"?","disin":"?","div":"÷","divide":"÷","divideontimes":"?","divonx":"?","DJcy":"?","djcy":"?","dlcorn":"?","dlcrop":"?","dollar":"$","Dopf":"??","dopf":"??","Dot":"¨","dot":"?","DotDot":"?","doteq":"?","doteqdot":"?","DotEqual":"?","dotminus":"?","dotplus":"?","dotsquare":"?","doublebarwedge":"?","DoubleContourIntegral":"?","DoubleDot":"¨","DoubleDownArrow":"?","DoubleLeftArrow":"?","DoubleLeftRightArrow":"?","DoubleLeftTee":"?","DoubleLongLeftArrow":"?","DoubleLongLeftRightArrow":"?","DoubleLongRightArrow":"?","DoubleRightArrow":"?","DoubleRightTee":"?","DoubleUpArrow":"?","DoubleUpDownArrow":"?","DoubleVerticalBar":"?","DownArrowBar":"?","downarrow":"?","DownArrow":"?","Downarrow":"?","DownArrowUpArrow":"?","DownBreve":"?","downdownarrows":"?","downharpoonleft":"?","downharpoonright":"?","DownLeftRightVector":"?","DownLeftTeeVector":"?","DownLeftVectorBar":"?","DownLeftVector":"?","DownRightTeeVector":"?","DownRightVectorBar":"?","DownRightVector":"?","DownTeeArrow":"?","DownTee":"?","drbkarow":"?","drcorn":"?","drcrop":"?","Dscr":"??","dscr":"??","DScy":"?","dscy":"?","dsol":"?","Dstrok":"?","dstrok":"?","dtdot":"?","dtri":"?","dtrif":"?","duarr":"?","duhar":"?","dwangle":"?","DZcy":"?","dzcy":"?","dzigrarr":"?","Eacute":"É","eacute":"é","easter":"?","Ecaron":"?","ecaron":"?","Ecirc":"Ê","ecirc":"ê","ecir":"?","ecolon":"?","Ecy":"?","ecy":"?","eDDot":"?","Edot":"?","edot":"?","eDot":"?","ee":"?","efDot":"?","Efr":"??","efr":"??","eg":"?","Egrave":"È","egrave":"è","egs":"?","egsdot":"?","el":"?","Element":"?","elinters":"?","ell":"?","els":"?","elsdot":"?","Emacr":"?","emacr":"?","empty":"?","emptyset":"?","EmptySmallSquare":"?","emptyv":"?","EmptyVerySmallSquare":"?","emsp13":"?","emsp14":"?","emsp":"?","ENG":"?","eng":"?","ensp":"?","Eogon":"?","eogon":"?","Eopf":"??","eopf":"??","epar":"?","eparsl":"?","eplus":"?","epsi":"?","Epsilon":"?","epsilon":"?","epsiv":"?","eqcirc":"?","eqcolon":"?","eqsim":"?","eqslantgtr":"?","eqslantless":"?","Equal":"?","equals":"=","EqualTilde":"?","equest":"?","Equilibrium":"?","equiv":"?","equivDD":"?","eqvparsl":"?","erarr":"?","erDot":"?","escr":"?","Escr":"?","esdot":"?","Esim":"?","esim":"?","Eta":"?","eta":"?","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","euro":"€","excl":"!","exist":"?","Exists":"?","expectation":"?","exponentiale":"?","ExponentialE":"?","fallingdotseq":"?","Fcy":"?","fcy":"?","female":"?","ffilig":"?","fflig":"?","ffllig":"?","Ffr":"??","ffr":"??","filig":"?","FilledSmallSquare":"?","FilledVerySmallSquare":"?","fjlig":"fj","flat":"?","fllig":"?","fltns":"?","fnof":"ƒ","Fopf":"??","fopf":"??","forall":"?","ForAll":"?","fork":"?","forkv":"?","Fouriertrf":"?","fpartint":"?","frac12":"½","frac13":"?","frac14":"¼","frac15":"?","frac16":"?","frac18":"?","frac23":"?","frac25":"?","frac34":"¾","frac35":"?","frac38":"?","frac45":"?","frac56":"?","frac58":"?","frac78":"?","frasl":"?","frown":"?","fscr":"??","Fscr":"?","gacute":"?","Gamma":"?","gamma":"?","Gammad":"?","gammad":"?","gap":"?","Gbreve":"?","gbreve":"?","Gcedil":"?","Gcirc":"?","gcirc":"?","Gcy":"?","gcy":"?","Gdot":"?","gdot":"?","ge":"?","gE":"?","gEl":"?","gel":"?","geq":"?","geqq":"?","geqslant":"?","gescc":"?","ges":"?","gesdot":"?","gesdoto":"?","gesdotol":"?","gesl":"??","gesles":"?","Gfr":"??","gfr":"??","gg":"?","Gg":"?","ggg":"?","gimel":"?","GJcy":"?","gjcy":"?","gla":"?","gl":"?","glE":"?","glj":"?","gnap":"?","gnapprox":"?","gne":"?","gnE":"?","gneq":"?","gneqq":"?","gnsim":"?","Gopf":"??","gopf":"??","grave":"`","GreaterEqual":"?","GreaterEqualLess":"?","GreaterFullEqual":"?","GreaterGreater":"?","GreaterLess":"?","GreaterSlantEqual":"?","GreaterTilde":"?","Gscr":"??","gscr":"?","gsim":"?","gsime":"?","gsiml":"?","gtcc":"?","gtcir":"?","gt":">","GT":">","Gt":"?","gtdot":"?","gtlPar":"?","gtquest":"?","gtrapprox":"?","gtrarr":"?","gtrdot":"?","gtreqless":"?","gtreqqless":"?","gtrless":"?","gtrsim":"?","gvertneqq":"??","gvnE":"??","Hacek":"?","hairsp":"?","half":"½","hamilt":"?","HARDcy":"?","hardcy":"?","harrcir":"?","harr":"?","hArr":"?","harrw":"?","Hat":"^","hbar":"?","Hcirc":"?","hcirc":"?","hearts":"?","heartsuit":"?","hellip":"…","hercon":"?","hfr":"??","Hfr":"?","HilbertSpace":"?","hksearow":"?","hkswarow":"?","hoarr":"?","homtht":"?","hookleftarrow":"?","hookrightarrow":"?","hopf":"??","Hopf":"?","horbar":"?","HorizontalLine":"?","hscr":"??","Hscr":"?","hslash":"?","Hstrok":"?","hstrok":"?","HumpDownHump":"?","HumpEqual":"?","hybull":"?","hyphen":"?","Iacute":"Í","iacute":"í","ic":"?","Icirc":"Î","icirc":"î","Icy":"?","icy":"?","Idot":"?","IEcy":"?","iecy":"?","iexcl":"¡","iff":"?","ifr":"??","Ifr":"?","Igrave":"Ì","igrave":"ì","ii":"?","iiiint":"?","iiint":"?","iinfin":"?","iiota":"?","IJlig":"?","ijlig":"?","Imacr":"?","imacr":"?","image":"?","ImaginaryI":"?","imagline":"?","imagpart":"?","imath":"?","Im":"?","imof":"?","imped":"?","Implies":"?","incare":"?","in":"?","infin":"?","infintie":"?","inodot":"?","intcal":"?","int":"?","Int":"?","integers":"?","Integral":"?","intercal":"?","Intersection":"?","intlarhk":"?","intprod":"?","InvisibleComma":"?","InvisibleTimes":"?","IOcy":"?","iocy":"?","Iogon":"?","iogon":"?","Iopf":"??","iopf":"??","Iota":"?","iota":"?","iprod":"?","iquest":"¿","iscr":"??","Iscr":"?","isin":"?","isindot":"?","isinE":"?","isins":"?","isinsv":"?","isinv":"?","it":"?","Itilde":"?","itilde":"?","Iukcy":"?","iukcy":"?","Iuml":"Ï","iuml":"ï","Jcirc":"?","jcirc":"?","Jcy":"?","jcy":"?","Jfr":"??","jfr":"??","jmath":"?","Jopf":"??","jopf":"??","Jscr":"??","jscr":"??","Jsercy":"?","jsercy":"?","Jukcy":"?","jukcy":"?","Kappa":"?","kappa":"?","kappav":"?","Kcedil":"?","kcedil":"?","Kcy":"?","kcy":"?","Kfr":"??","kfr":"??","kgreen":"?","KHcy":"?","khcy":"?","KJcy":"?","kjcy":"?","Kopf":"??","kopf":"??","Kscr":"??","kscr":"??","lAarr":"?","Lacute":"?","lacute":"?","laemptyv":"?","lagran":"?","Lambda":"?","lambda":"?","lang":"?","Lang":"?","langd":"?","langle":"?","lap":"?","Laplacetrf":"?","laquo":"«","larrb":"?","larrbfs":"?","larr":"?","Larr":"?","lArr":"?","larrfs":"?","larrhk":"?","larrlp":"?","larrpl":"?","larrsim":"?","larrtl":"?","latail":"?","lAtail":"?","lat":"?","late":"?","lates":"??","lbarr":"?","lBarr":"?","lbbrk":"?","lbrace":"{","lbrack":"[","lbrke":"?","lbrksld":"?","lbrkslu":"?","Lcaron":"?","lcaron":"?","Lcedil":"?","lcedil":"?","lceil":"?","lcub":"{","Lcy":"?","lcy":"?","ldca":"?","ldquo":"“","ldquor":"„","ldrdhar":"?","ldrushar":"?","ldsh":"?","le":"?","lE":"?","LeftAngleBracket":"?","LeftArrowBar":"?","leftarrow":"?","LeftArrow":"?","Leftarrow":"?","LeftArrowRightArrow":"?","leftarrowtail":"?","LeftCeiling":"?","LeftDoubleBracket":"?","LeftDownTeeVector":"?","LeftDownVectorBar":"?","LeftDownVector":"?","LeftFloor":"?","leftharpoondown":"?","leftharpoonup":"?","leftleftarrows":"?","leftrightarrow":"?","LeftRightArrow":"?","Leftrightarrow":"?","leftrightarrows":"?","leftrightharpoons":"?","leftrightsquigarrow":"?","LeftRightVector":"?","LeftTeeArrow":"?","LeftTee":"?","LeftTeeVector":"?","leftthreetimes":"?","LeftTriangleBar":"?","LeftTriangle":"?","LeftTriangleEqual":"?","LeftUpDownVector":"?","LeftUpTeeVector":"?","LeftUpVectorBar":"?","LeftUpVector":"?","LeftVectorBar":"?","LeftVector":"?","lEg":"?","leg":"?","leq":"?","leqq":"?","leqslant":"?","lescc":"?","les":"?","lesdot":"?","lesdoto":"?","lesdotor":"?","lesg":"??","lesges":"?","lessapprox":"?","lessdot":"?","lesseqgtr":"?","lesseqqgtr":"?","LessEqualGreater":"?","LessFullEqual":"?","LessGreater":"?","lessgtr":"?","LessLess":"?","lesssim":"?","LessSlantEqual":"?","LessTilde":"?","lfisht":"?","lfloor":"?","Lfr":"??","lfr":"??","lg":"?","lgE":"?","lHar":"?","lhard":"?","lharu":"?","lharul":"?","lhblk":"?","LJcy":"?","ljcy":"?","llarr":"?","ll":"?","Ll":"?","llcorner":"?","Lleftarrow":"?","llhard":"?","lltri":"?","Lmidot":"?","lmidot":"?","lmoustache":"?","lmoust":"?","lnap":"?","lnapprox":"?","lne":"?","lnE":"?","lneq":"?","lneqq":"?","lnsim":"?","loang":"?","loarr":"?","lobrk":"?","longleftarrow":"?","LongLeftArrow":"?","Longleftarrow":"?","longleftrightarrow":"?","LongLeftRightArrow":"?","Longleftrightarrow":"?","longmapsto":"?","longrightarrow":"?","LongRightArrow":"?","Longrightarrow":"?","looparrowleft":"?","looparrowright":"?","lopar":"?","Lopf":"??","lopf":"??","loplus":"?","lotimes":"?","lowast":"?","lowbar":"_","LowerLeftArrow":"?","LowerRightArrow":"?","loz":"?","lozenge":"?","lozf":"?","lpar":"(","lparlt":"?","lrarr":"?","lrcorner":"?","lrhar":"?","lrhard":"?","lrm":"?","lrtri":"?","lsaquo":"‹","lscr":"??","Lscr":"?","lsh":"?","Lsh":"?","lsim":"?","lsime":"?","lsimg":"?","lsqb":"[","lsquo":"‘","lsquor":"‚","Lstrok":"?","lstrok":"?","ltcc":"?","ltcir":"?","lt":"<","LT":"<","Lt":"?","ltdot":"?","lthree":"?","ltimes":"?","ltlarr":"?","ltquest":"?","ltri":"?","ltrie":"?","ltrif":"?","ltrPar":"?","lurdshar":"?","luruhar":"?","lvertneqq":"??","lvnE":"??","macr":"¯","male":"?","malt":"?","maltese":"?","Map":"?","map":"?","mapsto":"?","mapstodown":"?","mapstoleft":"?","mapstoup":"?","marker":"?","mcomma":"?","Mcy":"?","mcy":"?","mdash":"—","mDDot":"?","measuredangle":"?","MediumSpace":"?","Mellintrf":"?","Mfr":"??","mfr":"??","mho":"?","micro":"µ","midast":"*","midcir":"?","mid":"?","middot":"·","minusb":"?","minus":"?","minusd":"?","minusdu":"?","MinusPlus":"?","mlcp":"?","mldr":"…","mnplus":"?","models":"?","Mopf":"??","mopf":"??","mp":"?","mscr":"??","Mscr":"?","mstpos":"?","Mu":"?","mu":"?","multimap":"?","mumap":"?","nabla":"?","Nacute":"?","nacute":"?","nang":"??","nap":"?","napE":"??","napid":"??","napos":"?","napprox":"?","natural":"?","naturals":"?","natur":"?","nbsp":" ","nbump":"??","nbumpe":"??","ncap":"?","Ncaron":"?","ncaron":"?","Ncedil":"?","ncedil":"?","ncong":"?","ncongdot":"??","ncup":"?","Ncy":"?","ncy":"?","ndash":"–","nearhk":"?","nearr":"?","neArr":"?","nearrow":"?","ne":"?","nedot":"??","NegativeMediumSpace":"?","NegativeThickSpace":"?","NegativeThinSpace":"?","NegativeVeryThinSpace":"?","nequiv":"?","nesear":"?","nesim":"??","NestedGreaterGreater":"?","NestedLessLess":"?","NewLine":"\n","nexist":"?","nexists":"?","Nfr":"??","nfr":"??","ngE":"??","nge":"?","ngeq":"?","ngeqq":"??","ngeqslant":"??","nges":"??","nGg":"??","ngsim":"?","nGt":"??","ngt":"?","ngtr":"?","nGtv":"??","nharr":"?","nhArr":"?","nhpar":"?","ni":"?","nis":"?","nisd":"?","niv":"?","NJcy":"?","njcy":"?","nlarr":"?","nlArr":"?","nldr":"?","nlE":"??","nle":"?","nleftarrow":"?","nLeftarrow":"?","nleftrightarrow":"?","nLeftrightarrow":"?","nleq":"?","nleqq":"??","nleqslant":"??","nles":"??","nless":"?","nLl":"??","nlsim":"?","nLt":"??","nlt":"?","nltri":"?","nltrie":"?","nLtv":"??","nmid":"?","NoBreak":"?","NonBreakingSpace":" ","nopf":"??","Nopf":"?","Not":"?","not":"¬","NotCongruent":"?","NotCupCap":"?","NotDoubleVerticalBar":"?","NotElement":"?","NotEqual":"?","NotEqualTilde":"??","NotExists":"?","NotGreater":"?","NotGreaterEqual":"?","NotGreaterFullEqual":"??","NotGreaterGreater":"??","NotGreaterLess":"?","NotGreaterSlantEqual":"??","NotGreaterTilde":"?","NotHumpDownHump":"??","NotHumpEqual":"??","notin":"?","notindot":"??","notinE":"??","notinva":"?","notinvb":"?","notinvc":"?","NotLeftTriangleBar":"??","NotLeftTriangle":"?","NotLeftTriangleEqual":"?","NotLess":"?","NotLessEqual":"?","NotLessGreater":"?","NotLessLess":"??","NotLessSlantEqual":"??","NotLessTilde":"?","NotNestedGreaterGreater":"??","NotNestedLessLess":"??","notni":"?","notniva":"?","notnivb":"?","notnivc":"?","NotPrecedes":"?","NotPrecedesEqual":"??","NotPrecedesSlantEqual":"?","NotReverseElement":"?","NotRightTriangleBar":"??","NotRightTriangle":"?","NotRightTriangleEqual":"?","NotSquareSubset":"??","NotSquareSubsetEqual":"?","NotSquareSuperset":"??","NotSquareSupersetEqual":"?","NotSubset":"??","NotSubsetEqual":"?","NotSucceeds":"?","NotSucceedsEqual":"??","NotSucceedsSlantEqual":"?","NotSucceedsTilde":"??","NotSuperset":"??","NotSupersetEqual":"?","NotTilde":"?","NotTildeEqual":"?","NotTildeFullEqual":"?","NotTildeTilde":"?","NotVerticalBar":"?","nparallel":"?","npar":"?","nparsl":"??","npart":"??","npolint":"?","npr":"?","nprcue":"?","nprec":"?","npreceq":"??","npre":"??","nrarrc":"??","nrarr":"?","nrArr":"?","nrarrw":"??","nrightarrow":"?","nRightarrow":"?","nrtri":"?","nrtrie":"?","nsc":"?","nsccue":"?","nsce":"??","Nscr":"??","nscr":"??","nshortmid":"?","nshortparallel":"?","nsim":"?","nsime":"?","nsimeq":"?","nsmid":"?","nspar":"?","nsqsube":"?","nsqsupe":"?","nsub":"?","nsubE":"??","nsube":"?","nsubset":"??","nsubseteq":"?","nsubseteqq":"??","nsucc":"?","nsucceq":"??","nsup":"?","nsupE":"??","nsupe":"?","nsupset":"??","nsupseteq":"?","nsupseteqq":"??","ntgl":"?","Ntilde":"Ñ","ntilde":"ñ","ntlg":"?","ntriangleleft":"?","ntrianglelefteq":"?","ntriangleright":"?","ntrianglerighteq":"?","Nu":"?","nu":"?","num":"#","numero":"?","numsp":"?","nvap":"??","nvdash":"?","nvDash":"?","nVdash":"?","nVDash":"?","nvge":"??","nvgt":">?","nvHarr":"?","nvinfin":"?","nvlArr":"?","nvle":"??","nvlt":"<?","nvltrie":"??","nvrArr":"?","nvrtrie":"??","nvsim":"??","nwarhk":"?","nwarr":"?","nwArr":"?","nwarrow":"?","nwnear":"?","Oacute":"Ó","oacute":"ó","oast":"?","Ocirc":"Ô","ocirc":"ô","ocir":"?","Ocy":"?","ocy":"?","odash":"?","Odblac":"?","odblac":"?","odiv":"?","odot":"?","odsold":"?","OElig":"Œ","oelig":"œ","ofcir":"?","Ofr":"??","ofr":"??","ogon":"?","Ograve":"Ò","ograve":"ò","ogt":"?","ohbar":"?","ohm":"?","oint":"?","olarr":"?","olcir":"?","olcross":"?","oline":"?","olt":"?","Omacr":"?","omacr":"?","Omega":"?","omega":"?","Omicron":"?","omicron":"?","omid":"?","ominus":"?","Oopf":"??","oopf":"??","opar":"?","OpenCurlyDoubleQuote":"“","OpenCurlyQuote":"‘","operp":"?","oplus":"?","orarr":"?","Or":"?","or":"?","ord":"?","order":"?","orderof":"?","ordf":"ª","ordm":"º","origof":"?","oror":"?","orslope":"?","orv":"?","oS":"?","Oscr":"??","oscr":"?","Oslash":"Ø","oslash":"ø","osol":"?","Otilde":"Õ","otilde":"õ","otimesas":"?","Otimes":"?","otimes":"?","Ouml":"Ö","ouml":"ö","ovbar":"?","OverBar":"?","OverBrace":"?","OverBracket":"?","OverParenthesis":"?","para":"¶","parallel":"?","par":"?","parsim":"?","parsl":"?","part":"?","PartialD":"?","Pcy":"?","pcy":"?","percnt":"%","period":".","permil":"‰","perp":"?","pertenk":"?","Pfr":"??","pfr":"??","Phi":"?","phi":"?","phiv":"?","phmmat":"?","phone":"?","Pi":"?","pi":"?","pitchfork":"?","piv":"?","planck":"?","planckh":"?","plankv":"?","plusacir":"?","plusb":"?","pluscir":"?","plus":"+","plusdo":"?","plusdu":"?","pluse":"?","PlusMinus":"±","plusmn":"±","plussim":"?","plustwo":"?","pm":"±","Poincareplane":"?","pointint":"?","popf":"??","Popf":"?","pound":"£","prap":"?","Pr":"?","pr":"?","prcue":"?","precapprox":"?","prec":"?","preccurlyeq":"?","Precedes":"?","PrecedesEqual":"?","PrecedesSlantEqual":"?","PrecedesTilde":"?","preceq":"?","precnapprox":"?","precneqq":"?","precnsim":"?","pre":"?","prE":"?","precsim":"?","prime":"?","Prime":"?","primes":"?","prnap":"?","prnE":"?","prnsim":"?","prod":"?","Product":"?","profalar":"?","profline":"?","profsurf":"?","prop":"?","Proportional":"?","Proportion":"?","propto":"?","prsim":"?","prurel":"?","Pscr":"??","pscr":"??","Psi":"?","psi":"?","puncsp":"?","Qfr":"??","qfr":"??","qint":"?","qopf":"??","Qopf":"?","qprime":"?","Qscr":"??","qscr":"??","quaternions":"?","quatint":"?","quest":"?","questeq":"?","quot":"\"","QUOT":"\"","rAarr":"?","race":"??","Racute":"?","racute":"?","radic":"?","raemptyv":"?","rang":"?","Rang":"?","rangd":"?","range":"?","rangle":"?","raquo":"»","rarrap":"?","rarrb":"?","rarrbfs":"?","rarrc":"?","rarr":"?","Rarr":"?","rArr":"?","rarrfs":"?","rarrhk":"?","rarrlp":"?","rarrpl":"?","rarrsim":"?","Rarrtl":"?","rarrtl":"?","rarrw":"?","ratail":"?","rAtail":"?","ratio":"?","rationals":"?","rbarr":"?","rBarr":"?","RBarr":"?","rbbrk":"?","rbrace":"}","rbrack":"]","rbrke":"?","rbrksld":"?","rbrkslu":"?","Rcaron":"?","rcaron":"?","Rcedil":"?","rcedil":"?","rceil":"?","rcub":"}","Rcy":"?","rcy":"?","rdca":"?","rdldhar":"?","rdquo":"”","rdquor":"”","rdsh":"?","real":"?","realine":"?","realpart":"?","reals":"?","Re":"?","rect":"?","reg":"®","REG":"®","ReverseElement":"?","ReverseEquilibrium":"?","ReverseUpEquilibrium":"?","rfisht":"?","rfloor":"?","rfr":"??","Rfr":"?","rHar":"?","rhard":"?","rharu":"?","rharul":"?","Rho":"?","rho":"?","rhov":"?","RightAngleBracket":"?","RightArrowBar":"?","rightarrow":"?","RightArrow":"?","Rightarrow":"?","RightArrowLeftArrow":"?","rightarrowtail":"?","RightCeiling":"?","RightDoubleBracket":"?","RightDownTeeVector":"?","RightDownVectorBar":"?","RightDownVector":"?","RightFloor":"?","rightharpoondown":"?","rightharpoonup":"?","rightleftarrows":"?","rightleftharpoons":"?","rightrightarrows":"?","rightsquigarrow":"?","RightTeeArrow":"?","RightTee":"?","RightTeeVector":"?","rightthreetimes":"?","RightTriangleBar":"?","RightTriangle":"?","RightTriangleEqual":"?","RightUpDownVector":"?","RightUpTeeVector":"?","RightUpVectorBar":"?","RightUpVector":"?","RightVectorBar":"?","RightVector":"?","ring":"?","risingdotseq":"?","rlarr":"?","rlhar":"?","rlm":"?","rmoustache":"?","rmoust":"?","rnmid":"?","roang":"?","roarr":"?","robrk":"?","ropar":"?","ropf":"??","Ropf":"?","roplus":"?","rotimes":"?","RoundImplies":"?","rpar":")","rpargt":"?","rppolint":"?","rrarr":"?","Rrightarrow":"?","rsaquo":"›","rscr":"??","Rscr":"?","rsh":"?","Rsh":"?","rsqb":"]","rsquo":"’","rsquor":"’","rthree":"?","rtimes":"?","rtri":"?","rtrie":"?","rtrif":"?","rtriltri":"?","RuleDelayed":"?","ruluhar":"?","rx":"?","Sacute":"?","sacute":"?","sbquo":"‚","scap":"?","Scaron":"Š","scaron":"š","Sc":"?","sc":"?","sccue":"?","sce":"?","scE":"?","Scedil":"?","scedil":"?","Scirc":"?","scirc":"?","scnap":"?","scnE":"?","scnsim":"?","scpolint":"?","scsim":"?","Scy":"?","scy":"?","sdotb":"?","sdot":"?","sdote":"?","searhk":"?","searr":"?","seArr":"?","searrow":"?","sect":"§","semi":";","seswar":"?","setminus":"?","setmn":"?","sext":"?","Sfr":"??","sfr":"??","sfrown":"?","sharp":"?","SHCHcy":"?","shchcy":"?","SHcy":"?","shcy":"?","ShortDownArrow":"?","ShortLeftArrow":"?","shortmid":"?","shortparallel":"?","ShortRightArrow":"?","ShortUpArrow":"?","shy":"­","Sigma":"?","sigma":"?","sigmaf":"?","sigmav":"?","sim":"?","simdot":"?","sime":"?","simeq":"?","simg":"?","simgE":"?","siml":"?","simlE":"?","simne":"?","simplus":"?","simrarr":"?","slarr":"?","SmallCircle":"?","smallsetminus":"?","smashp":"?","smeparsl":"?","smid":"?","smile":"?","smt":"?","smte":"?","smtes":"??","SOFTcy":"?","softcy":"?","solbar":"?","solb":"?","sol":"/","Sopf":"??","sopf":"??","spades":"?","spadesuit":"?","spar":"?","sqcap":"?","sqcaps":"??","sqcup":"?","sqcups":"??","Sqrt":"?","sqsub":"?","sqsube":"?","sqsubset":"?","sqsubseteq":"?","sqsup":"?","sqsupe":"?","sqsupset":"?","sqsupseteq":"?","square":"?","Square":"?","SquareIntersection":"?","SquareSubset":"?","SquareSubsetEqual":"?","SquareSuperset":"?","SquareSupersetEqual":"?","SquareUnion":"?","squarf":"?","squ":"?","squf":"?","srarr":"?","Sscr":"??","sscr":"??","ssetmn":"?","ssmile":"?","sstarf":"?","Star":"?","star":"?","starf":"?","straightepsilon":"?","straightphi":"?","strns":"¯","sub":"?","Sub":"?","subdot":"?","subE":"?","sube":"?","subedot":"?","submult":"?","subnE":"?","subne":"?","subplus":"?","subrarr":"?","subset":"?","Subset":"?","subseteq":"?","subseteqq":"?","SubsetEqual":"?","subsetneq":"?","subsetneqq":"?","subsim":"?","subsub":"?","subsup":"?","succapprox":"?","succ":"?","succcurlyeq":"?","Succeeds":"?","SucceedsEqual":"?","SucceedsSlantEqual":"?","SucceedsTilde":"?","succeq":"?","succnapprox":"?","succneqq":"?","succnsim":"?","succsim":"?","SuchThat":"?","sum":"?","Sum":"?","sung":"?","sup1":"¹","sup2":"²","sup3":"³","sup":"?","Sup":"?","supdot":"?","supdsub":"?","supE":"?","supe":"?","supedot":"?","Superset":"?","SupersetEqual":"?","suphsol":"?","suphsub":"?","suplarr":"?","supmult":"?","supnE":"?","supne":"?","supplus":"?","supset":"?","Supset":"?","supseteq":"?","supseteqq":"?","supsetneq":"?","supsetneqq":"?","supsim":"?","supsub":"?","supsup":"?","swarhk":"?","swarr":"?","swArr":"?","swarrow":"?","swnwar":"?","szlig":"ß","Tab":"\t","target":"?","Tau":"?","tau":"?","tbrk":"?","Tcaron":"?","tcaron":"?","Tcedil":"?","tcedil":"?","Tcy":"?","tcy":"?","tdot":"?","telrec":"?","Tfr":"??","tfr":"??","there4":"?","therefore":"?","Therefore":"?","Theta":"?","theta":"?","thetasym":"?","thetav":"?","thickapprox":"?","thicksim":"?","ThickSpace":"??","ThinSpace":"?","thinsp":"?","thkap":"?","thksim":"?","THORN":"Þ","thorn":"þ","tilde":"˜","Tilde":"?","TildeEqual":"?","TildeFullEqual":"?","TildeTilde":"?","timesbar":"?","timesb":"?","times":"×","timesd":"?","tint":"?","toea":"?","topbot":"?","topcir":"?","top":"?","Topf":"??","topf":"??","topfork":"?","tosa":"?","tprime":"?","trade":"™","TRADE":"™","triangle":"?","triangledown":"?","triangleleft":"?","trianglelefteq":"?","triangleq":"?","triangleright":"?","trianglerighteq":"?","tridot":"?","trie":"?","triminus":"?","TripleDot":"?","triplus":"?","trisb":"?","tritime":"?","trpezium":"?","Tscr":"??","tscr":"??","TScy":"?","tscy":"?","TSHcy":"?","tshcy":"?","Tstrok":"?","tstrok":"?","twixt":"?","twoheadleftarrow":"?","twoheadrightarrow":"?","Uacute":"Ú","uacute":"ú","uarr":"?","Uarr":"?","uArr":"?","Uarrocir":"?","Ubrcy":"?","ubrcy":"?","Ubreve":"?","ubreve":"?","Ucirc":"Û","ucirc":"û","Ucy":"?","ucy":"?","udarr":"?","Udblac":"?","udblac":"?","udhar":"?","ufisht":"?","Ufr":"??","ufr":"??","Ugrave":"Ù","ugrave":"ù","uHar":"?","uharl":"?","uharr":"?","uhblk":"?","ulcorn":"?","ulcorner":"?","ulcrop":"?","ultri":"?","Umacr":"?","umacr":"?","uml":"¨","UnderBar":"_","UnderBrace":"?","UnderBracket":"?","UnderParenthesis":"?","Union":"?","UnionPlus":"?","Uogon":"?","uogon":"?","Uopf":"??","uopf":"??","UpArrowBar":"?","uparrow":"?","UpArrow":"?","Uparrow":"?","UpArrowDownArrow":"?","updownarrow":"?","UpDownArrow":"?","Updownarrow":"?","UpEquilibrium":"?","upharpoonleft":"?","upharpoonright":"?","uplus":"?","UpperLeftArrow":"?","UpperRightArrow":"?","upsi":"?","Upsi":"?","upsih":"?","Upsilon":"?","upsilon":"?","UpTeeArrow":"?","UpTee":"?","upuparrows":"?","urcorn":"?","urcorner":"?","urcrop":"?","Uring":"?","uring":"?","urtri":"?","Uscr":"??","uscr":"??","utdot":"?","Utilde":"?","utilde":"?","utri":"?","utrif":"?","uuarr":"?","Uuml":"Ü","uuml":"ü","uwangle":"?","vangrt":"?","varepsilon":"?","varkappa":"?","varnothing":"?","varphi":"?","varpi":"?","varpropto":"?","varr":"?","vArr":"?","varrho":"?","varsigma":"?","varsubsetneq":"??","varsubsetneqq":"??","varsupsetneq":"??","varsupsetneqq":"??","vartheta":"?","vartriangleleft":"?","vartriangleright":"?","vBar":"?","Vbar":"?","vBarv":"?","Vcy":"?","vcy":"?","vdash":"?","vDash":"?","Vdash":"?","VDash":"?","Vdashl":"?","veebar":"?","vee":"?","Vee":"?","veeeq":"?","vellip":"?","verbar":"|","Verbar":"?","vert":"|","Vert":"?","VerticalBar":"?","VerticalLine":"|","VerticalSeparator":"?","VerticalTilde":"?","VeryThinSpace":"?","Vfr":"??","vfr":"??","vltri":"?","vnsub":"??","vnsup":"??","Vopf":"??","vopf":"??","vprop":"?","vrtri":"?","Vscr":"??","vscr":"??","vsubnE":"??","vsubne":"??","vsupnE":"??","vsupne":"??","Vvdash":"?","vzigzag":"?","Wcirc":"?","wcirc":"?","wedbar":"?","wedge":"?","Wedge":"?","wedgeq":"?","weierp":"?","Wfr":"??","wfr":"??","Wopf":"??","wopf":"??","wp":"?","wr":"?","wreath":"?","Wscr":"??","wscr":"??","xcap":"?","xcirc":"?","xcup":"?","xdtri":"?","Xfr":"??","xfr":"??","xharr":"?","xhArr":"?","Xi":"?","xi":"?","xlarr":"?","xlArr":"?","xmap":"?","xnis":"?","xodot":"?","Xopf":"??","xopf":"??","xoplus":"?","xotime":"?","xrarr":"?","xrArr":"?","Xscr":"??","xscr":"??","xsqcup":"?","xuplus":"?","xutri":"?","xvee":"?","xwedge":"?","Yacute":"Ý","yacute":"ý","YAcy":"?","yacy":"?","Ycirc":"?","ycirc":"?","Ycy":"?","ycy":"?","yen":"¥","Yfr":"??","yfr":"??","YIcy":"?","yicy":"?","Yopf":"??","yopf":"??","Yscr":"??","yscr":"??","YUcy":"?","yucy":"?","yuml":"ÿ","Yuml":"Ÿ","Zacute":"?","zacute":"?","Zcaron":"Ž","zcaron":"ž","Zcy":"?","zcy":"?","Zdot":"?","zdot":"?","zeetrf":"?","ZeroWidthSpace":"?","Zeta":"?","zeta":"?","zfr":"??","Zfr":"?","ZHcy":"?","zhcy":"?","zigrarr":"?","zopf":"??","Zopf":"?","Zscr":"??","zscr":"??","zwj":"?","zwnj":"?"}

},{}],8:[function(require,module,exports){
module.exports={"Aacute":"Á","aacute":"á","Acirc":"Â","acirc":"â","acute":"´","AElig":"Æ","aelig":"æ","Agrave":"À","agrave":"à","amp":"&","AMP":"&","Aring":"Å","aring":"å","Atilde":"Ã","atilde":"ã","Auml":"Ä","auml":"ä","brvbar":"¦","Ccedil":"Ç","ccedil":"ç","cedil":"¸","cent":"¢","copy":"©","COPY":"©","curren":"¤","deg":"°","divide":"÷","Eacute":"É","eacute":"é","Ecirc":"Ê","ecirc":"ê","Egrave":"È","egrave":"è","ETH":"Ð","eth":"ð","Euml":"Ë","euml":"ë","frac12":"½","frac14":"¼","frac34":"¾","gt":">","GT":">","Iacute":"Í","iacute":"í","Icirc":"Î","icirc":"î","iexcl":"¡","Igrave":"Ì","igrave":"ì","iquest":"¿","Iuml":"Ï","iuml":"ï","laquo":"«","lt":"<","LT":"<","macr":"¯","micro":"µ","middot":"·","nbsp":" ","not":"¬","Ntilde":"Ñ","ntilde":"ñ","Oacute":"Ó","oacute":"ó","Ocirc":"Ô","ocirc":"ô","Ograve":"Ò","ograve":"ò","ordf":"ª","ordm":"º","Oslash":"Ø","oslash":"ø","Otilde":"Õ","otilde":"õ","Ouml":"Ö","ouml":"ö","para":"¶","plusmn":"±","pound":"£","quot":"\"","QUOT":"\"","raquo":"»","reg":"®","REG":"®","sect":"§","shy":"­","sup1":"¹","sup2":"²","sup3":"³","szlig":"ß","THORN":"Þ","thorn":"þ","times":"×","Uacute":"Ú","uacute":"ú","Ucirc":"Û","ucirc":"û","Ugrave":"Ù","ugrave":"ù","uml":"¨","Uuml":"Ü","uuml":"ü","Yacute":"Ý","yacute":"ý","yen":"¥","yuml":"ÿ"}

},{}],9:[function(require,module,exports){
module.exports={"amp":"&","apos":"'","gt":">","lt":"<","quot":"\""}

},{}],10:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    getTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return (_a = this.getSearchTags) === null || _a === void 0 ? void 0 : _a.call(this);
        });
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],12:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":10,"./Tracker":11}],13:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":12,"./models":55}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],15:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],16:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],17:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],18:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],19:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],20:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],21:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],22:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],23:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],24:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],25:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],26:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],27:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],28:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],29:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],30:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],31:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],32:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":17,"./Form":18,"./FormRow":19,"./Header":20,"./InputField":21,"./Label":22,"./Link":23,"./MultilineLabel":24,"./NavigationButton":25,"./OAuthButton":26,"./Section":27,"./Select":28,"./Stepper":29,"./Switch":30,"./WebViewButton":31}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],36:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],37:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],38:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],39:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],40:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],41:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],42:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],43:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],44:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],45:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],48:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],49:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],50:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],51:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],52:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],53:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],54:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],55:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);

},{"./Chapter":14,"./ChapterDetails":15,"./Constants":16,"./DynamicUI":32,"./HomeSection":33,"./Languages":34,"./Manga":35,"./MangaTile":36,"./MangaUpdate":37,"./PagedResults":38,"./RawData":39,"./RequestHeaders":40,"./RequestInterceptor":41,"./RequestManager":42,"./RequestObject":43,"./ResponseObject":44,"./SearchField":45,"./SearchRequest":46,"./SourceInfo":47,"./SourceManga":48,"./SourceStateManager":49,"./SourceTag":50,"./TagSection":51,"./TrackedManga":52,"./TrackedMangaChapterReadAction":53,"./TrackerActionQueue":54}],56:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenManga = exports.SenMangaInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const SenMangaParser_1 = require("./SenMangaParser");
const SenMangaHelper_1 = require("./SenMangaHelper");
const SEN_DOMAIN = 'https://lectortmo.com/';
exports.SenMangaInfo = {
    version: '1.0.0',
    name: 'SenManga',
    icon: 'icon.png',
    author: 'rintendou',
    authorWebsite: 'https://github.com/rintendou',
    description: 'Extension that pulls manga from senmanga.com.',
    contentRating: paperback_extensions_common_1.ContentRating.MATURE,
    websiteBaseURL: SEN_DOMAIN,
    sourceTags: [
        {
            text: 'Notifications',
            type: paperback_extensions_common_1.TagType.GREEN
        }
    ]
};
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.44';
class SenManga extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 4,
            requestTimeout: 15000,
            interceptor: {
                interceptRequest: async (request) => {
                    request.headers = {
                        ...(request.headers ?? {}),
                        ...{
                            'referer': `${SEN_DOMAIN}/`,
                            'user-agent': userAgent
                        }
                    };
                    return request;
                },
                interceptResponse: async (response) => {
                    return response;
                }
            }
        });
    }
    getMangaShareUrl(mangaId) { return `${SEN_DOMAIN}/manga/${mangaId}`; }
    async getMangaDetails(mangaId) {
        const request = createRequestObject({
            url: `${SEN_DOMAIN}/${mangaId}`,
            method: 'GET'
        });
        const response = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(response.status);
        const $ = this.cheerio.load(response.data);
        return (0, SenMangaParser_1.parseMangaDetails)($, mangaId);
    }
    async getChapters(mangaId) {
        const request = createRequestObject({
            url: `${SEN_DOMAIN}/${mangaId}`,
            method: 'GET'
        });
        const response = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(response.status);
        const $ = this.cheerio.load(response.data);
        return (0, SenMangaParser_1.parseChapters)($, mangaId);
    }
    async getChapterDetails(mangaId, chapterId) {
        const request = createRequestObject({
            url: `${SEN_DOMAIN}/${mangaId}/${chapterId}`,
            method: 'GET',
            cookies: [createCookie({ name: 'viewer', value: '1', domain: SEN_DOMAIN })]
        });
        const response = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(response.status);
        const $ = this.cheerio.load(response.data);
        return (0, SenMangaParser_1.parseChapterDetails)($, mangaId, chapterId);
    }
    async filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        let page = 1;
        let updatedManga = {
            ids: [],
            loadMore: true
        };
        while (updatedManga.loadMore) {
            const request = createRequestObject({
                url: `${SEN_DOMAIN}/search?order=update&page=${page++}`,
                method: 'GET'
            });
            const response = await this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            updatedManga = (0, SenMangaParser_1.parseUpdatedManga)($, time, ids);
            if (updatedManga.ids.length > 0) {
                mangaUpdatesFoundCallback(createMangaUpdates({
                    ids: updatedManga.ids
                }));
            }
        }
    }
    async getHomePageSections(sectionCallback) {
        const request = createRequestObject({
            url: `${SEN_DOMAIN}`,
            method: 'GET'
        });
        const response = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(response.status);
        const $ = this.cheerio.load(response.data);
        (0, SenMangaParser_1.parseHomeSections)($, sectionCallback);
    }
    async getViewMoreItems(homepageSectionId, metadata) {
        if (metadata?.completed)
            return metadata;
        const page = metadata?.page ?? 1;
        let param = '';
        switch (homepageSectionId) {
            case 'most_popular':
                param = `/directory/popular?page=${page}`;
                break;
            case 'new':
                param = `/search?order=latest&page=${page}`;
                break;
            case 'updated':
                param = `/search?order=update&page=${page}`;
                break;
            default:
                throw new Error('Requested to getViewMoreItems for a section ID which doesn\'t exist');
        }
        const request = createRequestObject({
            url: SEN_DOMAIN,
            method: 'GET',
            param
        });
        const response = await this.requestManager.schedule(request, 1);
        this.CloudFlareError(response.status);
        const $ = this.cheerio.load(response.data);
        const manga = (0, SenMangaParser_1.parseViewMore)($);
        metadata = !(0, SenMangaParser_1.isLastPage)($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata
        });
    }
    async getSearchTags() {
        const request = createRequestObject({
            url: `${SEN_DOMAIN}/search?s=`,
            method: 'GET'
        });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        return (0, SenMangaParser_1.parseTags)($);
    }
    async getSearchResults(query, metadata) {
        const page = metadata?.page ?? 1;
        const url = new SenMangaHelper_1.URLBuilder(SEN_DOMAIN)
            .addPathComponent('search')
            .addQueryParameter('title', encodeURI(query?.title || ''))
            .addQueryParameter('page', page)
            .addQueryParameter('genre%5B%5D', query.includedTags?.map((x) => x.id).join('&genre%5B%5D='))
            .buildUrl();
        const request = createRequestObject({
            url: url,
            method: 'GET'
        });
        if (!request)
            return createPagedResults({ results: [], metadata: undefined });
        const response = await this.requestManager.schedule(request, 1);
        const $ = this.cheerio.load(response.data);
        const manga = (0, SenMangaParser_1.parseSearch)($);
        metadata = !(0, SenMangaParser_1.isLastPage)($) ? { page: page + 1 } : undefined;
        return createPagedResults({
            results: manga,
            metadata
        });
    }
    CloudFlareError(status) {
        if (status == 503) {
            throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > <The name of this source> and press Cloudflare Bypass');
        }
    }
    getCloudflareBypassRequest() {
        return createRequestObject({
            url: SEN_DOMAIN,
            method: 'GET',
            headers: {
                'user-agent': userAgent
            }
        });
    }
}
exports.SenManga = SenManga;

},{"./SenMangaHelper":57,"./SenMangaParser":58,"paperback-extensions-common":13}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLBuilder = void 0;
class URLBuilder {
    constructor(baseUrl) {
        this.parameters = {};
        this.pathComponents = [];
        this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, '');
    }
    addPathComponent(component) {
        this.pathComponents.push(component.replace(/(^\/)?(?=.*)(\/$)?/gim, ''));
        return this;
    }
    addQueryParameter(key, value) {
        this.parameters[key] = value;
        return this;
    }
    buildUrl({ addTrailingSlash, includeUndefinedParameters } = { addTrailingSlash: false, includeUndefinedParameters: false }) {
        let finalUrl = this.baseUrl + '/';
        finalUrl += this.pathComponents.join('/');
        finalUrl += addTrailingSlash ? '/' : '';
        finalUrl += Object.values(this.parameters).length > 0 ? '?' : '';
        finalUrl += Object.entries(this.parameters).map(entry => {
            if (!entry[1] && !includeUndefinedParameters) {
                return undefined;
            }
            if (Array.isArray(entry[1])) {
                return entry[1].map(value => value || includeUndefinedParameters ? `${entry[0]}[]=${value}` : undefined)
                    .filter(x => x !== undefined)
                    .join('&');
            }
            if (typeof entry[1] === 'object') {
                return Object.keys(entry[1]).map(key => entry[1][key] || includeUndefinedParameters ? `${entry[0]}[${key}]=${entry[1][key]}` : undefined)
                    .filter(x => x !== undefined)
                    .join('&');
            }
            return `${entry[0]}=${entry[1]}`;
        }).filter(x => x !== undefined).join('&');
        return finalUrl;
    }
}
exports.URLBuilder = URLBuilder;

},{}],58:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseSearch = exports.parseTags = exports.parseViewMore = exports.parseHomeSections = exports.parseUpdatedManga = exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const entities = require("entities");
const parseMangaDetails = ($, mangaId) => {
    const titles = [];
    titles.push(decodeHTMLEntity($('img', 'div.bg-cover').attr('alt')?.trim() ?? ''));
    const altTitles = $('div.alt-name', 'div.desc').text().trim().split(',');
    for (const title of altTitles) {
        titles.push(decodeHTMLEntity(title));
    }
    const image = $('img', 'div.cover').attr('src') ?? '';
    const author = $('a', $('div.info div.item:contains(\'Author\')')).text().trim();
    const arrayTags = [];
    for (const tag of $('a', 'div.info div.item:contains(\'Genres\')').toArray()) {
        const label = $(tag).text().trim();
        const id = encodeURI($(tag).text().trim());
        if (!id || !label)
            continue;
        arrayTags.push({ id: id, label: label });
    }
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    const description = decodeHTMLEntity($('div.summary').text().trim() ?? 'No description available');
    const rawStatus = $('div.info div.item:contains(\'Status:\')').text().replace('Status:', '').trim();
    console.log(rawStatus);
    let status = paperback_extensions_common_1.MangaStatus.ONGOING;
    switch (rawStatus.toUpperCase()) {
        case 'ONGOING':
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case 'COMPLETED':
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
            break;
        default:
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
    }
    return createManga({
        id: mangaId,
        titles: titles,
        image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
        status: status,
        author: author,
        artist: author,
        tags: tagSections,
        desc: description,
    });
};
exports.parseMangaDetails = parseMangaDetails;
const parseChapters = ($, mangaId) => {
    const chapters = [];
    let sortingIndex = 0;
    for (const chapter of $('li', 'ul.chapter-list').toArray()) {
        const title = decodeHTMLEntity($('a', chapter).text().trim());
        const chapterId = $('a', chapter).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        if (!chapterId)
            continue;
        const date = new Date($('time', chapter).attr('datetime')?.split(' ')[0] ?? '');
        const chapNumRegex = title.match(/(\d+\.?\d?)+/);
        let chapNum = 0;
        if (chapNumRegex && chapNumRegex[1])
            chapNum = Number(chapNumRegex[1]);
        chapters.push(createChapter({
            id: chapterId,
            mangaId,
            name: `Chapter ${chapNum}`,
            langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
            chapNum: chapNum,
            time: date,
            // @ts-ignore
            sortingIndex
        }));
        sortingIndex--;
    }
    return chapters;
};
exports.parseChapters = parseChapters;
const parseChapterDetails = ($, mangaId, chapterId) => {
    const pages = [];
    const data = $.html();
    let obj = /var imglist = ([^;]*)/.exec(data)?.[1] ?? '';
    if (obj == '')
        throw new Error(`Failed to find page details script for manga ${mangaId}`); // If null, throw error, else parse data to json.
    obj = JSON.parse(obj);
    for (const img of obj) {
        const image = img.url;
        if (!image)
            continue;
        pages.push(image);
    }
    const chapterDetails = createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages: pages,
        longStrip: false
    });
    return chapterDetails;
};
exports.parseChapterDetails = parseChapterDetails;
const parseUpdatedManga = ($, time, ids) => {
    let loadMore = true;
    const updatedManga = [];
    for (const manga of $('div.mng', 'div.listupd').toArray()) {
        const id = $('a', manga).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        if (!id)
            continue;
        const rawDate = $('time.float-right', manga).text().trim();
        const mangaDate = parseDate(rawDate);
        if (!mangaDate || !id)
            continue;
        if (mangaDate > time) {
            if (ids.includes(id)) {
                updatedManga.push(id);
            }
        }
        else {
            loadMore = false;
        }
    }
    return {
        ids: updatedManga,
        loadMore,
    };
};
exports.parseUpdatedManga = parseUpdatedManga;
const parseHomeSections = ($, sectionCallback) => {
    const mostPopularSection = createHomeSection({ id: 'most_popular', title: 'Most Popular', view_more: true, type: paperback_extensions_common_1.HomeSectionType.singleRowLarge });
    const newSection = createHomeSection({ id: 'new', title: 'New', view_more: true });
    const updateSection = createHomeSection({ id: 'updated', title: 'Latest Updated', view_more: true });
    // Most Popular
    const mostPopularSection_Array = [];
    for (const manga of $('li', $('.widget .widget-header:contains(\'Most Popular\')').next()).toArray()) {
        const image = $('img', manga).first().attr('src') ?? '';
        const title = $('img', manga).first().attr('alt') ?? '';
        const id = $('a', manga).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        if (!id || !title)
            continue;
        mostPopularSection_Array.push(createMangaTile({
            id: id,
            image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
            title: createIconText({ text: decodeHTMLEntity(title) })
        }));
    }
    mostPopularSection.items = mostPopularSection_Array;
    sectionCallback(mostPopularSection);
    // New
    const newSection_Array = [];
    for (const manga of $('li', $('.widget .widget-header:contains(\'New Series\')').next()).toArray()) {
        const image = $('img', manga).attr('src') ?? '';
        const title = $('img', manga).attr('alt') ?? '';
        const id = $('a', manga).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        if (!id || !title)
            continue;
        newSection_Array.push(createMangaTile({
            id: id,
            image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
            title: createIconText({ text: decodeHTMLEntity(title) })
        }));
    }
    newSection.items = newSection_Array;
    sectionCallback(newSection);
    // Updated
    const updateSection_Array = [];
    for (const manga of $('div.mng', 'div.listupd').toArray()) {
        const image = $('img', manga).first().attr('src') ?? '';
        const title = $('img', manga).first().attr('alt') ?? '';
        const id = $('a', manga).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        if (!id || !title)
            continue;
        updateSection_Array.push(createMangaTile({
            id: id,
            image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
            title: createIconText({ text: decodeHTMLEntity(title) })
        }));
    }
    updateSection.items = updateSection_Array;
    sectionCallback(updateSection);
};
exports.parseHomeSections = parseHomeSections;
const parseViewMore = ($) => {
    const manga = [];
    const collectedIds = [];
    for (const obj of $('div.upd', 'div.listupd').toArray()) {
        const image = $('img', obj).attr('src') ?? '';
        const title = $('img', obj).attr('alt') ?? '';
        const id = $('a', obj).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        const getChapter = $('div.chapter > strong', obj).text().trim();
        const chapNumRegex = getChapter.match(/(\d+\.?\d?)+/);
        let chapNum = 0;
        if (chapNumRegex && chapNumRegex[1])
            chapNum = Number(chapNumRegex[1]);
        const subtitle = chapNum ? 'Chapter ' + chapNum : 'Chapter N/A';
        if (!id || !title)
            continue;
        if (!collectedIds.includes(id)) {
            manga.push(createMangaTile({
                id,
                image: image ? image : 'https://i.imgur.com/GYUxEX8.png',
                title: createIconText({ text: decodeHTMLEntity(title) }),
                subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) })
            }));
            collectedIds.push(id);
        }
    }
    return manga;
};
exports.parseViewMore = parseViewMore;
const parseTags = ($) => {
    const arrayTags = [];
    for (const tag of $('li', 'ul.search-genre').toArray()) {
        const label = $(tag).text().trim() ?? '';
        const id = $('input', tag).attr('value') ?? '';
        if (!id || !label)
            continue;
        arrayTags.push({ id: id, label: label });
    }
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    return tagSections;
};
exports.parseTags = parseTags;
const parseSearch = ($) => {
    const mangas = [];
    for (const obj of $('div.item', 'div.listupd').toArray()) {
        let image = $('img', obj).first().attr('src') ?? '';
        if (image.startsWith('/'))
            image = 'https://raw.senmanga.com/covers/' + image;
        const title = $('img', obj).first().attr('alt') ?? '';
        const id = $('a', obj).attr('href')?.replace(/\/$/, '')?.split('/').pop() ?? '';
        const getChapter = $('div.chapter > strong', obj).text().trim();
        const chapNumRegex = getChapter.match(/(\d+\.?\d?)+/);
        let chapNum = 0;
        if (chapNumRegex && chapNumRegex[1])
            chapNum = Number(chapNumRegex[1]);
        const subtitle = chapNum ? 'Chapter ' + chapNum : 'Chapter N/A';
        if (!id || !title)
            continue;
        mangas.push(createMangaTile({
            id,
            image: image,
            title: createIconText({ text: decodeHTMLEntity(title) }),
            subtitleText: createIconText({ text: decodeHTMLEntity(subtitle) })
        }));
    }
    return mangas;
};
exports.parseSearch = parseSearch;
const isLastPage = ($) => {
    // When you go ONLY to the last page in the search menu, the final li node appears with class 'page-item disabled'. Can use this to see if on last page.
    let isLast = true;
    const hasDisabled = $('li.page-item', 'ul.pagination').last().attr()['class']?.trim() == 'page-item disabled';
    if (!hasDisabled)
        isLast = false;
    return isLast;
};
exports.isLastPage = isLastPage;
const decodeHTMLEntity = (str) => {
    return entities.decodeHTML(str);
};
const parseDate = (date) => {
    date = date.toUpperCase();
    let time;
    const number = Number((/\d*/.exec(date) ?? [])[0]);
    if (date.includes('LESS THAN AN HOUR') || date.includes('JUST NOW')) {
        time = new Date(Date.now());
    }
    else if (date.includes('YEAR') || date.includes('YEARS')) {
        time = new Date(Date.now() - (number * 31556952000));
    }
    else if (date.includes('MONTH') || date.includes('MONTHS')) {
        time = new Date(Date.now() - (number * 2592000000));
    }
    else if (date.includes('WEEK') || date.includes('WEEKS')) {
        time = new Date(Date.now() - (number * 604800000));
    }
    else if (date.includes('YESTERDAY')) {
        time = new Date(Date.now() - 86400000);
    }
    else if (date.includes('DAY') || date.includes('DAYS')) {
        time = new Date(Date.now() - (number * 86400000));
    }
    else if (date.includes('HOUR') || date.includes('HOURS')) {
        time = new Date(Date.now() - (number * 3600000));
    }
    else if (date.includes('MINUTE') || date.includes('MINUTES')) {
        time = new Date(Date.now() - (number * 60000));
    }
    else if (date.includes('SECOND') || date.includes('SECONDS')) {
        time = new Date(Date.now() - (number * 1000));
    }
    else {
        const split = date.split('-');
        time = new Date(Number(split[2]), Number(split[0]) - 1, Number(split[1]));
    }
    return time;
};

},{"entities":5,"paperback-extensions-common":13}]},{},[56])(56)
});
