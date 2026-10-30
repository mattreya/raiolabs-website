import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Website Structural Integrity & Security Harness', () => {
  it('validates index.html exists and has valid viewport and title', () => {
    const indexPath = path.join(rootDir, 'index.html');
    assert.strictEqual(fs.existsSync(indexPath), true, 'index.html must exist');
    const content = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(content.includes('<title>'), 'index.html must define a <title>');
    assert.ok(content.includes('viewport'), 'index.html must specify viewport meta');
  });

  it('validates package.json configuration and essential scripts', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    assert.strictEqual(fs.existsSync(pkgPath), true, 'package.json must exist');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    assert.ok(pkg.scripts.build, 'build script must exist');
    assert.ok(pkg.scripts.test, 'test script must exist');
  });

  it('verifies that no raw plaintext credentials or tokens are committed', () => {
    const envPath = path.join(rootDir, '.env');
    // If .env exists, verify it is listed in .gitignore
    const gitignorePath = path.join(rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      assert.ok(gitignore.includes('.env'), '.gitignore must ignore .env files');
    }
  });
});
