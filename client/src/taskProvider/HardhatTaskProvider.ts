import * as vscode from "vscode";
import { Task } from "vscode";
import { isHardhatInstalled } from "../utils/hardhat";
import { findHardhatDirs } from "../utils/workspace";

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
  public async resolveTask(
    _task: vscode.Task,
    _token: vscode.CancellationToken
  ) {
    return undefined;
  }

  public async provideTasks(): Promise<Task[]> {
    const tasks: Task[] = [];

    for (const taskDef of TASKS) {
      const projectDirs = await findHardhatDirs();

      for (const projectDir of projectDirs) {
        if (!isHardhatInstalled(projectDir)) {
          continue;
        }

        const task = new Task(
          { type: TASK_TYPE, task: taskDef.name },
          vscode.TaskScope.Workspace,
          `${taskDef.name} - ${projectDir}`,
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
