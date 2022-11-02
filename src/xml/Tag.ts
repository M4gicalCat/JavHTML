export default class Tag {
    private readonly _name: string;
    private _props: Map<string, string>;
    private readonly _children: Tag[];
    private constructor(name: string, props: Map<string, string>, children: Tag[]) {
        this._name = name;
        this._props = props;
        this._children = children;
    }

    public static create(from: string): Tag | null {
        const tags: {tag: Tag, closed: boolean, startIndex: number, endIndex: number}[] = [];
        // " or '
        let stringChar = "";
        let isComment = false;

        let propName = "";
        let propValue = "";
        for (let i = 0; i < from.length; i++) {
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
                i+= 3;
                continue;
            }
            const char = from.at(i);
            if (char === undefined) continue;
            // in a string => useless
            if (stringChar && char !== stringChar) continue;
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
                const indexOfSpace = from.indexOf(" ", i);
                const indexOfChevron = from.indexOf(">", i);
                const indexOfEndTag = from.indexOf("/>", i);
                const name = from.substring(i + 1, Math.min(indexOfSpace === -1 ? Infinity : indexOfSpace, indexOfChevron === -1 ? Infinity : indexOfChevron, indexOfEndTag === -1 ? Infinity : indexOfEndTag));
                tags.push({tag: new Tag(name, new Map(), []), closed: false, startIndex: i, endIndex: indexOfChevron});
                i += name.length -1;
            }
            if (from.substring(i, i + 2) === "/>") {
                const unclosedTag = tags.at(-1);
                if (unclosedTag) unclosedTag.closed = true;
            }
        }
        for (const t of tags) if (!t.tag._name.startsWith("/")) Tag.getProps(t, from);
        return Tag.getTag(tags);
    }

    public static getTag(tags: { tag: Tag, closed: boolean }[]): Tag | null {
        let tag = null;
        const currents = [];
        for (const t of tags) {
            // first tag
            if (!tag) {
                tag = t.tag;
                currents.push(t);
                continue;
            }
            // closing tag
            if (t.tag._name.startsWith("/")) {
                const name = t.tag._name.substring(1);
                // removes all tags that are now closed
                while (currents.length > 0) {
                    const removed = currents.splice(currents.length - 1, 1)[0];
                    if (removed.tag._name === name) break;
                }
                continue;
            }
            // inline tag
            if (t.closed) {
                currents.at(-1)?.tag._children.push(t.tag);
                continue;
            }
            // starting tag
            for (let i = currents.length - 1; i >= 0; i--) {
                const c = currents[i];
                // doesn't have children
                if (c.closed) continue;
                c.tag._children.push(t.tag);
                break;
            }
            currents.push(t);
        }
        return tag;
    }

    private static getProps(tag: { tag: Tag, startIndex: number, endIndex: number }, from: string): void {
        let str = from.substring(tag.startIndex, tag.endIndex + 1);
        const index = str.indexOf(" ");
        if (index === -1) return;
        // get rid of the name
        str = str.trim().substring(index + 1).trim();
        // no props
        while (str !== ">" && str !== '/>' && str.length > 0) {
            const name = str.substring(0, str.indexOf("="));
            str = str.substring(name.length + 1);
            const stringChar = str.at(0);
            let value = "";
            let i = 1
            for (; i < str.length && str.at(i) !== stringChar; i++) {
                value += str.at(i);
            }
            tag.tag._props.set(name, value);
            str = str.substring(i + 1).trim();
        }
    }


    get name(): string {
        return this._name;
    }

    get props(): Map<string, string> {
        return this._props;
    }

    get children(): Tag[] {
        return this._children;
    }
}