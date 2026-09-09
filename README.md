# Solution Offerings Dashboard

React + Node.js application for pipeline, TCV, revenue and remedial actions.

## Windows installation

1. Install Node.js 22 or newer with npm.
2. Clone or download this repository and extract it to a folder.
3. Run `install.cmd` from that folder. It installs locked dependencies, runs the regression tests and TypeScript checks, and builds React.
4. Run `start.cmd`, then open http://127.0.0.1:3000.

No IIS or API key is required. Installation needs internet access for npm dependencies; the installed app runs locally. Stop the server with Ctrl+C. To update, stop it, pull the new code, rerun `install.cmd`, and restart.

For access from other computers on the customer network:

```bat
install.cmd --host 0.0.0.0 --port 8080
start.cmd
```

Open `http://SERVER-NAME:8080`. Allow the chosen port in the customer's firewall according to their network policy. This serves HTTP; use a customer-managed HTTPS gateway if required. The installer does not change firewall rules or create a Windows service. `runtime.config.json` stores host/port, is preserved on reinstall, and is excluded from Git. HOST and PORT environment variables override it.

For unattended startup, the customer can register `node.exe` with the absolute path to `server/index.mjs` in their existing process manager or Windows Task Scheduler. The server does not depend on the working directory.

## Commands

```sh
npm ci
npm test
npm run lint
npm run build
npm start
```

`npm run dev` starts Vite for development. `npm run preview` previews the compiled build. `npm run setup -- --port 8080` performs installation from npm. The Node production server serves `dist`, supports video byte-range requests, and exposes a read-only `/health` endpoint. Do not double-click `dist/index.html`.

## Data and testing

Edits and actions are saved in the current browser and URL origin. There is no shared database, authentication or multi-user synchronization. Use Export XL to back up or exchange test data. Clearing browser storage removes local edits. Quarters, including the full-year scenario, are separate datasets; the full-year scenario does not automatically aggregate edits to quarters.

Initial figures and generated opportunity details are demonstration data. The recorded video is illustrative and does not reflect live edits. INR display uses a fixed 8.35 crores per USD million. Exported numeric columns remain USD millions, as indicated by their headers. Export and Exec Brief cover the full selected quarter; dashboard row filters do not narrow them.

See [TESTING.md](TESTING.md) for customer acceptance scenarios and the workbook import contract.

## Import mapping

Import opens a review window before changing data. For a dashboard export, choose **Dashboard export** to validate all workbook sheets and stable IDs. For a flat source worksheet, choose **Map source columns**:

1. Select the sheet and header row, then map Offering, Sub-offering, Updated Offering, owner, the six AOP/actual metric columns, and optional remedial-plan columns. Numeric amounts must be USD millions.
2. Choose **Tag** (label only), **Parent–child** (Updated Offering becomes the financial parent; details retain their original Offering / Sub-offering path), or **Peer** (a named link without copying peer metrics).
3. Group tags/peers by Offering or Sub-offering. Parent–child groups by Updated Offering. Choose inclusive Excel source-row numbers after the header, excluding summary totals.
4. Click **Review mapping**. Validation runs in a Web Worker. Review the resulting groups, metrics and plans, then **Apply import**. Changing any option invalidates the previous review.

Apply replaces the selected quarter with the selected detail rows. It rejects duplicate rows, missing/invalid metrics, cyclic or conflicting parents, and action links that would become orphaned or ambiguous. Existing action IDs and details are preserved when their source rows can be matched; parent-only actions must have a single destination parent. New detail rows distribute metrics equally across regions; matched details retain their regional proportions. Relationship labels and source sheet/row provenance are saved and included in Excel exports. Mapped mode reads one source sheet; use dashboard-export mode to import the regional and action-registry sheets.

## Dependency installation

Use `npm ci` and the committed `package-lock.json`. SheetJS 0.20.3 is installed from its [official distribution](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/), with its checksum recorded in the lockfile. The old vulnerable npm `xlsx` release is not used.
