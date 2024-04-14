import * as vscode from "vscode";
import * as Octokit from "@octokit/rest";
import { FileUtil } from "./file";
import * as l10n from "@vscode/l10n";

export interface RepoInfo {
  owner: string;
  repo: string;
}

export interface GithubProps {
  octokit: Octokit.Octokit;
  file: FileUtil;
  repo: RepoInfo;
}

export class Github {
  octokit: Octokit.Octokit;
  file: FileUtil;
  repo: RepoInfo;

  constructor(props: GithubProps) {
    this.octokit = props.octokit;
    this.file = props.file;
    this.repo = props.repo;
  }

  #checkTitle() {
    const { title = "" } = this.file.issueData.data || {};
    if (!title) {
      this.file.updateMDContent({ title: "" });
      throw Error(l10n.t("titleEmpty"));
    }
  }
  #checkId() {
    const { issue_number } = this.file.issueData.data || {};
    if (!issue_number) {
      this.file.updateMDContent({ issue_number: 0 });
      throw Error(l10n.t("unkonwnIssue"));
    }
  }
  #getAssignees(assignees: string[]) {
    return assignees
      .map((assignee) => (assignee.startsWith("@") ? assignee.substring(1) : assignee))
      .filter((assignee) => assignee);
  }

  async createIssue() {
    const { content, data = {} } = this.file.issueData;
    const { title = "", labels = [], assignees = [] } = data;
    this.#checkTitle();

    const res = await this.octokit.rest.issues.create({
      owner: this.repo.owner,
      repo: this.repo.repo,
      title,
      body: content,
      labels: labels.filter((label) => label),
      assignees: this.#getAssignees(assignees),
    });
    if (!res.data) throw Error(l10n.t("createFail"));
    const number = res.data.number;
    this.file.updateMDContent({ issue_number: number });
    return res.data.html_url;
  }

  async updateIssue() {
    const { content, data = {} } = this.file.issueData;
    const { issue_number = 0, title, labels = [], assignees = [] } = data;
    this.#checkId();
    const res = await this.octokit.rest.issues.update({
      owner: this.repo.owner,
      repo: this.repo.repo,
      issue_number: issue_number,
      title: title,
      body: content,
      labels: labels.filter((label) => label),
      assignees: this.#getAssignees(assignees),
    });
    if (!res.data) throw Error(l10n.t("updateFail"));
    this.file.updateMDContent({});
    return res.data.html_url;
  }

  async syncIssue() {
    const { data = {} } = this.file.issueData;
    const { issue_number = 0 } = data;
    this.#checkId();
    const res = await this.octokit.rest.issues.get({
      owner: this.repo.owner,
      repo: this.repo.repo,
      issue_number: issue_number,
    });
    if (!res.data) throw Error(l10n.t("syncFail"));
    this.file.updateMDContent(
      {
        title: res.data.title,
        issue_number,
        labels: res.data.labels
          .map((label) => (typeof label === "string" ? label : label.name!))
          .filter((label) => label),
        assignees: res.data.assignees?.map((assignee) => `@${assignee.login}`),
      },
      res.data.body || ""
    );
  }

  async getIssueList() {
    const res = await this.octokit.rest.issues.listForRepo({
      owner: this.repo.owner,
      repo: this.repo.repo,
    });
    console.log("getIssueList", res.data);
  }
}

export async function getRepo(octokit: Octokit.Octokit): Promise<RepoInfo> {
  const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
  let repository: string = configuration.get("github-issue-blog.repo") ?? "";
  if (!repository) {
    const res = await octokit.rest.repos.listForAuthenticatedUser();
    const repoList = res.data;
    if (!repoList) throw Error(l10n.t("getRepositoryFail"));

    if (repoList.length === 0) throw Error(l10n.t("noRepository"));

    const selectedItem = await vscode.window.showQuickPick(
      repoList.map((item) => ({ label: item.full_name, description: item.html_url })),
      {
        title: l10n.t("blogRepository"),
        placeHolder: l10n.t("slectRepository"),
      }
    );
    if (!selectedItem) throw Error(l10n.t("slectRepository"));

    repository = selectedItem.label;
    configuration.update("github-issue-blog.repo", repository);
  }
  const [owner, repo] = repository.split("/");
  return { owner, repo };
}
