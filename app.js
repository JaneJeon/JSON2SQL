const fs = require('fs'),
os = require('os'),
path = require('path'),
CSV = require('./src/csv'),
F = require('./src/util'),
Path = require('./src/path'),
Record = require('./src/record'),
Schema = require('./src/schema'),
Sequelize = require('sequelize'),

// defaults
opts = {
	dialect: 'postgres',
	host: 'localhost',
	database: os.userInfo().username,
	username: os.userInfo().username,
	password: null,
	limit: 1000,
	k: false
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
}),
// MySQL represents NULLs differently
mysql = db.dialect.name === 'mysql'

db.authenticate()
	.catch(err => {
		F.printErr(err)
		process.exit(1)
	})

Promise.all(
	opts._
		.map(file => Path.absolute(file))
		.filter(file => fs.existsSync(file))
		.map(file => createSchema(file))
).then(() => process.exit(0))

function createSchema(file) {
	return new Promise(resolve => {
		F.printNotice(`Processing ${file}...`)
		const schema = {}, stream = F.read(file)
		let i = 0
		
		// look at the first few lines to generate schema -
		// this is mostly done to find concrete types for null fields
		stream.on('line', line => {
			Schema.update(JSON.parse(line), schema)
			if (++i === opts.limit)
				stream.close()
		}).on('close', () => {
			createCSV(schema, file).then(() => {
				F.printOk(`Done processing ${file}.`)
				resolve()
			})
		})
	})
}

function createCSV(schema, file) {
	return new Promise(resolve => {
		const tempfile = `${file}.csv`
		fs.unlink(tempfile, err => {})
		F.printNotice(`Creating ${tempfile}...`)
		
		const csv = fs.createWriteStream(tempfile, {
			flags: 'a'
		})
		
		F.read(file).on('line', line => {
			// validate the row against the data types in schema before putting it in,
			// since Postgres has no way of rejecting shitty data
			const obj = JSON.parse(line)
			
			if (Record.isValid(obj, schema))
				csv.write(CSV.convert(obj, schema, mysql))
			else // spit out invalid lines so that the user may fix them
				F.printErr(`Invalid line: ${line}`)
		}).on('close', () => {
			csv.close()
			
			createTable(file, tempfile, schema).then(() => {
				F.printOk(`Done processing ${tempfile}.`)
				if (!opts.k) {
					fs.unlinkSync(tempfile)
					F.printNotice(`Deleted ${tempfile}.`)
				}
				resolve()
			})
		})
	})
}

function createTable(file, tempfile, schema) {
	return new Promise(resolve => {
		const tablename = opts.hasOwnProperty('table')
			? opts['table']
			: path.parse(file).name
		F.printNotice(`Creating table ${tablename}...`)
		
		db.define(tablename, schema, {
			// you need to specify the table name, else sequelize goes apeshit
			tableName: tablename,
			// you also need to disable timestamps, because sequelize wants to add
			// two columns silently, and then bitches about it when you don't provide values for them
			timestamps: false
		}).sync({force: true})
		.then(() => {
			ingest(file, tempfile, tablename).then(() => {
				F.printOk(`Done processing ${tablename}.`)
				resolve()
			})
		})
	})
}

function ingest(file, tempfile, tablename) {
	return new Promise(resolve => {
		F.printNotice(`Loading data into ${tablename}`)
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
				F.printOk(`Finished loading data into ${tablename}`)
			}).catch(err => {
				F.printErr(err)
			}).finally(() => {
				resolve()
			})
	})
}