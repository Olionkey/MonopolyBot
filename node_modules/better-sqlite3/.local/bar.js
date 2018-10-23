'use strict';
process.chdir(__dirname);
const db = require('..')(':memory:');
db.exec('create table expenses (dollars INTEGER, note TEXT, timestamp TEXT);');
db.exec('insert into expenses with recursive x(n) as (values(1) union all select n + 1 from x where n <= 25) select n, char(96 + n), datetime(CURRENT_TIMESTAMP, \'-\' || (CASE WHEN random() < 0 THEN 0 ELSE 1 END) || \' days\', \'-\' || n || \' hours\', \'+\' || n || \' minutes\', \'-\' || n || \' seconds\') from x');


// db.function('fn', (a, b) => {
// 	return a + b;
// });

// console.log(db.prepare('select fn(note, dollars) from expenses').pluck().all());


// db.aggregate('addAll', {
// 	start: 0,
// 	step: (total, nextValue) => total + nextValue,
// });

// console.log(db.prepare('SELECT addAll(dollars) FROM expenses').pluck().get());


db.aggregate('addAll', {
	start: 0,
	step: (total, nextValue) => total + nextValue,
	inverse: (total, droppedValue) => total - droppedValue,
	result: total => Math.round(total),
});

// console.log(db.prepare('SELECT addAll(dollars) FROM expenses').pluck().get());
console.log(db.prepare(`
	SELECT timestamp, dollars, addAll(dollars) OVER day as dayTotal
	FROM expenses
	WINDOW day AS (PARTITION BY date(timestamp))
	ORDER BY timestamp
`).all());
