'use strict';
process.chdir(__dirname);
const fs = require('fs');
const assert = require('assert');
const db = require('..')('baz.db');

db.pragma('journal_mode = WAL');
db.exec(`
	DROP TABLE IF EXISTS data;
	CREATE TABLE data (x);
	INSERT INTO data (x) VALUES (1), (2), (3);
`);

assert(fs.existsSync('baz.db'), 'baz.db should exist');
assert(fs.existsSync('baz.db-wal'), 'baz.db-wal should exist');
process.exit();
