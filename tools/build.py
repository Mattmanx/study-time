"""Inline a project's src/ into a single self-contained index.html.

Usage: python3 tools/build.py <project-dir>
  <project-dir> holds src/app.html, src/manifest.txt, and either src/app.css
  or a src/styles.txt naming one or more stylesheets

A src/manifest.txt line is normally the path of a JS file to inline. A line of
the form `NAME = path.json` instead reads that JSON data file and emits
`globalThis.NAME = <the data>;` at that position, so a subject's data can be a
pure data file and still ship inside a single offline page. Malformed JSON
fails the build, naming the file.
"""
import json
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


def read_json_binding(src, name, path):
    """Return `globalThis.NAME = <json>;` for a `NAME = path.json` manifest line.

    The JSON is re-serialized rather than passed through, so a malformed file
    fails the build here instead of silently shipping a page whose data does
    not parse. The two replacements below make the text safe inside a <script>
    element without changing any value: `<` cannot start `</script>` or `<!--`
    once escaped, and U+2028/U+2029 are legal in JSON but were illegal in JS
    string literals before ES2019.
    """
    full = os.path.join(src, path)
    with open(full, encoding="utf-8") as fh:
        text = fh.read()
    try:
        data = json.loads(text)
    except ValueError as exc:
        raise SystemExit("%s: invalid JSON: %s" % (full, exc))
    dumped = json.dumps(data, ensure_ascii=False, indent=2)
    dumped = dumped.replace("<", "\\u003c")
    dumped = dumped.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return "globalThis.%s = %s;\n" % (name, dumped)


def read_entry(src, entry):
    if "=" in entry:
        name, path = entry.split("=", 1)
        return read_json_binding(src, name.strip(), path.strip())
    return read(src, entry)


def build(project):
    src = os.path.join(project, "src")
    js = "\n".join(read_entry(src, entry) for entry in read_manifest(src))
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
