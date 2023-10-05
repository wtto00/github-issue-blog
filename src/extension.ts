import * as vscode from "vscode";
import { create, update, list } from "./commands";
import { Credentials } from "./credentials";

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "github-issue-blog" is now active!');

  const credentials = new Credentials();
  await credentials.initialize(context);

  const _createIssue = vscode.commands.registerCommand("github-issue-blog.create", (uri: vscode.Uri) =>
    create({ uri, credentials })
  );
  const _updateIssue = vscode.commands.registerCommand("github-issue-blog.update", update);
  const _getIssueList = vscode.commands.registerCommand("github-issue-blog.list", list);

  context.subscriptions.push(_createIssue, _updateIssue, _getIssueList);
}

export function deactivate() {
  // do nothing
}
