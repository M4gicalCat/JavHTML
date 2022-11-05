import {existsSync, mkdirSync, rmSync, writeFileSync} from "fs";
import Tag from "./xml/Tag";
import reservedKeywords from "./Reserved";

export default class Compiler {
    private readonly files: (string | [])[];
    private readonly outDir: string;

    constructor(files: (string | [])[], outDir = "./java_output") {
        // files is a tree of read files. The first element of each array is the name of the directory
        this.files = files;
        this.outDir = outDir;
        try {
            rmSync(outDir, {recursive: true});
        } catch (e) {}
        if (!existsSync(outDir)) mkdirSync(outDir);
        this.readDir();
    }

    readDir(files = this.files) {
        const path = (files.splice(0, 1).at(0) as string).replace(".", "").replace("/", "");
        if (!existsSync(`${this.outDir}/${path}`)) mkdirSync(`${this.outDir}/${path}`);
        for (const file of files) {
            if (Array.isArray(file)) {
                this.readDir(file);
                continue;
            }
            const tag = Tag.create(file);
            if (!tag || tag.name !== "file") continue;
            this.createFile(tag, `${this.outDir}/${path}`);
        }
    }

    createFile(tag: Tag, path: string) {
        console.log(path);
        tag.instantiateParents();
        const name = tag.props.get("name");
        if (!name) return;
        const fileName = `${path}/${name.endsWith(".java") ? name : `${name}.java`}`;
        const payload = this.createJavaFile(tag);
        writeFileSync(fileName, payload);
    }

    createJavaFile(tag: Tag): string {
        let string = "";
        let endString = "";
        let needChildren = true;
        /* First part of the job, creates whatever the tag displays */

        switch (tag.name) {
            case 'class':
                string += `${`${tag.props.get("visibility")} ` ?? ""}class ${tag.props.get("name")} {\n`;
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
                let parent = tag;
                let isInMethod = false;
                while (parent.parent && !isInMethod) {
                    parent = parent.parent;
                    console.log(parent.name);
                    isInMethod = reservedKeywords.indexOf(parent.name) === -1;
                }
                // is a variable inside a method
                if (isInMethod) {
                    if (!!tag.props.get('type')) {
                        string += `${tag.props.get('type')} ${tag.name}`;
                        // method declaration parameter
                        if (tag.parent?.name === "params") {
                            string += (tag.parent?.children.at(-1) === tag ? ") {\n" : ', ');
                        // variable declaration
                        } else {
                            string += ` = ${tag.innerText};\n`;
                        }
                    } else if (!reservedKeywords.includes(tag.name)) {
                        // warning : variable = function();
                        if (tag.children.length === 0 && tag.parent?.name !== "params" && tag.innerText.length !== 0) {
                            // already declared variable, but reassigned
                            string += `${tag.name} = ${tag.innerText}`;
                        } else {
                            // method call
                            string += `${tag.name}(${tag.children.map(child => !reservedKeywords.includes(child.name) && this.createJavaFile(child)).filter(i => i).join(", ")});\n`;
                            needChildren = false;
                        }
                    } else if (tag.name === "return") {
                        string += "return ";
                        endString = ";\n";
                    }
                }
                // method declaration
                else if (tag.children[0]?.name === "params") {
                    string += `${`${tag.props.get("visibility")} ` ?? ""}${tag.props.get("static") === "true" ? "static " : ''}${tag.props.get("type") ?? "void "} ${tag.name}(`;
                    if (tag.children[0].children.length === 0) string += ") {\n";
                    endString = "}\n";
                }
        }

        /* Displays the tag's children, if any */
        if (needChildren) for (const child of tag.children) string += this.createJavaFile(child);

        /* Displays the end of the tag */
        if (endString.startsWith(";") && string.trimEnd().endsWith(";")) endString = endString.substring(1);
        string += endString;
        return string;
    }
}