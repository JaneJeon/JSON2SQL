const fs = require('fs'),
os = require('os'),
path = require('path'),
Sequelize = require('sequelize'),
f = require('./helper'),

// defaults
opts = {
	dialect: 'postgres',
	host: 'localhost',
	database: os.userInfo().username,
	username: os.userInfo().username,
	password: null,
	limit: 1000
}
Object.assign(opts, require('minimist')(process.argv.slice(2)))

const db = new Sequelize({
	dialect: opts.dialect.toLowerCase(),
	host: opts.host,
	database: opts.database,
	username: opts.username,
	password: opts.password,
	logging: false,
	operatorsAliases: false
	// if additional parameters are needed, pass them in via command-line arguments
}),
// MySQL represents NULLs differently
mysql = db.dialect.name === 'mysql'

db.authenticate()
	.catch(err => {
		f.printErr(err)
		process.exit(1)
	})

Promise.all(
	opts._
		.map(file => f.absolute(file))
		.filter(file => fs.existsSync(file))
		.map(file => getSchema(file))
).then(() => process.exit(0))

function getSchema(file) {
	return new Promise(resolve => {
		f.printNotice(`Processing ${file}...`)
		const schema = {}, stream = f.read(file)
		let i = 0
		
		// look at the first few lines to generate schema -
		// this is mostly done to find concrete types for null fields
		stream.on('line', line => {
			f.generateSchema(JSON.parse(line), schema)
			if (++i === opts.limit)
				stream.close()
		}).on('close', () => {
			writeCSV(schema, file).then(() => {
				f.printOk(`Done processing ${file}`)
				resolve()
			})
		})
	})
}

function writeCSV(schema, file) {
	return new Promise(resolve => {
		const tempfile = `${file}.csv`
		fs.unlink(tempfile, err => {})
		f.printNotice(`Creating ${tempfile}...`)
		
		const csv = fs.createWriteStream(tempfile, {
			flags: 'a'
		})
		
		f.read(file).on('line', line => {
			// validate the row against the data types in schema before putting it in,
			// since Postgres has no way of rejecting shitty data
			const obj = JSON.parse(line)
			
			if (f.isValid(obj, schema))
				csv.write(f.generateCSV(obj, schema, mysql))
			else // spit out invalid lines so that the user may fix them
				f.printErr(`Invalid line: ${line}`)
		}).on('close', () => {
			csv.close()
			
			writeTable(file, tempfile, schema).then(() => {
				f.printOk(`Finished using ${tempfile}. Deleting...`)
				fs.unlinkSync(tempfile)
				resolve()
			})
		})
	})
}

function writeTable(file, tempfile, schema) {
	return new Promise(resolve => {
		const tablename = opts.hasOwnProperty('table')
			? opts['table']
			: path.parse(file).name
		f.printNotice(`Loading data into table ${tablename}...`)
		
		db.define(tablename, schema, {
			// you need to specify the table name, else Sequelize goes apeshit
			tableName: tablename,
			// you also need to disable timestamps, because Sequelize wants to add
			// two columns silently, and then bitches about it when you don't provide values for them
			timestamps: false
		}).sync({force: true})
		.then(() => { // import CSV
			const load = mysql 
				? `LOAD DATA INFILE '${tempfile}' INTO "${tablename}"
					FIELDS TERMINATED BY ',' 
					ESCAPED BY '"'
					OPTIONALLY ENCLOSED BY '"'`
				: `COPY "${tablename}" FROM '${tempfile}' 
					DELIMITER ','
					CSV` // **MUST** specify the CSV, even though I set the delimiter!!! Fucking Postgres...
			
			db.query(load)
				.then(() => {
					f.printOk(`Finished loading data into ${tablename}`)
				}).catch(err => {
					f.printErr(err)
				}).finally(() => {
					resolve()
				})
		})
		// for some reason, when I put error handling code down here,
		// it eats all of the error from above, too.
	})
}