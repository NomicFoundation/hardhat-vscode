import assert from "assert";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import * as vscode from "vscode";
import { waitForUI } from "../../helpers/editor";
import { sleep } from "../../helpers/sleep";
import { getRootPath } from "../../helpers/workspace";

suite("commands - clean", function () {
  this.timeout(30000);

  test("clean via command palette", async () => {
    // Close any active editor - since running a task saves the current file apparently
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

    // Create an artifacts folder to be cleaned up
    const artifactsPath = path.join(getRootPath(), "artifacts");
    if (!existsSync(artifactsPath)) {
      mkdirSync(artifactsPath);
    }
    assert.ok(existsSync(artifactsPath));

    // Run clean task
    await vscode.commands.executeCommand("workbench.action.tasks.runTask", {
      task: "hardhat: clean",
    });
    await waitForUI();

    await sleep(1000);

    await vscode.commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem"
    );
    await sleep(1000);

    await vscode.commands.executeCommand(
      "workbench.action.acceptSelectedQuickOpenItem"
    );

    // Wait for task to finish
    await new Promise((resolve) => vscode.tasks.onDidEndTask(resolve));

    // Assert the artifacts were removed
    assert.ok(!existsSync(artifactsPath));
  });
});
