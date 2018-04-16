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
	logging: false
}
Object.assign(opts, require('minimist')(process.argv.slice(2)))

const db = new Sequelize({
	operatorsAliases: false,
	database: opts.database,
	username: opts.username,
	password: opts.password,
	host: opts.host,
	dialect: opts.dialect.toLowerCase()
	// if additional parameters are needed, pass them in via command-line arguments
}),
mysql = db.dialect.name === 'mysql'

db.authenticate()
	.catch(err => {
		console.error(err)
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
		console.log(`processing ${file}`)
		const limit = 1000, schema = {}, stream = f.read(file)
		let i = 0
		
		// look at the first few lines to generate schema -
		// this is mostly done to find concrete types for null fields
		stream.on('line', line => {
			f.generateSchema(JSON.parse(line), schema)
			if (++i === limit)
				stream.close()
		}).on('close', () => {
			writeCSV(schema, file).then(() => {
				console.log(`done processing ${file}`)
				resolve()
			})
		})
	})
}

function writeCSV(schema, file) {
	return new Promise(resolve => {
		const tempfile = `${file}.csv`,
		csv = fs.createWriteStream(tempfile, {
			flags: 'a'
		})
		
		// write header
		csv.write(f.generateCSV(schema, schema))
		
		f.read(file).on('line', line => {
			csv.write(f.generateCSV(JSON.parse(line), schema, mysql))
		}).on('close', () => {
			csv.close()
			writeTable(file, tempfile, schema).then(() => {
				console.log(`finished creating ${tempfile}`)
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
		
		db.define(tablename, schema).sync().then(() => {
			// TODO: import CSV
		}).catch(err => {
			console.err(err)
		}).finally(() => {
			fs.unlink(tempfile)
			console.log(`finished importing data into table ${tablename}`)
			resolve()
		})
	})
}