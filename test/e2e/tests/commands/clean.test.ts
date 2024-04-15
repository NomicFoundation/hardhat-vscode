import assert from "assert";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import * as vscode from "vscode";
import { waitForUI } from "../../helpers/editor";
import { getRootPath } from "../../helpers/workspace";

suite("task - clean", function () {
  test("run clean task", async () => {
    // Close any active editor - since running a task saves the current file apparently
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

    // Create an artifacts folder to be cleaned up
    const artifactsPath = path.join(getRootPath(), "projects/main/artifacts");
    if (!existsSync(artifactsPath)) {
      mkdirSync(artifactsPath);
    }
    assert.ok(existsSync(artifactsPath));

    // Run clean task
    await vscode.commands.executeCommand("workbench.action.tasks.runTask", {
      type: "hardhat",
      task: "clean",
    });
    await waitForUI();

    await new Promise((resolve) => vscode.tasks.onDidEndTask(resolve));

    // Assert the artifacts were removed
    assert.ok(!existsSync(artifactsPath));
  });
});
