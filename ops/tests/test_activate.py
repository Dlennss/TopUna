import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location(
    'activate', Path(__file__).resolve().parents[1] / 'topuna-activate.py'
)
activate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(activate)
COMMIT = 'a' * 40


def elf(machine=b'\x3e\x00'):
    return b'\x7fELF\x02\x01' + bytes(12) + machine


class ActivationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.stage = self.base / 'staging'
        self.systemd = self.base / 'systemd'
        self.systemd.mkdir()
        for key, value in [('BASE', self.base), ('STAGE', self.stage), ('SYSTEMD', self.systemd)]:
            patcher = patch.object(activate, key, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        for name in [
            'frontend/server.js', 'frontend/.next/BUILD_ID',
            'frontend/public/topuna-assets/Topuna_Assets_Pecah/09_section_blocks/top_header_stack.png',
            'frontend/DEPLOY_COMMIT', 'frontend/public/deploy-version.txt',
            'backend/DEPLOY_COMMIT',
        ]:
            path = self.stage / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(COMMIT)
        (self.stage / 'backend/topuna-api').write_bytes(elf())

    def test_accepts_amd64(self):
        activate.validate_backend(self.stage / 'backend/topuna-api')

    def test_rejects_arm_and_invalid_binaries(self):
        for data in [elf(b'\xb7\x00'), b'MZ', b'\x7fELF\x01\x01' + bytes(12) + b'\x3e\x00']:
            with self.subTest(data=data):
                (self.stage / 'backend/topuna-api').write_bytes(data)
                with self.assertRaises(SystemExit):
                    activate.validate_backend(self.stage / 'backend/topuna-api')

    def test_rejects_mismatched_commits_before_switch(self):
        for name in ['backend/DEPLOY_COMMIT', 'frontend/public/deploy-version.txt']:
            with self.subTest(name=name):
                path = self.stage / name
                path.write_text('b' * 40)
                with patch.object(activate, 'run') as run, self.assertRaises(SystemExit):
                    activate.activate()
                run.assert_not_called()
                path.write_text(COMMIT)

    def test_rejects_incomplete_frontend(self):
        (self.stage / 'frontend/server.js').unlink()
        with self.assertRaises(SystemExit):
            activate.activate()

    def test_activates_new_paths_without_copying_env(self):
        (self.stage / 'frontend/.env.local').write_text('SECRET=not-for-release')
        with patch.object(activate, 'run') as run, \
                patch.object(activate.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0)), \
                patch.object(activate, 'fetch', return_value=COMMIT) as fetch:
            activate.activate()
        run.assert_any_call('systemctl', 'restart', 'topuna-be', 'topuna-web')
        fetch.assert_any_call('http://127.0.0.1:3103/deploy-version.txt')
        releases = list((self.base / 'releases').iterdir())
        self.assertEqual(len(releases), 1)
        self.assertFalse((releases[0] / 'frontend/.env.local').exists())
        content = (self.systemd / 'topuna-web.service.d/release.conf').read_text()
        self.assertIn('ExecStart=/usr/local/bin/node server.js', content)
        self.assertIn('PORT=3103', content)

    def test_health_failure_restores_old_frontend_and_stops_new_backend(self):
        dropin = self.systemd / 'topuna-web.service.d/release.conf'
        dropin.parent.mkdir()
        dropin.write_text('[Service]\nWorkingDirectory=/previous\n')
        previous = dropin.read_bytes()
        states = [subprocess.CompletedProcess([], 0), subprocess.CompletedProcess([], 3)]
        with patch.object(activate, 'run') as run, \
                patch.object(activate.subprocess, 'run', side_effect=states), \
                patch.object(activate, 'fetch', side_effect=OSError('offline')), \
                patch.object(activate.time, 'sleep'), self.assertRaises(RuntimeError):
            activate.activate()
        self.assertEqual(dropin.read_bytes(), previous)
        self.assertFalse((self.systemd / 'topuna-be.service.d/release.conf').exists())
        run.assert_any_call('systemctl', 'restart', 'topuna-web')
        run.assert_any_call('systemctl', 'stop', 'topuna-be')


if __name__ == '__main__':
    unittest.main()
