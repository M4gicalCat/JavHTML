"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var process_1 = __importDefault(require("process"));
var fs_1 = require("fs");
var Compiler_1 = __importDefault(require("./Compiler"));
var pathName = (_b = (_a = process_1.default.argv.find(function (a) { return a.startsWith("rootDir="); })) === null || _a === void 0 ? void 0 : _a.replace("rootDir=", "")) !== null && _b !== void 0 ? _b : "./root";
var dir = readRecursive(pathName);
new Compiler_1.default(dir);
function readRecursive(path) {
    var arr = [];
    arr.push(path);
    var files = (0, fs_1.readdirSync)(path);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        if ((0, fs_1.lstatSync)("".concat(path, "/").concat(file)).isDirectory()) {
            arr.push(readRecursive("".concat(path, "/").concat(file)));
        }
        else if (file.endsWith(".xml")) {
            arr.push((0, fs_1.readFileSync)("".concat(path, "/").concat(file), { encoding: "utf-8" }));
        }
    }
    return arr;
}
