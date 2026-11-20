/**
 * Release gate: lists everything that must be resolved before publishing.
 * Exits with status 1 while anything is open. Run with `npm run check:release`.
 */
import { getReleaseIssues } from '../src/lib/release.ts';

const issues = getReleaseIssues(process.env);

if (issues.length === 0) {
  console.log('Release check passed: no open items.');
} else {
  console.error(`Release check: ${issues.length} item(s) to resolve before publishing:\n`);
  for (const issue of issues) console.error(`  - [${issue.id}] ${issue.message}`);
  console.error('\nSee HANDOFF.md for owners and context.');
  process.exitCode = 1;
}
