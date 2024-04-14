import * as vscode from 'vscode'
import { Command } from './commands'

export async function activate(context: vscode.ExtensionContext) {
  console.log('Extension "github-issue-blog" is now active!')

  const command = new Command(context)
  await command.init()

  const _createIssue = vscode.commands.registerCommand('github-issue-blog.create', command.createIssue)
  const _updateIssue = vscode.commands.registerCommand('github-issue-blog.update', command.updateIssue)
  const _syncIssue = vscode.commands.registerCommand('github-issue-blog.sync', command.syncIssue)

  context.subscriptions.push(_createIssue, _updateIssue, _syncIssue)
}

export function deactivate() {
  // do nothing
}
