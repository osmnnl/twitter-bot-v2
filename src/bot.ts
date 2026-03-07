import { accounts } from "./data/accounts.js";
import { env } from "./config/env.js";

function main(): void {
  const stateBranch = env.stateBranch();

  console.log(
    JSON.stringify(
      {
        project: "twitter-bot-v2",
        accounts: accounts.length,
        stateBranch,
        status: "bootstrap-ready",
      },
      null,
      2,
    ),
  );
}

main();
