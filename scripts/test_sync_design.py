import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('sync_design', Path(__file__).with_name('sync_design.py'))
sync_design = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync_design)


class DesignImportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.root = self.base / 'repo'
        self.root.mkdir()
        sync_design.ROOT = self.root
        sync_design.MANIFEST = self.root / '.design-sync.json'
        (self.root / 'src').mkdir()
        (self.root / 'src/app.tsx').write_text('application remains intact')

    def tearDown(self):
        self.temporary.cleanup()

    def archive(self, name, entries):
        target = self.base / name
        with zipfile.ZipFile(target, 'w') as archive:
            for path, text in entries.items():
                archive.writestr(path, text)
        return target

    def test_sync_replaces_export_copies_instructions_and_preserves_code(self):
        first = self.archive('first.zip', {'design/README.md': 'v1', 'design/CLAUDE.md': 'rules\n', 'design/old.txt': 'old'})
        sync_design.sync(first)
        self.assertEqual((self.root / 'CLAUDE.md').read_bytes(), b'rules\n')
        second = self.archive('second.zip', {'design/README.md': 'v2', 'design/CLAUDE.md': 'new rules\n'})
        sync_design.sync(second)
        self.assertFalse((self.root / 'design/old.txt').exists())
        self.assertEqual((self.root / 'CLAUDE.md').read_bytes(), b'new rules\n')
        self.assertEqual((self.root / 'src/app.tsx').read_text(), 'application remains intact')

    def test_archive_traversal_is_rejected_before_mutation(self):
        bad = self.archive('bad.zip', {'../escape.txt': 'unsafe'})
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            sync_design.sync(bad)
        self.assertFalse((self.root / 'CLAUDE.md').exists())
        self.assertFalse((self.base / 'escape.txt').exists())

    def test_missing_instructions_preserves_existing_handoff(self):
        (self.root / 'design').mkdir()
        (self.root / 'design/README.md').write_text('existing')
        bad = self.archive('incomplete.zip', {'design/README.md': 'incomplete'})
        with self.assertRaises(ValueError):
            sync_design.sync(bad)
        self.assertEqual((self.root / 'design/README.md').read_text(), 'existing')

    def test_unzipped_folder_and_status(self):
        folder = self.base / 'export'
        folder.mkdir()
        (folder / 'README.md').write_text('read me')
        (folder / 'CLAUDE.md').write_text('rules')
        sync_design.sync(folder)
        sync_design.status()
        self.assertEqual(sync_design.files(self.root / 'design'), sync_design.files(folder))


if __name__ == '__main__':
    unittest.main()
