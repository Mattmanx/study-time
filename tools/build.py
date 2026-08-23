"""Inline a project's src/ into a single self-contained index.html.

Usage: python3 tools/build.py <project-dir>
  <project-dir> holds src/app.html, src/manifest.txt, and either src/app.css
  or a src/styles.txt naming one or more stylesheets
"""
import os
import sys


def read_manifest(src, name="manifest.txt", default=None):
    path = os.path.join(src, name)
    if not os.path.exists(path):
        return list(default or [])
    names = []
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if line and not line.startswith("#"):
                names.append(line)
    return names


def read(src, name):
    with open(os.path.join(src, name)) as fh:
        return fh.read()


def build(project):
    src = os.path.join(project, "src")
    js = "\n".join(read(src, name) for name in read_manifest(src))
    css = "\n".join(read(src, name)
                    for name in read_manifest(src, "styles.txt", ["app.css"]))
    html = read(src, "app.html")
    for token, value in (("{{CSS}}", css), ("{{JS}}", js)):
        assert token in html, "missing %s in %s/app.html" % (token, src)
        html = html.replace(token, value)
    assert "{{" not in html, "unreplaced template token remains"
    out = os.path.join(project, "index.html")
    with open(out, "w") as fh:
        fh.write(html)
    print("wrote %s (%.1f KB)" % (out, os.path.getsize(out) / 1024.0))


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else ".")
