# github-issue-blog

A vscode plugin to create blogs with issue.

[Github](https://github.com/wtto00/github-issue-blog)

## Install

- Search for `github issue blog` in the VS Code extension marketplace.
- Click on the [link](https://marketplace.visualstudio.com/items?itemName=wtto00.github-issue-blog), go to the official extension marketplace, and click on download to install.

## Configuration

| Key                    | Type   | Notes                     |
| ---------------------- | ------ | ------------------------- |
| github-issue-blog.repo | string | repository name of github |

If this configuration is not set, when executing the command, it will prompt the user to choose the repository associated with their GitHub account and configure it automatically.

## Usage

- Github Issue Blog: Create Issue
- Github Issue Blog: Update Issue
- Github Issue Blog: Sync Issue

1. Global command

   You can use `ctrl+shift+p` to open the command palette, then type `issue blog` to see these two commands.

   > `command+shift+p` on Mac

1. Explorer context menu

   In File Explorer, you can right-click on an `md` file and see these two commands.
   If you click on something other than an `md` file, you will not see it.

1. Editor context menu

   If the currently open editor is a markdown file, including unsaved draft files, right-clicking on the editor will display these two commands.

1. Editor title context menu

   In the editor, right-click on one of the markdown files in the open file tabs, and you will see these two commands.

### Variables in markdown files

```yml
---
title: issue-blog-title
labels:
  - bug
  - abcd
assignees:
  - "@wtto00"
  - wtto00
issue_number: 24
---
## Headline
```

| Name         | Type     | Notes                          |
| ------------ | -------- | ------------------------------ |
| title        | string   | Title of the blog post         |
| labels       | string[] | Labels of issue                |
| assignees    | string[] | User ID for Assignees of issue |
| issue_number | number   | Number of issue                |

- `title` is required when updating and creating an issue.
- `labels` are not mandatory, they will be automatically created if they do not exist when updating and creating an issue.
- `assignees` are not mandatory. The format for the assignee is `@<user_id>` or `<user_id>`.
- `issue_number` is required when updating and synchronizing an issue. When creating an issue, the `issue_number` will be automatically updated to the number of the issue that is created.
