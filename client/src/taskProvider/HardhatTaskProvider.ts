import * as vscode from "vscode";
import { Task } from "vscode";
import { getCurrentHardhatDir } from "../utils/workspace";

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
  {
    name: "flatten",
    command: "flatten",
    detail: "Flattens and prints contracts and their dependencies",
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
    const currentHardhatDir = await getCurrentHardhatDir();

    if (currentHardhatDir === undefined) {
      return [];
    }

    return TASKS.map((taskDef) => {
      const task = new Task(
        { type: TASK_TYPE, task: taskDef.name },
        vscode.TaskScope.Workspace,
        taskDef.name,
        SOURCE,
        new vscode.ShellExecution("npx", ["hardhat", taskDef.command], {
          cwd: currentHardhatDir,
        })
      );

      task.detail = taskDef.detail;
      task.group = taskDef.group;

      return task;
    });
  }
}
