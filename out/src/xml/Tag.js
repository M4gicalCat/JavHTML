"use strict";
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
