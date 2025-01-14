import { window, ExtensionContext, commands, Uri } from "vscode";

const SURVEY_URL = "https://hardhat.org/solidity-survey-2024";
const SURVEY_COMPLETED_KEY = "soliditySurvey2024Completed";
const SURVEY_LAST_SEEN_KEY = "soliditySurvey2024LastSeen";
// Show the survey popup if the user hasn't seen it in the last 7 days
const SURVEY_COOLDOWN_PERIOD = 7 * 24 * 60 * 60 * 1000;
const SURVEY_END_DATE = Date.parse("2025-01-31 23:59:00 +0000");
const SURVEY_TEXT =
  "Please take a few minutes to complete the 2024 Solidity Survey";
const SURVEY_CTA = "Complete";

export async function showSoliditySurveyPopup({
  context,
}: {
  context: ExtensionContext;
}): Promise<void> {
  const now = new Date().getTime();

  if (now > SURVEY_END_DATE) {
    return;
  }

  const completed = context.globalState.get<boolean>(SURVEY_COMPLETED_KEY);

  if (completed === true) {
    return;
  }

  const lastSeen = context.globalState.get<number>(SURVEY_LAST_SEEN_KEY);

  if (lastSeen !== undefined && now > lastSeen + SURVEY_COOLDOWN_PERIOD) {
    return;
  }

  const item = await window.showInformationMessage(SURVEY_TEXT, SURVEY_CTA);

  await context.globalState.update(SURVEY_LAST_SEEN_KEY, now);

  if (item === SURVEY_CTA) {
    await commands.executeCommand("vscode.open", Uri.parse(SURVEY_URL));

    await context.globalState.update(SURVEY_COMPLETED_KEY, true);
  }
}
