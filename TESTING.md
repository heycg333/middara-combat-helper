# Combat Core Testing

This folder now includes a small UI-free combat math core and regression tests.

## Browser check

Open `tests/run-tests.html` from the static site root. It loads `../combat-core.js` and reports pass/fail results in the page.

## Node-style check

The same tests can run in a JavaScript runtime by loading `combat-core.js`, then `tests/combat-core.test.js`, and calling `MiddaraCombatCoreTests.runTests()`.

## Current coverage

- Rook high-roll attack vs Animate, including armor piercing, symbol spend, and armor.
- Animate melee attack vs Rook with Rook Plate reduction before armor.
- Force vs Conviction with effect immunity blocking Poison.
- Duplicate result application guard for repeated Apply clicks.

Keep these tests separate from the tablet play UI. The table-facing app should stay focused on the Play, Party, Enemies, Turn, Command, Rewards, and Data tabs.
