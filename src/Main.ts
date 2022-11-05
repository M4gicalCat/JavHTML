import process from "process";
import {lstatSync, readdirSync, readFileSync} from "fs";
import Compiler from "./Compiler";

const pathName = process.argv.find(a => a.startsWith("rootDir="))?.replace("rootDir=", "") ?? "./root";


const dir: (string | [])[] = readRecursive(pathName);

new Compiler(dir);

function readRecursive(path: string): (string | [])[] {
  const arr = [];
  arr.push(path);
  const files = readdirSync(path);
  for (const file of files) {
    if (lstatSync(`${path}/${file}`).isDirectory()) {
      arr.push(readRecursive(`${path}/${file}`) as []);
    } else if (file.endsWith(".xml")) {
      arr.push(readFileSync(`${path}/${file}`, {encoding: "utf-8"}));
    }
  }
  return arr;
}