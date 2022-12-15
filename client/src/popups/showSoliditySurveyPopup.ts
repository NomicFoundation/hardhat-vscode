import { window, ExtensionContext, commands, Uri } from "vscode";

const SHOW_SURVEY_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

// TODO: Remove this after 2023-01-07
export async function showSoliditySurveyPopup({
  context,
}: {
  context: ExtensionContext;
}): Promise<void> {
  const alreadyAnswered =
    context.globalState.get<boolean>("answered2022Survey") ?? false;
  const lastShown = context.globalState.get<number>("survey2022LastShown") ?? 0;

  if (alreadyAnswered || pastLimitDate() || shownRecently(lastShown)) {
    return;
  }

  const item = await window.showInformationMessage(
    "Please respond to the 2022 Solidity Developer Survey",
    "Respond"
  );

  // Store that we've shown the popup
  await context.globalState.update("survey2022LastShown", new Date().getTime());

  if (item === "Respond") {
    await commands.executeCommand(
      "vscode.open",
      Uri.parse(
        "https://blog.soliditylang.org/2022/12/07/solidity-developer-survey-2022-announcement/"
      )
    );

    // Store that the user answered the survey
    await context.globalState.update("answered2022Survey", true);
  }
}

function shownRecently(lastShown: number) {
  return new Date().getTime() - lastShown < SHOW_SURVEY_COOLDOWN;
}

function pastLimitDate(): boolean {
  return new Date().getTime() > Date.parse("2023-01-07 22:59:00 +0000");
}
