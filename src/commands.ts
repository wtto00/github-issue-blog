import * as vscode from "vscode";
import type { Credentials } from "./credentials";
import { getFilePath, parse } from "./file";
import { createIssue, getRepo } from "./github";
import * as open from "open";

export interface CommandParmas {
  uri?: vscode.Uri;
  credentials: Credentials;
}

export async function create(prams: CommandParmas) {
  let progressPos = 0;
  vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Create Issue" },
    async (progress) => {
      try {
        progress.report({ increment: 0, message: "获取博客文章文件..." });

        const { uri, credentials } = prams;
        const filePath = getFilePath(uri);

        progress.report({ increment: 20 - progressPos, message: "请求Github授权..." });
        progressPos = 20;
        const octokit = await credentials.getOctokit();
        if (!octokit) throw Error("未获得授权");

        progress.report({ increment: 40 - progressPos, message: "获取博客仓库..." });
        progressPos = 40;
        const repo = await getRepo(octokit);

        progress.report({ increment: 60 - progressPos, message: "解析文章内容..." });
        progressPos = 60;
        const issueData = parse(filePath);

        progress.report({ increment: 80 - progressPos, message: "创建仓库Issue..." });
        progressPos = 80;
        const url = await createIssue(octokit, repo, issueData, filePath);

        progress.report({ increment: 100 - progressPos, message: "创建Issue成功" });
        progressPos = 100;
        const btn = await vscode.window.showInformationMessage("创建Issue成功", "前往查看");
        if (btn === "前往查看") {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await open(url);
        }
      } catch (error) {
        progress.report({ increment: 100 - progressPos, message: "出错了" });
        vscode.window.showErrorMessage((error as Error).message);
      }
    }
  );
}

export async function update() {
  // todo
}

export async function list() {
  // todo
}
