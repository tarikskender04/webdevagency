#!/usr/bin/env python3
"""Import an exported Claude design folder/ZIP without touching application code."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import tempfile
from datetime import datetime, timezone
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / '.design-sync.json'
IGNORE = {'.DS_Store', '__MACOSX', '.git', 'node_modules'}


def files(folder):
    result = {}
    for path in sorted(folder.rglob('*')):
        if any(part in IGNORE for part in path.relative_to(folder).parts):
            continue
        if path.is_symlink():
            raise ValueError(f'Symlinks are not supported: {path.name}')
        if path.is_file():
            result[path.relative_to(folder).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def extract(archive, destination):
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > 10000 or sum(entry.file_size for entry in entries) > 250_000_000:
            raise ValueError('Design archive exceeds the import size limit (250 MB / 10,000 entries).')
        for entry in entries:
            relative = PurePosixPath(entry.filename)
            if relative.is_absolute() or '..' in relative.parts or '\\' in entry.filename:
                raise ValueError('Unsafe archive path.')
            if stat.S_ISLNK(entry.external_attr >> 16):
                raise ValueError('Archive symlinks are not supported.')
            if any(part in IGNORE for part in relative.parts):
                continue
            bundle.extract(entry, destination)


def source_folder(folder):
    candidates = [folder, folder / 'design']
    candidates += [p.parent for p in folder.rglob('CLAUDE.md') if p.parent not in candidates]
    matches = [p for p in candidates if (p / 'README.md').is_file() and (p / 'CLAUDE.md').is_file()]
    if len(matches) != 1:
        raise ValueError('Export must contain exactly one design folder with README.md and CLAUDE.md.')
    return matches[0]


def status():
    if not MANIFEST.exists():
        print('No design export has been imported yet. Run npm run design:sync -- /path/to/export.zip')
        return
    manifest = json.loads(MANIFEST.read_text())
    current = files(ROOT / 'design')
    expected = manifest['files']
    changes = sorted(key for key in set(current) | set(expected) if current.get(key) != expected.get(key))
    print(f"Imported: {manifest['source']} at {manifest['importedAt']}")
    print('Design matches the imported snapshot.' if not changes else 'Design changes: ' + ', '.join(changes))
    if not (ROOT / 'CLAUDE.md').exists() or (ROOT / 'CLAUDE.md').read_bytes() != (ROOT / 'design/CLAUDE.md').read_bytes():
        print('Root CLAUDE.md differs from design/CLAUDE.md. Re-import to refresh it.')


def sync(source):
    source_label = source.name
    source = source.expanduser().resolve()
    if not source.exists():
        raise ValueError('Design source does not exist.')
    previous = json.loads(MANIFEST.read_text())['files'] if MANIFEST.exists() else {}
    with tempfile.TemporaryDirectory(prefix='.design-import-', dir=ROOT) as temporary:
        staging = Path(temporary)
        if source.is_file():
            extract(source, staging / 'unpacked')
            source = source_folder(staging / 'unpacked')
        else:
            source = source_folder(source)
        hashes = files(source)
        if any(source.joinpath(name).stat().st_size > 25_000_000 for name in hashes):
            raise ValueError('A design file exceeds 25 MB. Optimize large assets before importing.')
        if sum(source.joinpath(name).stat().st_size for name in hashes) > 250_000_000:
            raise ValueError('Design folder exceeds 250 MB.')
        staged_design = staging / 'design'
        staged_design.mkdir()
        for name in hashes:
            target = staged_design / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source / name, target)
        # Always copy exactly; shared engineering instructions live in AGENTS.md.
        claude_bytes = (staged_design / 'CLAUDE.md').read_bytes()
        backup = staging / 'previous-design'
        if (ROOT / 'design').exists():
            os.replace(ROOT / 'design', backup)
        try:
            os.replace(staged_design, ROOT / 'design')
        except Exception:
            if backup.exists():
                os.replace(backup, ROOT / 'design')
            raise
        (ROOT / 'CLAUDE.md').write_bytes(claude_bytes)
        MANIFEST.write_text(json.dumps({
            'version': 1,
            'source': source_label,
            'importedAt': datetime.now(timezone.utc).isoformat(),
            'files': hashes,
        }, indent=2) + '\n')
    added = sorted(set(hashes) - set(previous))
    removed = sorted(set(previous) - set(hashes))
    changed = sorted(key for key in set(hashes) & set(previous) if hashes[key] != previous[key])
    print(f'Imported {len(hashes)} files into design/. Root CLAUDE.md refreshed.')
    for label, names in [('Added', added), ('Changed', changed), ('Removed', removed)]:
        if names:
            print(f"{label}: {', '.join(names)}")
    print('Read design/README.md, review git diff, update docs/screen-map.json, then implement and push.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', nargs='?', type=Path)
    parser.add_argument('--status', action='store_true')
    args = parser.parse_args()
    try:
        if args.status:
            status()
        elif args.source:
            sync(args.source)
        else:
            parser.error('Provide a design folder or ZIP, or use --status.')
    except (ValueError, OSError, zipfile.BadZipFile, KeyError) as error:
        parser.exit(1, f'Design import failed: {error}\n')
