import * as vscode from 'vscode'

export function initStatusBar (subscriptions: vscode.ExtensionContext['subscriptions']) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0)
  subscriptions.push(statusBarItem)
  return statusBarItem
}
