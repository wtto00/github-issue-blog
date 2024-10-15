import * as vscode from 'vscode'
import * as Octokit from '@octokit/rest'
import { FileUtil } from './file'
import * as l10n from '@vscode/l10n'

export interface RepoInfo {
  owner: string
  repo: string
}

export interface GithubProps {
  octokit: Octokit.Octokit
  file: FileUtil
  repo: RepoInfo
}

export class Github {
  octokit: Octokit.Octokit
  file: FileUtil
  repo: RepoInfo

  constructor(props: GithubProps) {
    this.octokit = props.octokit
    this.file = props.file
    this.repo = props.repo
  }

  #checkTitle() {
    const { title = '' } = this.file.issueData.data || {}
    if (!title) {
      void this.file.updateMDContent({ title: '' })
      throw Error(l10n.t('titleEmpty'))
    }
  }

  #checkId() {
    const { issue_number: issueNumber } = this.file.issueData.data || {}
    if (!issueNumber) {
      void this.file.updateMDContent({ issue_number: 0 })
      throw Error(l10n.t('unkonwnIssue'))
    }
  }

  #getAssignees(assignees: string[]) {
    return assignees
      .map((assignee) => (assignee.startsWith('@') ? assignee.substring(1) : assignee))
      .filter((assignee) => assignee)
  }

  async createIssue() {
    const { content, data = {} } = this.file.issueData
    const { title = '', labels = [], assignees = [] } = data
    this.#checkTitle()

    const res = await this.octokit.rest.issues.create({
      owner: this.repo.owner,
      repo: this.repo.repo,
      title,
      body: content,
      labels: labels.filter((label) => label),
      assignees: this.#getAssignees(assignees),
    })
    if (!res.data) throw Error(l10n.t('createFail'))
    const number = res.data.number
    void this.file.updateMDContent({ issue_number: number })
    return res.data.html_url
  }

  async updateIssue() {
    const { content, data = {} } = this.file.issueData
    const { issue_number: issueNumber = 0, title, labels = [], assignees = [] } = data
    this.#checkId()
    const res = await this.octokit.rest.issues.update({
      owner: this.repo.owner,
      repo: this.repo.repo,
      issue_number: issueNumber,
      title,
      body: content,
      labels: labels.filter((label) => label),
      assignees: this.#getAssignees(assignees),
    })
    if (!res.data) throw Error(l10n.t('updateFail'))
    void this.file.updateMDContent({})
    return res.data.html_url
  }

  async syncIssue() {
    const { data = {} } = this.file.issueData
    const { issue_number: issueNumber = 0 } = data
    this.#checkId()
    const res = await this.octokit.rest.issues.get({
      owner: this.repo.owner,
      repo: this.repo.repo,
      issue_number: issueNumber,
    })
    if (!res.data) throw Error(l10n.t('syncFail'))
    void this.file.updateMDContent(
      {
        title: res.data.title,
        issue_number: issueNumber,
        labels: res.data.labels
          .map((label) => (typeof label === 'string' ? label : label.name!))
          .filter((label) => label),
        assignees: res.data.assignees?.map((assignee) => `@${assignee.login}`),
      },
      res.data.body ?? '',
    )
  }

  async getIssueList() {
    const res = await this.octokit.rest.issues.listForRepo({
      owner: this.repo.owner,
      repo: this.repo.repo,
    })
    console.log('getIssueList', res.data)
  }
}

export async function getRepo(octokit: Octokit.Octokit): Promise<RepoInfo> {
  const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration()
  let repository: string = configuration.get('github-issue-blog.repo') ?? ''
  if (!repository) {
    repository = await showRepoPicker(octokit)
    if (!repository) throw Error(l10n.t('slectRepository'))
    void configuration.update('github-issue-blog.repo', repository)
  }
  const [owner, repo] = repository.split('/')
  return { owner, repo }
}

const leftIcon = new vscode.ThemeIcon('arrow-left')
const rightIcon = new vscode.ThemeIcon('arrow-right')
const prevPageButton = { iconPath: leftIcon, tooltip: l10n.t('prePage') }
const nextPageButton = { iconPath: rightIcon, tooltip: l10n.t('nextPage') }

async function showRepoPicker(
  octokit: Octokit.Octokit,
  pageSize = 20,
  picker?: vscode.QuickPick<vscode.QuickPickItem>,
) {
  const page = picker?.step ?? 1
  const res = await octokit.rest.repos.listForAuthenticatedUser({ per_page: pageSize, page: page })
  console.log('listForAuthenticatedUser: ', res)
  const repoList = res.data
  return new Promise<string>((resolve, reject) => {
    if (!repoList) return reject(Error(l10n.t('getRepositoryFail')))
    if (repoList.length === 0) {
      if (page === 1) return reject(Error(l10n.t('noRepository')))
      // hide next page button
      picker!.buttons = [prevPageButton]
      picker!.busy = false
      return
    }
    if (!picker) {
      // vscode.window.show
      picker = vscode.window.createQuickPick()
      picker.step = 1
      picker.title = l10n.t('blogRepository')
      picker.placeholder = l10n.t('slectRepository')
      picker.onDidTriggerButton((button) => {
        picker!.busy = true
        if (button.iconPath === leftIcon) {
          picker!.step = picker!.step! - 1
        } else if (button.iconPath === rightIcon) {
          picker!.step = picker!.step! + 1
        }
        showRepoPicker(octokit, pageSize, picker)
      })
      picker.onDidHide(() => {
        if (picker!.selectedItems!.length === 0) {
          resolve('')
        }
      })
      picker.onDidChangeSelection(([selectedItem]) => {
        resolve(selectedItem.label)
        picker!.hide()
      })
      picker.show()
    }
    picker.items = repoList.map((item) => ({
      label: item.full_name,
      description: item.html_url,
      iconPath: new vscode.ThemeIcon('repo'),
    }))
    const buttons: vscode.QuickInputButton[] = []
    if (page > 1) buttons.unshift(prevPageButton)
    if (repoList.length === pageSize) buttons.push(nextPageButton)
    picker.buttons = buttons
    picker.busy = false
  })
}
