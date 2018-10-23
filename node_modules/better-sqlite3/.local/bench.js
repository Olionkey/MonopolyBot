'use strict';
process.chdir(__dirname);
const nodemark = require('nodemark');
const benchmark = (n, f) => console.log(`${n} x ${nodemark(f).toString('nanoseconds')}`);
const db = require('..')(':memory:');

db.aggregate('agg', {
	start: () => 0,
	step: (total, value) => total + value,
	result: total => Math.round(total),
});

db.exec('CREATE TABLE rows0 (x); CREATE TABLE rows100 (x); CREATE TABLE rows10000 (x);');
db.exec('INSERT INTO rows100 WITH RECURSIVE temp(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM temp LIMIT 100) SELECT x FROM temp');
db.exec('INSERT INTO rows10000 WITH RECURSIVE temp(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM temp LIMIT 10000) SELECT x FROM temp');
const stmt0 = db.prepare('SELECT agg(x) FROM rows0').pluck();
const stmt100 = db.prepare('SELECT agg(x) FROM rows100').pluck();
const stmt10000 = db.prepare('SELECT agg(x) FROM rows10000').pluck();

benchmark('0 rows', () => {
	return stmt0.get();
});

benchmark('100 rows', () => {
	return stmt100.get();
});

benchmark('10000 rows', () => {
	return stmt10000.get();
});
