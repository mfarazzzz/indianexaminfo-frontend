/**
 * TestPageBanner — the unmistakable "this is sample data" label on a reference
 * TEST page's OWN view. Rendered by EntityDetailPage (and the sarkari content-
 * type view) whenever the record's slug is a test slug (lib/testContent).
 *
 * The aggregate surfaces already EXCLUDE test rows entirely; this banner is for
 * the direct-URL case the owner asked for, where the page must still be honest
 * that nothing on it is real. It is deliberately loud and non-dismissible.
 */
export function TestPageBanner() {
  return (
    <div
      role="note"
      data-testid="test-page-banner"
      className="mb-4 rounded-[10px] border-2 border-dashed border-amber-500 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
    >
      TEST PAGE — sample data, not real information
    </div>
  );
}
