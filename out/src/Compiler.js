"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var Tag_1 = __importDefault(require("./xml/Tag"));
var Compiler = /** @class */ (function () {
    function Compiler(files, outDir) {
        if (outDir === void 0) { outDir = "./java_output"; }
        // files is a tree of read files. The first element of each array is the name of the directory
        this.files = files;
        this.outDir = outDir;
        try {
            fs_1.rmSync(outDir, { recursive: true });
        }
        catch (e) { }
        if (!fs_1.existsSync(outDir))
            fs_1.mkdirSync(outDir);
        this.readDir(files);
        process.exit(0);
    }
    Compiler.prototype.readDir = function (files) {
        console.log(files[0]);
        var path = files.splice(0, 1).at(0).replace(".", "").replace("/", "");
        if (!fs_1.existsSync(this.outDir + "/" + path))
            fs_1.mkdirSync(this.outDir + "/" + path);
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            if (Array.isArray(file)) {
                this.readDir(file);
                continue;
            }
            var tag = Tag_1.default.create(file);
            if (!tag || tag.name !== "file")
                continue;
            this.createFile(tag, this.outDir + "/" + path);
        }
    };
    Compiler.prototype.createFile = function (tag, path) {
        console.log(path);
    };
    return Compiler;
}());
exports.default = Compiler;
