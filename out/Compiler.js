"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var Compiler = /** @class */ (function () {
    function Compiler(files, outDir) {
        if (outDir === void 0) { outDir = "./java_output"; }
        // files is a tree of read files. The first element of each array is the name of the directory
        this.files = files;
        if (!fs_1.existsSync(outDir))
            fs_1.mkdirSync(outDir);
    }
    return Compiler;
}());
exports.Compiler = Compiler;
