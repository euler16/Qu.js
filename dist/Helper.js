"use strict";
exports.__esModule = true;
var math = require("mathjs");
function randomStr(length) {
    if (length === void 0) { length = 17; }
    var text = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    text += charset.charAt(Math.floor(Math.random() * charset.length));
    charset += "0123456789";
    for (var i = 0; i < length; i++) {
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return text;
}
exports.randomStr = randomStr;
function formatComplex2(re, im) {
    var xre = math.round(re, 8);
    var xim = math.round(im, 8);
    return (xre >= 0 ? " " : "-") + math.abs(xre).toFixed(8) + (xim >= 0 ? "+" : "-") + math.abs(xim).toFixed(8) + "i";
}
exports.formatComplex2 = formatComplex2;
;
function formatComplex(complex) {
    return formatComplex2(complex.re, complex.im);
}
exports.formatComplex = formatComplex;
;
function zeroes(n) {
    var matrix = [];
    for (var i = 0; i < n; i++) {
        matrix[i] = [];
        for (var j = 0; j < n; j++) {
            matrix[i][j] = 0;
        }
    }
    return matrix;
}
exports.zeroes = zeroes;
;
function identityMatrix(n) {
    var matrix = [];
    for (var i = 0; i < n; i++) {
        matrix[i] = [];
        for (var j = 0; j < n; j++) {
            matrix[i][j] = j == i ? 1 : 0;
        }
    }
    return matrix;
}
exports.identityMatrix = identityMatrix;
;
function makeControlled(U) {
    var m = U.length;
    var C = identityMatrix(m * 2);
    for (var i = 0; i < m; i++) {
        for (var j = 0; j < m; j++) {
            C[i + m][j + m] = U[i][j];
        }
    }
    return C;
}
exports.makeControlled = makeControlled;
;
//# sourceMappingURL=Helper.js.map