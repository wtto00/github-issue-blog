import * as vscode from "vscode";
import * as Octokit from "@octokit/rest";
import { updateMDContent, type IssueData } from "./file";

export interface RepoInfo {
  owner: string;
  repo: string;
}

export async function getRepo(octokit: Octokit.Octokit): Promise<RepoInfo> {
  const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
  let repository: string = configuration.get("github-issue-blog.repo") ?? "";
  if (!repository) {
    const res = await octokit.rest.repos.listForAuthenticatedUser();
    const repoList = res.data;
    if (!repoList) throw Error("获取仓库列表失败");

    if (repoList.length === 0) throw Error("您还没有创建Github仓库");

    const selectedItem = await vscode.window.showQuickPick(
      repoList.map((item) => ({ label: item.full_name, description: item.html_url })),
      {
        title: "博客仓库",
        placeHolder: "请选择博客的仓库",
      }
    );
    if (!selectedItem) throw Error("请选择博客的仓库");

    repository = selectedItem.label;
    configuration.update("github-issue-blog.repo", repository);
  }
  const [owner, repo] = repository.split("/");
  return { owner, repo };
}

export async function createIssue(
  octokit: Octokit.Octokit,
  repoInfo: RepoInfo,
  issueData: IssueData,
  filePath: string
) {
  const { content, data = {} } = issueData;
  const { title = "", labels = [] } = data;
  if (!title) {
    updateMDContent(filePath, { content, data: { ...data, title: "" } });
    throw Error("标题不能为空");
  }

  const res = await octokit.rest.issues.create({
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    title,
    body: content,
    labels: labels.map((label) => ({ name: label })),
  });
  if (!res.data) throw Error("创建Issue失败");
  const number = res.data.number;
  updateMDContent(filePath, { content, data: { ...data, id: number } });
  return res.data.html_url;
}
