import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    'database_init', Path(__file__).resolve().parents[1] / 'topuna-init-database.py'
)
database_init = importlib.util.module_from_spec(spec)
spec.loader.exec_module(database_init)


class FreshDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        for patcher in [
            patch.object(database_init, 'ENV_DIR', self.directory),
            patch.object(database_init.os, 'geteuid', return_value=0, create=True),
        ]:
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_existing_runtime_is_not_overwritten(self):
        path = self.directory / 'backend.env'
        path.write_text('EXISTING=value\n')
        with patch.object(database_init, 'postgres') as postgres:
            with self.assertRaisesRegex(SystemExit, 'refusing to overwrite'):
                database_init.main()
            postgres.assert_not_called()
        self.assertEqual(path.read_text(), 'EXISTING=value\n')

    def test_existing_database_is_not_replaced(self):
        with patch.object(database_init, 'postgres', return_value='1') as postgres:
            with self.assertRaisesRegex(SystemExit, 'Database topuna already exists'):
                database_init.main()
            self.assertEqual(postgres.call_count, 1)
        self.assertEqual(list(self.directory.iterdir()), [])

    def test_existing_role_credentials_are_not_rotated(self):
        with patch.object(database_init, 'postgres', side_effect=['', '1']) as postgres:
            with self.assertRaisesRegex(SystemExit, 'Role topuna_app already exists'):
                database_init.main()
            self.assertEqual(postgres.call_count, 2)
        self.assertEqual(list(self.directory.iterdir()), [])

    def test_env_write_is_exclusive(self):
        path = self.directory / 'backend.env'
        database_init.write_env(path, {'TEST': 'original'})
        with self.assertRaises(FileExistsError):
            database_init.write_env(path, {'TEST': 'replacement'})
        self.assertEqual(path.read_text(), 'TEST=original\n')

    def test_invalid_value_does_not_leave_partial_config(self):
        path = self.directory / 'backend.env'
        with self.assertRaises(ValueError):
            database_init.write_env(path, {'TEST': 'value\nOTHER=value'})
        self.assertFalse(path.exists())


if __name__ == '__main__':
    unittest.main()
