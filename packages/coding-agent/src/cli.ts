#!/usr/bin/env node
import { bootstrapRepiCli } from "./cli/repi-bootstrap.ts";
/**
 * CLI entry point for the refactored coding agent.
 * Uses main.ts with AgentSession and new mode modules.
 *
 * Test with: npx tsx src/cli-new.ts [args...]
 */
import { APP_NAME, IS_REPI_PRODUCT } from "./config.ts";
import { configureHttpDispatcher } from "./core/http-dispatcher.ts";
import { main } from "./main.ts";

process.title = APP_NAME;
process.env.REPI_CODING_AGENT = "true";
process.env.PI_CODING_AGENT = "true"; // compatibility flag for older extensions
process.emitWarning = (() => {}) as typeof process.emitWarning;

// Configure undici's global dispatcher before provider SDKs issue requests.
// Runtime settings are applied once SettingsManager has loaded global/project settings.
configureHttpDispatcher();

const cliArgs = IS_REPI_PRODUCT ? bootstrapRepiCli(process.argv.slice(2)) : process.argv.slice(2);
main(cliArgs);
