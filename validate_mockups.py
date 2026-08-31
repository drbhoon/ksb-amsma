from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import json
import re

ROOT = Path('/home/bobbyranka/amsma-redesign-mockups')
LIVING_LANDSCAPES = ROOT / 'concept-living-landscapes'
PAGES = [
    ROOT / 'index.html',
    ROOT / 'concept-foundation' / 'index.html',
    LIVING_LANDSCAPES / 'index.html',
    LIVING_LANDSCAPES / 'about' / 'index.html',
    LIVING_LANDSCAPES / 'committee' / 'index.html',
    LIVING_LANDSCAPES / 'contact' / 'index.html',
    ROOT / 'concept-national-network' / 'index.html',
]

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.text: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.tags: dict[str, int] = {}
    def handle_starttag(self, tag, attrs):
        self.tags[tag] = self.tags.get(tag, 0) + 1
        if tag in {'script', 'style', 'template'}:
            self.skip += 1
        for key, value in attrs:
            if value and key in {'src', 'href', 'poster'}:
                self.refs.append((key, value))
    def handle_endtag(self, tag):
        if tag in {'script', 'style', 'template'} and self.skip:
            self.skip -= 1
    def handle_data(self, data):
        if not self.skip:
            value = ' '.join(data.split())
            if value:
                self.text.append(value)

results = []
all_ok = True
for page in PAGES:
    item = {'page': str(page), 'exists': page.is_file(), 'issues': []}
    if not item['exists']:
        item['issues'].append('missing page')
        all_ok = False
        results.append(item)
        continue
    source = page.read_text(encoding='utf-8')
    parser = AuditParser()
    parser.feed(source)
    visible = ' '.join(parser.text)
    if re.search(r'\bpublications\b', visible, flags=re.I):
        item['issues'].append('forbidden visible label: Publications')
    if page != ROOT / 'index.html':
        is_living_landscapes = page == LIVING_LANDSCAPES / 'index.html' or LIVING_LANDSCAPES in page.parents
        if is_living_landscapes:
            for required in ('Home', 'About', 'Our Work', 'Committee', 'Contact'):
                if not re.search(rf'\b{required}\b', visible, flags=re.I):
                    item['issues'].append(f'missing visible {required} navigation label')
            if parser.tags.get('h1', 0) != 1:
                item['issues'].append('Living Landscapes route must have exactly one h1')
            if page == LIVING_LANDSCAPES / 'index.html' and parser.tags.get('video', 0) != 1:
                item['issues'].append('Living Landscapes landing must have one sequence video')
        else:
            for required in ('Landing', 'About'):
                if not re.search(rf'\b{required}\b', visible, flags=re.I):
                    item['issues'].append(f'missing visible {required} view label')
            if parser.tags.get('video', 0) < 1 and not re.search(r'video', visible, flags=re.I):
                item['issues'].append('no video element or video text equivalent')
        if parser.tags.get('h1', 0) < 1:
            item['issues'].append('no h1')
        if parser.tags.get('nav', 0) < 1:
            item['issues'].append('no nav landmark')
        if parser.tags.get('main', 0) < 1:
            item['issues'].append('no main landmark')
    broken = []
    for attr, ref in parser.refs:
        parsed = urlparse(ref)
        if parsed.scheme or ref.startswith(('#', '//', 'mailto:', 'tel:', 'javascript:')):
            continue
        rel = unquote(parsed.path)
        if not rel:
            continue
        target = (page.parent / rel).resolve()
        if not target.exists():
            broken.append({'attr': attr, 'ref': ref, 'resolved': str(target)})
    if broken:
        item['issues'].append({'broken_local_refs': broken})
    item['visible_chars'] = len(visible)
    item['tags'] = {k: parser.tags.get(k, 0) for k in ('h1', 'h2', 'nav', 'main', 'video', 'button', 'a')}
    item['ok'] = not item['issues']
    all_ok = all_ok and item['ok']
    results.append(item)

print(json.dumps({'ok': all_ok, 'results': results}, indent=2))
raise SystemExit(0 if all_ok else 1)
