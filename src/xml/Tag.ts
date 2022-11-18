import {toJavaOptions} from "../types/toJavaOptions";

export default class Tag {
  private readonly _name: string;

  private _innerText: string;
  private _props: Map<string, string>;
  private readonly _children: Tag[];

  private _parent: Tag | null;

  private constructor(name: string, props: Map<string, string>, children: Tag[]) {
    this._name = name;
    this._props = props;
    this._children = children;
    this._innerText = "";
    this._parent = null;
  }

  public static create(from: string): Tag | null {
    const tags: { tag: Tag, closed: boolean, startIndex: number, endIndex: number }[] = [];
    // " or '
    let stringChar = "";
    let isComment = false;
    let isTag = false;
    let closingIndex = Infinity;

    for (let i = 0; i < from.length; i++) {
      if (i > closingIndex) isTag = false;
      const char = from.at(i);
      if (char === undefined) continue;
      const lastTag = tags.at(-1);
      if (lastTag && !lastTag.closed && !isTag && !isComment && (stringChar || char !== "<")) lastTag.tag._innerText += char;
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
        isTag = true;
        const indexOfSpace = from.indexOf(" ", i);
        const indexOfChevron = from.indexOf(">", i);
        const indexOfEndTag = from.indexOf("/>", i);
        closingIndex = Math.min(indexOfSpace === -1 ? Infinity : indexOfSpace, indexOfChevron === -1 ? Infinity : indexOfChevron, indexOfEndTag === -1 ? Infinity : indexOfEndTag);
        const name = from.substring(i + 1, closingIndex);
        closingIndex = indexOfChevron;
        tags.push({tag: new Tag(name, new Map(), []), closed: false, startIndex: i, endIndex: indexOfChevron});
        i += name.length - 1;
      }
      if (from.substring(i, i + 2) === "/>") {
        isTag = false;
        const unclosedTag = tags.at(-1);
        if (unclosedTag) unclosedTag.closed = true;
      }
    }
    for (const t of tags) if (!t.tag._name.startsWith("/")) Tag.getProps(t, from);
    return Tag.getTag(tags);
  }

  /**
   * returns a tree of tags
   */
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

  public instantiateParents(): void {
    for (const child of this.children) {
      child.parent = this;
      child.instantiateParents();
    }
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

  public toJava(options: toJavaOptions): string {
    switch (this._name) {
      case 'class':
      case 'interface':
        return this.getClassToJava();
      case 'file':
        return this.addTabs(this._children.map(c => c.toJava({...options})).join("\n"));
      case 'record':
        return this.getRecordToJava();
      default:
        return "";
    }
  }

  private getClassToJava(): string {
    const isAbstract = this._props.get("abstract") === "true";
    let visibility = this._props.get("visibility");
    visibility = visibility ? visibility + " " : "";
    let _extends = this._props.get("extends");
    _extends = _extends ? " extends " + _extends + " " : "";
    let _implements = this._props.get("implements");
    _implements = _implements ? "implements " + _implements + " " : "";
    let string = `${visibility}${isAbstract ? "abstract " : ""}${this._name} ${this._props.get("name")}${_extends}${_implements} {\n`;

    // class variables
    const paramsParentIndex = this._children.findIndex(c => c.name === "params");
    if (paramsParentIndex !== -1) {
      const tag = this._children.splice(paramsParentIndex, 1)[0];
      for (const child of tag.children) {
        string += child.getVariableDefinitionToJava();
      }
    }

    // class body
    string += this._children.map(c => c.getMethodDefinitionToJava()).join("\n");

    return string + "}";
  }

  private getVariableDefinitionToJava(): string {
    let type = this._props.get("type");
    type = type ? type + " " : "";
    const isFinal = this._props.get("final") === "true";
    const isStatic = this._props.get("static") === "true";
    let visibility = this._props.get("visibility");
    visibility = visibility ? visibility + " " : "";
    return `${visibility}${type}${isFinal ? "final " : ""}${isStatic ? "static " : ""}${this._name}${this._innerText.length > 0 ? ` = ${this._innerText}` : ""};\n`;
  }

  private getMethodDefinitionToJava() {
    // check if the method is abstract or not
    const isAbstract = this._props.get("abstract") === "true";
    let visibility = this._props.get("visibility");
    if (visibility) visibility += " ";
    let str = `${visibility}${this._props.get("static") === "true" ? "static " : ""}${this._props.get("type") ?? ""} ${isAbstract ? "abstract " : ""} ${this._name}`;
    str += "(";
    if (this._children[0]?.name === "params") str += this._children.splice(0, 1)[0]._children.map(c => c.getMethodParameterDefinitionJava()).join(", ");
    str += ") {\n";
    str += this._children.map(c => c.getMethodBodyJava({})).join("\n");
    return str + "\n}\n";
  }

  private getMethodParameterDefinitionJava() {
    return this._props.get("type") + " " + this._name;
  }

  private getMethodBodyJava({end = ";\n"}): string {
    if (this._name === "return") {
      return "return " + this._children[0].getMethodBodyJava({end: ""}) + end;
    }
    if (this._name === "new") {
      return this.getNewToJava({end});
    }
    if (this.children.length === 0) {
      if (this._props.get("type")) return this.getVariableDefinitionToJava();
      if (this._innerText.trim().length === 0) return this.getVariableCallJava();
      // variable reassign
      return this.getVariableReassignationJava({end});
    }
    if (this._children[0]._name === "params") return this.getMethodCallJava() + end;
    return this.getVariableDefinitionToJava();
  }

  private getVariableReassignationJava({end = ";\n"}): string {
    return `${this._name} = ${this._innerText}${end}`;
  }

  private getMethodCallJava(): string {
    return `${this._name}(${this.children[0]._children?.map(c => c.getMethodBodyJava({end: ""})).join(", ")})`;
  }

  private getVariableCallJava() {
    return this._name;
  }

  private addTabs(str: string): string {
    let nbOpening = 0,
        arr = str.split("\n");
    for (let i = 0; i < arr.length; i++) {
      let string = arr[i];
      let tmp = 0;
      for (let char of string.split("")) {
        if (char === "{") tmp++;
        if (char === "}") nbOpening--;
      }
      for (let j = 0; j < nbOpening; j++) string = "\t" + string;
      nbOpening += tmp;
      arr[i] = string;
    }
    return arr.join("\n");
  }

  private getNewToJava({end = ";\n"} = {}): string {
    return `new ${this._children[0].getMethodCallJava()}${end}`;
  }

  private getRecordToJava(): string {
    let visibility = this._props.get("visibility");
    visibility = visibility ? visibility + " " : "";
    let str = `${visibility}record ${this._props.get("name")}(${this._children[0]._children.map(c => c.getMethodParameterDefinitionJava()).join(", ")}) {\n`;
    str += this._children.slice(1).map(c => c.getMethodBodyJava({})).join("");
    return str + "\n}\n";
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

  get innerText(): string {
    return this._innerText;
  }

  get parent(): Tag | null {
    return this._parent;
  }

  set parent(parent: Tag | null) {
    if (parent === this) return;
    this._parent = parent;
  }
}