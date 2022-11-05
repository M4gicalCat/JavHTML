"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var Tag_1 = __importDefault(require("./xml/Tag"));
var Reserved_1 = __importDefault(require("./Reserved"));
var Compiler = /** @class */ (function () {
    function Compiler(files, outDir) {
        if (outDir === void 0) { outDir = "./java_output"; }
        // files is a tree of read files. The first element of each array is the name of the directory
        this.files = files;
        this.outDir = outDir;
        try {
            (0, fs_1.rmSync)(outDir, { recursive: true });
        }
        catch (e) { }
        if (!(0, fs_1.existsSync)(outDir))
            (0, fs_1.mkdirSync)(outDir);
        this.readDir();
    }
    Compiler.prototype.readDir = function (files) {
        if (files === void 0) { files = this.files; }
        var path = files.splice(0, 1).at(0).replace(".", "").replace("/", "");
        if (!(0, fs_1.existsSync)("".concat(this.outDir, "/").concat(path)))
            (0, fs_1.mkdirSync)("".concat(this.outDir, "/").concat(path));
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            if (Array.isArray(file)) {
                this.readDir(file);
                continue;
            }
            var tag = Tag_1.default.create(file);
            if (!tag || tag.name !== "file")
                continue;
            this.createFile(tag, "".concat(this.outDir, "/").concat(path));
        }
    };
    Compiler.prototype.createFile = function (tag, path) {
        console.log(path);
        tag.instantiateParents();
        var name = tag.props.get("name");
        if (!name)
            return;
        var fileName = "".concat(path, "/").concat(name.endsWith(".java") ? name : "".concat(name, ".java"));
        var payload = this.createJavaFile(tag);
        (0, fs_1.writeFileSync)(fileName, payload);
    };
    Compiler.prototype.createJavaFile = function (tag) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        var string = "";
        var endString = "";
        var needChildren = true;
        /* First part of the job, creates whatever the tag displays */
        switch (tag.name) {
            case 'class':
                string += "".concat((_a = "".concat(tag.props.get("visibility"), " ")) !== null && _a !== void 0 ? _a : "", "class ").concat(tag.props.get("name"), " {\n");
                endString = "}\n";
                break;
            case 'file':
            case 'if':
            case 'for':
            case 'while':
            case 'switch':
            case 'case':
                break;
            default:
                var parent_1 = tag;
                var isInMethod = false;
                while (parent_1.parent && !isInMethod) {
                    parent_1 = parent_1.parent;
                    console.log(parent_1.name);
                    isInMethod = Reserved_1.default.indexOf(parent_1.name) === -1;
                }
                // is a variable inside a method
                if (isInMethod) {
                    if (!!tag.props.get('type')) {
                        string += "".concat(tag.props.get('type'), " ").concat(tag.name);
                        // method declaration parameter
                        if (((_b = tag.parent) === null || _b === void 0 ? void 0 : _b.name) === "params") {
                            string += (((_c = tag.parent) === null || _c === void 0 ? void 0 : _c.children.at(-1)) === tag ? ") {\n" : ', ');
                            // variable declaration
                        }
                        else {
                            string += " = ".concat(tag.innerText, ";\n");
                        }
                    }
                    else if (!Reserved_1.default.includes(tag.name)) {
                        // warning : variable = function();
                        if (tag.children.length === 0 && ((_d = tag.parent) === null || _d === void 0 ? void 0 : _d.name) !== "params" && tag.innerText.length !== 0) {
                            // already declared variable, but reassigned
                            string += "".concat(tag.name, " = ").concat(tag.innerText);
                        }
                        else {
                            // method call
                            string += "".concat(tag.name, "(").concat(tag.children.map(function (child) { return !Reserved_1.default.includes(child.name) && _this.createJavaFile(child); }).filter(function (i) { return i; }).join(", "), ");\n");
                            needChildren = false;
                        }
                    }
                    else if (tag.name === "return") {
                        string += "return ";
                        endString = ";\n";
                    }
                }
                // method declaration
                else if (((_e = tag.children[0]) === null || _e === void 0 ? void 0 : _e.name) === "params") {
                    string += "".concat((_f = "".concat(tag.props.get("visibility"), " ")) !== null && _f !== void 0 ? _f : "").concat(tag.props.get("static") === "true" ? "static " : '').concat((_g = tag.props.get("type")) !== null && _g !== void 0 ? _g : "void ", " ").concat(tag.name, "(");
                    if (tag.children[0].children.length === 0)
                        string += ") {\n";
                    endString = "}\n";
                }
        }
        /* Displays the tag's children, if any */
        if (needChildren)
            for (var _i = 0, _h = tag.children; _i < _h.length; _i++) {
                var child = _h[_i];
                string += this.createJavaFile(child);
            }
        /* Displays the end of the tag */
        if (endString.startsWith(";") && string.trimEnd().endsWith(";"))
            endString = endString.substring(1);
        string += endString;
        return string;
    };
    return Compiler;
}());
exports.default = Compiler;
