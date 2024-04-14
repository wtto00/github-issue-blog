import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import * as matter from 'gray-matter'
import * as l10n from '@vscode/l10n'

export interface FileInfo {
  path: string
  isUntitled?: boolean
}

export interface MatterData {
  title?: string
  labels?: string[]
  assignees?: string[]
  issue_number?: number
}

export interface IssueData {
  content: string
  data: MatterData
}

export class FileUtil {
  issueData: IssueData
  uri: vscode.Uri

  constructor(uri: vscode.Uri) {
    this.uri = uri ?? vscode.window.activeTextEditor?.document.uri
    if (!uri) {
      // from command
      if (!vscode.window.activeTextEditor?.document) {
        throw Error(l10n.t('noFileOpened'))
      }

      if (vscode.window.activeTextEditor.document.languageId !== 'markdown') {
        throw Error(l10n.t('currentNotMD'))
      }

      this.issueData = matter(vscode.window.activeTextEditor.document.getText())
      return
    }
    // from menus
    if (uri.scheme === 'untitled') {
      // untitled
      const file = vscode.workspace.textDocuments.find((item) => item.isUntitled && item.fileName === uri.fsPath)
      if (!file) throw Error(`${l10n.t('fileNotFound')}${uri.fsPath}`)
      this.issueData = matter(file.getText())
      return
    }
    // file
    const file = vscode.workspace.textDocuments.find((item) => item.fileName === uri.fsPath)
    if (file) {
      this.issueData = matter(file.getText())
      return
    }

    const md = readFileSync(uri.fsPath, { encoding: 'utf8' })
    this.issueData = matter(md)
  }

  updateMDContent = async (overrideMatterData: MatterData, content?: string) => {
    if (vscode.window.activeTextEditor?.document.fileName !== this.uri.fsPath) {
      const document = await vscode.workspace.openTextDocument(this.uri)
      await vscode.window.showTextDocument(document)
    }
    const activeTextEditor = vscode.window.activeTextEditor
    if (activeTextEditor?.document.fileName !== this.uri.fsPath) return
    void activeTextEditor.edit((editBuilder) => {
      const originText = activeTextEditor.document.getText()
      this.issueData = matter(originText)
      const md = matter.stringify(
        { content: '\n' + (content ?? this.issueData.content).trimStart() },
        { ...this.issueData.data, ...overrideMatterData }
      )
      editBuilder.replace(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(originText.length, originText.length)),
        md
      )
    })
  }
}
