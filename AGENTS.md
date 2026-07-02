# AGENTS.md

## Project

This is a Korean retirement pension DB/DC conversion simulator.

The first MVP compares:
- DB expected retirement benefit
- DC expected retirement benefit
- Difference
- Breakeven annual DC return rate

## Language

- User-facing text should be Korean.
- Code, function names, and comments may be English.
- Financial explanations should be clear and conservative.

## Tech stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- Calculation logic must be implemented as pure TypeScript functions.

## Architecture

Keep calculation logic separate from UI.

Preferred structure:

src/calculator/
- types.ts
- salary.ts
- db.ts
- dc.ts
- breakeven.ts
- simulate.ts
- index.ts

docs/
- calculation-policy.md

## Calculation assumptions for MVP

- Current salary means annual gross salary.
- Rates are decimals. Example: 0.03 means 3%.
- Money values are KRW numbers.
- DB simplified formula:
  DB amount = retirement salary / 12 * total years of service
- DC simplified formula:
  transfer amount + future DC contributions compounded by DC return rate
- Annual DC contribution = salary for that year / 12
- MVP excludes taxes, severance income tax, bonus, performance pay, wage peak system, ETF presets, Monte Carlo simulation, and inflation adjustment.

## Engineering rules

- Do not add backend, database, authentication, or external financial APIs in the MVP.
- Do not add chart libraries in PR 1.
- Keep functions deterministic and easy to test.
- Add tests for all calculator functions.
- Run tests before summarizing work.
- Explain any new dependency before adding it.
