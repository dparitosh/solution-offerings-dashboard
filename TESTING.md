# Customer acceptance tests

1. Select Q2 and add a pipeline action from a practice under the third offering. Verify the exact offering, practice and quarter are selected. Save title, root cause, full plan, owner, lift, due date, priority and status. Verify the record appears under that parent/practice in Pipeline Gaps & Remedial Actions.
2. Add an offering-level action. Verify Entire offering is selected and the action appears outside the child practice sections. Reassign it to another offering/practice and verify it moves without leaving a duplicate.
3. Refresh: saved actions and edits remain. Switch quarters: the action must not appear in another quarter. Mark Done: progress becomes 100%.
4. Set practice revenue actual to zero. Verify zero and the recalculated gap/health. Edit regional actuals: practice and parent totals must update. Editing a total redistributes its regional values proportionally.
5. Combine owner, health and search filters. Rows must satisfy all filters.
6. Export XL and reimport in the same quarter. Verify numeric totals, zero values, IDs, parent links, root causes and full descriptions. Try an invalid parent/child link: import must fail without changing existing data.
7. Open Exec Brief: verify selected quarter, currency and portfolio totals. Priority initiatives must exclude completed actions and show parent/practice and root cause. Copy Summary or Download Summary should match the figures. Print Brief should print the report without the dashboard or modal controls.
8. Switch to INR: verify pipeline gaps and simulator amounts use INR crores. Select the Pipeline Gaps demo chapter and immediately switch to that layer; it should open correctly.

## Import contract

Use Export XL as the template. Import replaces the selected quarter transactionally; select the matching quarter first. Keep each offering row followed by its children. Keep Offering ID and Sub-Offering ID consistent across sheets. Each child needs all six AOP/actual metric fields.

Blank sub-offering ID and name in Remedial Actions mean Entire offering. An empty supplied registry clears actions; omitting the sheet retains existing actions only if their links remain valid. A supplied Regional Breakdown sheet must contain all four regions per practice and totals matching the master. Remove that sheet when updating master totals alone to redistribute regions automatically.

Registry actions and free-text remedial summaries are separate records; both appear under their appropriate scope. Parent totals, gaps and health are recalculated from children. Mixed quarters, missing fields, negative/non-numeric values and invalid links produce an error.

## Test scope

Automated regression tests cover data calculations, filters, parent links, all-quarter workbook round trips, invalid imports, executive summary content, browser storage and Node HTTP serving (including video seeking). Browser checks cover creation, reassignment, persistence, quarter isolation and zero/regional edits. The dashboard contains demo data and generated example opportunity details; it has no shared backend database or CRM feed.
# Mapping workflow acceptance

- Choose two detail sheets with different header-row positions. Verify headers and sample values are suggested independently, and each worksheet retains its mappings when switching tabs.
- Use Copy mapping to selected sheets. Identical headers should copy; unmatched headers stay empty, and row ranges remain unchanged.
- Review both sheets together. Verify the combined totals, source sheet/row provenance and existing action parents; a duplicate detail across sheets must block the whole import.
- Change a sheet selection after a valid review. Apply must be disabled until the changed selection is reviewed again.

- Import a flat source workbook. Check column suggestions, change the header row, and use Read headers to refresh the choices.
- Map all six metrics, including zero actuals. Review tags and peers: totals must count each selected detail once.
- Select parent–child: Updated Offering becomes the parent, with the original offering/sub-offering path shown in its details.
- Narrow the source-row range. Existing actions outside the replacement must block Apply with a named error.
- Review a valid scope, then change a relationship or column. Apply must remain disabled until another successful review.
- Validate parent cycles, duplicate rows and duplicate column assignments; no partial data may be applied.
- Apply a valid mapping. Export and reimport in dashboard-export mode; relationship, source-row provenance, metrics and action parents must survive.
- Close the mapping window during validation; no import should be applied. Keyboard Tab stays in the dialog; Escape closes it.
