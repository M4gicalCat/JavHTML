"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Tag = /** @class */ (function () {
    function Tag(name, props, children) {
        this._name = name;
        this._props = props;
        this._children = children;
        this._innerText = "";
        this._parent = null;
    }
    Tag.create = function (from) {
        var tags = [];
        // " or '
        var stringChar = "";
        var isComment = false;
        var isTag = false;
        var closingIndex = Infinity;
        for (var i = 0; i < from.length; i++) {
            if (i > closingIndex)
                isTag = false;
            var char = from.at(i);
            if (char === undefined)
                continue;
            var lastTag = tags.at(-1);
            if (lastTag && !lastTag.closed && !isTag && !isComment && (stringChar || char !== "<"))
                lastTag.tag._innerText += char;
            // commented
            if (isComment && from.substring(i, i + 3) !== "-->") {
                i = from.indexOf("-->", i) - 1;
                continue;
            }
            if (isComment && from.substring(i, i + 3) === "-->") {
                isComment = false;
                continue;
            }
            if (from.substring(i, i + 4) === "<!--") {
                isComment = true;
                i += 3;
                continue;
            }
            // in a string => useless
            if (stringChar && char !== stringChar)
                continue;
            //end of string
            if (stringChar && char === stringChar) {
                stringChar = "";
                continue;
            }
            // opens a string
            if (!stringChar && ["'", '"'].indexOf(char) !== -1) {
                stringChar = char;
                continue;
            }
            if (char === "<") {
                isTag = true;
                var indexOfSpace = from.indexOf(" ", i);
                var indexOfChevron = from.indexOf(">", i);
                var indexOfEndTag = from.indexOf("/>", i);
                closingIndex = Math.min(indexOfSpace === -1 ? Infinity : indexOfSpace, indexOfChevron === -1 ? Infinity : indexOfChevron, indexOfEndTag === -1 ? Infinity : indexOfEndTag);
                var name_1 = from.substring(i + 1, closingIndex);
                closingIndex = indexOfChevron;
                tags.push({ tag: new Tag(name_1, new Map(), []), closed: false, startIndex: i, endIndex: indexOfChevron });
                i += name_1.length - 1;
            }
            if (from.substring(i, i + 2) === "/>") {
                isTag = false;
                var unclosedTag = tags.at(-1);
                if (unclosedTag)
                    unclosedTag.closed = true;
            }
        }
        for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
            var t = tags_1[_i];
            if (!t.tag._name.startsWith("/"))
                Tag.getProps(t, from);
        }
        return Tag.getTag(tags);
    };
    /**
     * returns a tree of tags
     */
    Tag.getTag = function (tags) {
        var _a;
        var tag = null;
        var currents = [];
        for (var _i = 0, tags_2 = tags; _i < tags_2.length; _i++) {
            var t = tags_2[_i];
            // first tag
            if (!tag) {
                tag = t.tag;
                currents.push(t);
                continue;
            }
            // closing tag
            if (t.tag._name.startsWith("/")) {
                var name_2 = t.tag._name.substring(1);
                // removes all tags that are now closed
                while (currents.length > 0) {
                    var removed = currents.splice(currents.length - 1, 1)[0];
                    if (removed.tag._name === name_2)
                        break;
                }
                continue;
            }
            // inline tag
            if (t.closed) {
                (_a = currents.at(-1)) === null || _a === void 0 ? void 0 : _a.tag._children.push(t.tag);
                continue;
            }
            // starting tag
            for (var i = currents.length - 1; i >= 0; i--) {
                var c = currents[i];
                // doesn't have children
                if (c.closed)
                    continue;
                c.tag._children.push(t.tag);
                break;
            }
            currents.push(t);
        }
        return tag;
    };
    Tag.prototype.instantiateParents = function () {
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.parent = this;
            child.instantiateParents();
        }
    };
    Tag.getProps = function (tag, from) {
        var str = from.substring(tag.startIndex, tag.endIndex + 1);
        var index = str.indexOf(" ");
        if (index === -1)
            return;
        // get rid of the name
        str = str.trim().substring(index + 1).trim();
        // no props
        while (str !== ">" && str !== '/>' && str.length > 0) {
            var name_3 = str.substring(0, str.indexOf("="));
            str = str.substring(name_3.length + 1);
            var stringChar = str.at(0);
            var value = "";
            var i = 1;
            for (; i < str.length && str.at(i) !== stringChar; i++) {
                value += str.at(i);
            }
            tag.tag._props.set(name_3, value);
            str = str.substring(i + 1).trim();
        }
    };
    Tag.prototype.toJava = function (options) {
        switch (this._name) {
            case 'class':
                return this.getClassToJava();
            case 'file':
                return this.addTabs(this._children.map(function (c) { return c.toJava(__assign({}, options)); }).join("\n"));
            case 'new':
                return this.getNewToJava(options);
            default:
                return "";
        }
    };
    Tag.prototype.getClassToJava = function () {
        var _a;
        var string = "".concat((_a = "".concat(this._props.get("visibility"), " ")) !== null && _a !== void 0 ? _a : "", "class ").concat(this._props.get("name"), " {\n");
        // class variables
        var paramsParentIndex = this._children.findIndex(function (c) { return c.name === "params"; });
        if (paramsParentIndex !== -1) {
            var tag = this._children.splice(paramsParentIndex, 1)[0];
            for (var _i = 0, _b = tag.children; _i < _b.length; _i++) {
                var child = _b[_i];
                string += child.getVariableDefinitionToJava();
            }
        }
        // class body
        string += this._children.map(function (c) { return c.getMethodDefinitionToJava(); }).join("\n");
        return string + "}";
    };
    Tag.prototype.getVariableDefinitionToJava = function () {
        return "".concat(this._props.get('type'), " ").concat(this._name).concat(this._innerText.length > 0 ? " = ".concat(this._innerText) : "", ";\n");
    };
    Tag.prototype.getMethodDefinitionToJava = function () {
        var _a, _b;
        var visibility = this._props.get("visibility");
        if (visibility)
            visibility += " ";
        var str = "".concat(visibility).concat(this._props.get("static") === "true" ? "static " : "").concat((_a = this._props.get("type")) !== null && _a !== void 0 ? _a : "", " ").concat(this._name);
        str += "(";
        if (((_b = this._children[0]) === null || _b === void 0 ? void 0 : _b.name) === "params")
            str += this._children.splice(0, 1)[0]._children.map(function (c) { return c.getMethodParameterDefinitionJava(); }).join(", ");
        str += ") {\n";
        str += this._children.map(function (c) { return c.getMethodBodyJava({}); }).join("\n");
        return str + "\n}\n";
    };
    Tag.prototype.getMethodParameterDefinitionJava = function () {
        return this._props.get("type") + " " + this._name;
    };
    Tag.prototype.getMethodBodyJava = function (_a) {
        var _b = _a.end, end = _b === void 0 ? ";\n" : _b;
        if (this._name === "return") {
            return "return " + this._children[0].getMethodBodyJava({ end: "" }) + end;
        }
        if (this._name === "new") {
            return this.getNewToJava({ end: end });
        }
        if (this.children.length === 0) {
            if (this._props.get("type"))
                return this.getVariableDefinitionToJava();
            if (this._innerText.trim().length === 0)
                return this.getVariableCallJava();
            // variable reassign
            return this.getVariableReassignationJava({ end: end });
        }
        if (this._children[0]._name === "params")
            return this.getMethodCallJava() + end;
        return this.getVariableDefinitionToJava();
    };
    Tag.prototype.getVariableReassignationJava = function (_a) {
        var _b = _a.end, end = _b === void 0 ? ";\n" : _b;
        return "".concat(this._name, " = ").concat(this._innerText).concat(end);
    };
    Tag.prototype.getMethodCallJava = function () {
        var _a;
        return "".concat(this._name, "(").concat((_a = this.children[0]._children) === null || _a === void 0 ? void 0 : _a.map(function (c) { return c.getMethodBodyJava({ end: "" }); }).join(", "), ")");
    };
    Tag.prototype.getVariableCallJava = function () {
        return this._name;
    };
    Tag.prototype.addTabs = function (str) {
        var nbOpening = 0, arr = str.split("\n");
        for (var i = 0; i < arr.length; i++) {
            var string = arr[i];
            var tmp = 0;
            for (var _i = 0, _a = string.split(""); _i < _a.length; _i++) {
                var char = _a[_i];
                if (char === "{")
                    tmp++;
                if (char === "}")
                    nbOpening--;
            }
            for (var j = 0; j < nbOpening; j++)
                string = "\t" + string;
            nbOpening += tmp;
            arr[i] = string;
        }
        return arr.join("\n");
    };
    Tag.prototype.getNewToJava = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.end, end = _c === void 0 ? ";\n" : _c;
        console.log(this);
        return "new ".concat(this._children[0].getMethodCallJava()).concat(end);
    };
    Object.defineProperty(Tag.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tag.prototype, "props", {
        get: function () {
            return this._props;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tag.prototype, "children", {
        get: function () {
            return this._children;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tag.prototype, "innerText", {
        get: function () {
            return this._innerText;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Tag.prototype, "parent", {
        get: function () {
            return this._parent;
        },
        set: function (parent) {
            if (parent === this)
                return;
            this._parent = parent;
        },
        enumerable: false,
        configurable: true
    });
    return Tag;
}());
exports.default = Tag;
