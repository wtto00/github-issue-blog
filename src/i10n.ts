import * as l10n from '@vscode/l10n'
import { resolve } from 'path'
import * as vscode from 'vscode'

export function initL10n() {
  let lPath = vscode.l10n.uri?.fsPath
  if (!lPath) {
    const uri = vscode.Uri.file(resolve(__dirname, '../l10n/bundle.l10n.json'))
    lPath = uri.fsPath
  }
  l10n.config({
    fsPath: lPath,
  })
}
