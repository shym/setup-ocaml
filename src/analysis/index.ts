import * as core from "@actions/core";

import { analysis } from "./analysis";

async function run() {
  try {
    await analysis();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

void run();
