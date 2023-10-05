import * as vscode from "vscode";
import { readFileSync, writeFileSync } from "fs";
import * as matter from "gray-matter";

export function getFilePath(uri?: vscode.Uri) {
  let filePath = uri?.fsPath;
  if (!filePath) {
    if (!vscode.window.activeTextEditor?.document) throw Error("没有打开的文件");

    if (vscode.window.activeTextEditor.document.languageId !== "markdown") throw Error("打开的不是Markdown文件");

    filePath = vscode.window.activeTextEditor.document.fileName;
  }
  return filePath;
}

export interface MatterData {
  id?: number;
  title?: string;
  labels?: string[];
}

export interface IssueData {
  content: string;
  data: MatterData;
}

export function parse(filePath: string): IssueData {
  if (!filePath) throw Error("未知的文件路径");

  const md = readFileSync(filePath, { encoding: "utf8" });
  return matter(md);
}

export function updateMDContent(filePath: string, issueData: IssueData) {
  const { content, data } = issueData;
  const md = matter.stringify(content, data);
  writeFileSync(filePath, md, { encoding: "utf8" });
}
