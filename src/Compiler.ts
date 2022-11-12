import {existsSync, mkdirSync, rmSync, writeFileSync} from "fs";
import Tag from "./xml/Tag";

export default class Compiler {
  private readonly files: (string | [])[];
  private readonly outDir: string;

  constructor(files: (string | [])[], outDir = "./java_output") {
    // files is a tree of read files. The first element of each array is the name of the directory
    this.files = files;
    this.outDir = outDir;
    try {
      rmSync(outDir, {recursive: true});
    } catch (e) {
    }
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
    tag.instantiateParents();
    const name = tag.props.get("name");
    if (!name) return;
    const fileName = `${path}/${name.endsWith(".java") ? name : `${name}.java`}`;
    const payload = tag.toJava({
      inMethod: false,
    });
    writeFileSync(fileName, payload);
  }
}