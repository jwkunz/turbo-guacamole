#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
OUTPUT_FILE="${DIST_DIR}/turbo_guacamole_single_file.html"

mkdir -p "${DIST_DIR}"

perl -0pe '
BEGIN {
  local $/;

  open my $css_fh, "<", "'"${ROOT_DIR}"'/styles.css" or die "Failed to read styles.css: $!";
  $css = <$css_fh>;
  close $css_fh;
  $css =~ s{</style>}{<\/style>}gi;

  open my $js_fh, "<", "'"${ROOT_DIR}"'/app.js" or die "Failed to read app.js: $!";
  $js = <$js_fh>;
  close $js_fh;
  $js =~ s{</script>}{<\\/script>}gi;
}

s{<link rel="stylesheet" href="styles.css" />}{"<style>\n$css\n</style>"}e;
s{<script src="app.js"></script>}{"<script>\n$js\n</script>"}e;
' "${ROOT_DIR}/index.html" > "${OUTPUT_FILE}"

echo "Packaged single-file app at ${OUTPUT_FILE}"
