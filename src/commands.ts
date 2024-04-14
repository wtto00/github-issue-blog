import * as vscode from 'vscode'
import { Credentials } from './credentials'
import { FileUtil } from './file'
import { Github, getRepo } from './github'
import * as open from 'open'
import { initStatusBar } from './statusBar'
import { initL10n } from './i10n'
import * as l10n from '@vscode/l10n'

export interface CommandParmas {
  uri?: vscode.Uri
  credentials: Credentials
  statusBarItem: vscode.StatusBarItem
}

export class Command {
  #context: vscode.ExtensionContext
  #credentials: Credentials
  statusBarItem: vscode.StatusBarItem

  github?: Github

  constructor(context: vscode.ExtensionContext) {
    this.#context = context
    this.#credentials = new Credentials()
    this.statusBarItem = initStatusBar(this.#context.subscriptions)
  }

  async init() {
    await this.#credentials.initialize(this.#context)
    initL10n()
  }

  async prepare(uri: vscode.Uri) {
    this.statusBarItem.text = `$(sync~spin) ${l10n.t('getPostContent')}...`
    const file = new FileUtil(uri)

    this.statusBarItem.text = `$(sync~spin) ${l10n.t('requestAuth')}...`
    const octokit = await this.#credentials.getOctokit()
    if (!octokit) throw Error(l10n.t('unauthorized'))

    this.statusBarItem.text = `$(sync~spin) ${l10n.t('getRepository')}...`
    const repo = await getRepo(octokit)

    this.github = new Github({ octokit, repo, file })
  }

  createIssue = async (uri: vscode.Uri) => {
    try {
      this.statusBarItem.show()
      await this.prepare(uri)

      this.statusBarItem.text = `$(sync~spin) ${l10n.t('createIssue')}...`
      const url = await this.github!.createIssue()

      this.statusBarItem.hide()
      const btn = await vscode.window.showInformationMessage(l10n.t('createSuccess'), l10n.t('viewInBrowser'))
      if (btn) {
        await open(url)
      }
    } catch (error) {
      void vscode.window.showErrorMessage((error as Error).message)
      this.statusBarItem.hide()
    }
  }

  updateIssue = async (uri: vscode.Uri) => {
    try {
      this.statusBarItem.show()
      await this.prepare(uri)

      this.statusBarItem.text = `$(sync~spin) ${l10n.t('updateIssue')}...`
      const url = await this.github!.updateIssue()

      this.statusBarItem.hide()
      const btn = await vscode.window.showInformationMessage(l10n.t('updateSuccess'), l10n.t('viewInBrowser'))
      if (btn) {
        await open(url)
      }
    } catch (error) {
      void vscode.window.showErrorMessage((error as Error).message)
      this.statusBarItem.hide()
    }
  }

  syncIssue = async (uri: vscode.Uri) => {
    try {
      this.statusBarItem.show()
      await this.prepare(uri)

      this.statusBarItem.text = `$(sync~spin) ${l10n.t('syncIssue')}...`
      await this.github!.syncIssue()

      this.statusBarItem.hide()
      void vscode.window.showInformationMessage(l10n.t('syncSuccess'))
    } catch (error) {
      void vscode.window.showErrorMessage((error as Error).message)
      this.statusBarItem.hide()
    }
  }

  getIssueList = async (uri: vscode.Uri) => {
    try {
      this.statusBarItem.show()
      await this.prepare(uri)
    } catch (error) {
      void vscode.window.showErrorMessage((error as Error).message)
      this.statusBarItem.hide()
    }
  }
}
