import path from "path";
import * as vscode from "vscode";
import { Task } from "vscode";
import { ExtensionState } from "../types";
import { isHardhatInstalled } from "../utils/hardhat";

const TASKS = [
  {
    name: "compile",
    command: "compile",
    detail: "Compile hardhat project",
    group: vscode.TaskGroup.Build,
  },
  {
    name: "test",
    command: "test",
    detail: "Run hardhat tests",
    group: vscode.TaskGroup.Test,
  },
  {
    name: "clean",
    command: "clean",
    detail: "Clear hardhat cache and artifacts",
    group: vscode.TaskGroup.Clean,
  },
];

const TASK_TYPE = "hardhat";
const SOURCE = "hardhat";

export class HardhatTaskProvider implements vscode.TaskProvider {
  constructor(public state: ExtensionState) {}

  public async resolveTask(
    _task: vscode.Task,
    _token: vscode.CancellationToken
  ) {
    return undefined;
  }

  public async provideTasks(): Promise<Task[]> {
    const tasks: Task[] = [];

    // Used for matching projects to workspace folders
    // These are sorted by length descending, to match longest path first
    const sortedWorkspaceFolders = (vscode.workspace.workspaceFolders || [])
      .map((f) => f)
      .sort((a, b) => b.uri.fsPath.length - a.uri.fsPath.length);

    for (const taskDef of TASKS) {
      // Provide a set of tasks for each project where hardhat is installed
      for (const projectDir of this.state.hardhatProjects) {
        if (!isHardhatInstalled(projectDir)) {
          continue;
        }

        // Determine the workspace folder a project belongs to, by path matching
        const workspaceFolder = sortedWorkspaceFolders.find((folder) =>
          projectDir.startsWith(folder.uri.fsPath)
        );

        if (workspaceFolder === undefined) {
          continue;
        }

        const relativePathInWorkspace = path.relative(
          workspaceFolder.uri.fsPath,
          projectDir
        );

        const taskName = taskDef.name.concat(
          relativePathInWorkspace.length > 0
            ? ` - ${relativePathInWorkspace}`
            : ""
        );

        const task = new Task(
          { type: TASK_TYPE, task: taskDef.name },
          workspaceFolder,
          taskName,
          SOURCE,
          new vscode.ShellExecution("npx", ["hardhat", taskDef.command], {
            cwd: projectDir,
          })
        );

        task.detail = taskDef.detail;
        task.group = taskDef.group;

        tasks.push(task);
      }
    }

    return tasks;
  }
}
