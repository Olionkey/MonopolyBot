'use strict';
process.chdir(__dirname);
const fs = require('fs');
const crypto = require('crypto');
const db = require('..')('foo.db');

db.pragma('journal_mode = WAL');
db.prepare('DROP TABLE IF EXISTS article').run();
db.prepare(`CREATE TABLE article (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	peer INTEGER NOT NULL REFERENCES article(id) ON UPDATE CASCADE,
	country TEXT NOT NULL,
	language TEXT NOT NULL,
	title TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
	body TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
	summary TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
	nsfw INTEGER NOT NULL DEFAULT 0,
	created_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CHECK(LENGTH(country) = 2),
	CHECK(LENGTH(language) = 2),
	CHECK(nsfw IN (0, 1)),
	CHECK(created_date LIKE '____-__-__ __:__:__')
)`).run();
db.prepare('CREATE INDEX articles_by_title ON article (title)').run();
db.prepare('CREATE INDEX articles_by_created_date ON article (created_date)').run();

const rand = (a, b) => Math.floor(Math.random() * (b - a)) + a;
const insert = db.prepare(`INSERT INTO article (peer, country, language, title, body, summary, nsfw) VALUES (@peer, @country, @language, @title, @body, @summary, @nsfw)`);

for (let i = 0; i < 95; ++i) {
	insert.run({
		peer: i + 1,
		country: 'us',
		language: 'en',
		title: crypto.randomBytes(rand(60, 140)).toString('base64'),
		body: crypto.randomBytes(rand(1000, 20000)).toString('base64'),
		summary: crypto.randomBytes(rand(100, 800)).toString('base64'),
		nsfw: Math.round(Math.random()),
	});
}

setImmediate(() => {
	const walStat = fs.statSync('foo.db-wal');
	console.log(`wal size: ${Math.ceil(walStat.size / 4096)}/${db.pragma('wal_autocheckpoint', { simple: true })} pages`);
	
	const startTime = Date.now();
	db.checkpoint();
	const endTime = Date.now();
	
	console.log(`checkpoint time: ${endTime - startTime}ms`);
});
