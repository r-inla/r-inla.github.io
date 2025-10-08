#!/usr/bin/env bash
set -euo pipefail

# Update the pkgdown function reference from the hrue/r-inla repository.
# Run from the site repository root.

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
INLA_REPO="${ROOT_DIR}/r-inla"
PKG_DIR="${INLA_REPO}/rinla"
DOCS_SRC="${PKG_DIR}/docs"
DOCS_DEST="${ROOT_DIR}/learnmore/docs"
REFERENCE_DEST="${DOCS_DEST}/reference"

# Clone or update the upstream INLA repo.
if [[ ! -d "${INLA_REPO}/.git" ]]; then
  git clone --depth=1 https://github.com/hrue/r-inla "${INLA_REPO}"
else
  git -C "${INLA_REPO}" fetch --depth=1 origin master
  git -C "${INLA_REPO}" reset --hard origin/master
fi

# Ensure required R packages are available (pkgdown + fmesher).
Rscript --vanilla -e 'if (!requireNamespace("pkgdown", quietly = TRUE)) install.packages("pkgdown", repos = "https://cloud.r-project.org")'
Rscript --vanilla -e 'if (!requireNamespace("fmesher", quietly = TRUE)) install.packages("fmesher", repos = c("http://inlabru-org.r-universe.dev", "https://cloud.r-project.org"))'

# Build only the reference section; this is faster and avoids touching vignettes.
(
  cd "${PKG_DIR}"
  Rscript --vanilla -e 'pkgdown::build_reference(lazy = TRUE)'
)

# Copy the generated reference pages and the minimal assets they depend on.
mkdir -p "${REFERENCE_DEST}"
rsync -a --delete "${DOCS_SRC}/reference/" "${REFERENCE_DEST}/"

for asset in bootstrap-toc.css bootstrap-toc.js docsearch.css docsearch.js link.svg pkgdown.css pkgdown.js; do
  cp "${DOCS_SRC}/${asset}" "${DOCS_DEST}/${asset}"
done

# Drop the pkgdown version badges to keep the header clean.
find "${REFERENCE_DEST}" -name '*.html' -print0 \
  | xargs -0 sed -i '/<span class="version label label-default"/d'

# Ensure the reference pages load the custom INLA site overrides.
CUSTOM_LINK='<link rel="stylesheet" href="../reference-overrides.css">'
export REFERENCE_DEST CUSTOM_LINK
python3 <<'PY'
import os
import re
import html
from pathlib import Path

root = Path(os.environ["REFERENCE_DEST"])
injection = os.environ["CUSTOM_LINK"]

for path in root.rglob("*.html"):
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue

    text = re.sub(r"\s*<p></p>\s*<p>Developed by .*?</p>", "", original, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"\s*<p>Developed by .*?</p>", "", text, flags=re.IGNORECASE)

    if injection not in text:
        marker = '<link href="../pkgdown.css" rel="stylesheet">'
        if marker in text:
            text = text.replace(marker, marker + "\n    " + injection, 1)
        else:
            head_close = "</head>"
            if head_close not in text:
                continue
            text = text.replace(head_close, f"    {injection}\n{head_close}", 1)

    if text != original:
        path.write_text(text, encoding="utf-8")

index_path = root / "index.html"
topic_path = root / "inla.html"
if index_path.exists():
    index_original = index_path.read_text(encoding="utf-8")
    index_text = index_original

    description = "Core INLA model fitting routine."
    if topic_path.exists():
        try:
            topic_text = topic_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            topic_text = ""
        match = re.search(r'<div class="ref-description">\s*<p>(.*?)</p>', topic_text, flags=re.DOTALL)
        if match:
            extracted = html.unescape(match.group(1))
            extracted = re.sub(r'<[^>]+>', '', extracted)
            extracted = re.sub(r'\s+', ' ', extracted).strip()
            if extracted:
                description = extracted

    escaped_description = html.escape(description)

    if 'href="inla.html"' not in index_text and topic_path.exists():
        insertion = ("\n      <tr><td>\n"
                     "          <p><code><a href=\"inla.html\">inla</a></code> </p>\n"
                     "        </td>\n"
                     f"        <td><p>{escaped_description}</p></td>\n"
                     "      </tr>")

        marker = '<p><code><a href="INLA-package.html">INLA-package</a></code> <code><a href="INLA-package.html">INLA</a></code> </p>'
        marker_pos = index_text.find(marker)
        if marker_pos != -1:
            close_tr_pos = index_text.find('</tr>', marker_pos)
            if close_tr_pos != -1:
                close_tr_pos += len('</tr>')
                index_text = index_text[:close_tr_pos] + insertion + index_text[close_tr_pos:]

    pattern = (r'(<p><code><a href="inla.html">inla</a></code> </p>\s*</td>\s*<td><p>)(.*?)(</p></td>)')
    index_text, replaced = re.subn(pattern, r'\1' + escaped_description + r'\3', index_text, count=1, flags=re.DOTALL)

    if index_text != index_original:
        index_path.write_text(index_text, encoding="utf-8")
PY
