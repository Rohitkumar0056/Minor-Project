# WattWise Research Dashboard

A frontend-only research dashboard for presenting verified electricity-consumption forecasting results from Random Forest, XGBoost, and LSTM experiments.

## Run & Operate

- `pnpm --filter @workspace/wattwise run dev` — run the WattWise Vite app through its managed workflow
- In local PowerShell, set `$env:PORT = '5173'` and `$env:BASE_PATH = '/'` before running the dev command
- `pnpm --filter @workspace/wattwise run typecheck` — typecheck the WattWise frontend
- `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/wattwise run build` — build the frontend
- `pnpm run typecheck` — full workspace typecheck

## Stack

- pnpm workspace, React, TypeScript, Vite, Tailwind CSS
- Recharts for interactive charts; Lucide React for icons
- WattWise runs entirely in the browser and does not use the workspace API or database

## Where things live

- `artifacts/wattwise/src/data/projectData.ts` — typed source of truth for the supplied research data
- `artifacts/wattwise/src/App.tsx` — dashboard routes, page content, and interactions
- `artifacts/wattwise/src/index.css` — dashboard theme and responsive styles

## Architecture decisions

- Fixed experimental values are local and shared across all pages; do not duplicate or recompute them in components.
- Forecast series and anomaly labels/results were not supplied, so those sections explain availability and research status without generating substitutes.
- Model colors are consistent across charts: Random Forest blue, XGBoost teal, and LSTM violet.
- WattWise has no backend, database, external API calls, uploads, accounts, or model training.

## Product

Seven responsive pages present the dataset, model comparison, forecast-analysis availability, tree-model feature importance, LSTM architecture and training, exploratory residual statistics, and experimental methodology.

## User preferences

- Preserve research accuracy: do not invent observations, predictions, metrics, training-loss values, anomaly detections, timestamps, or evaluation scores.
- Distinguish power in watts from energy in kWh, and distinguish validation results from test results.

## Gotchas

- Vite requires `PORT` and `BASE_PATH`; the managed workflow supplies these for normal app runs. Set them in your shell for local runs.
- No timestamp-level prediction series or validated anomaly detector is available in the supplied results.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
