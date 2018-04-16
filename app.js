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
	password: null
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
		f.printNotice(`processing ${file}...`)
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
				f.printOk(`done processing ${file}`)
				resolve()
			})
		})
	})
}

function writeCSV(schema, file) {
	return new Promise(resolve => {
		const tempfile = `${file}.csv`
		fs.unlink(tempfile, err => {})
		f.printNotice(`creating ${tempfile}...`)
		
		const csv = fs.createWriteStream(tempfile, {
			flags: 'a'
		})
		
		f.read(file).on('line', line => {
			csv.write(f.generateCSV(JSON.parse(line), schema, mysql))
		}).on('close', () => {
			csv.close()
			writeTable(file, tempfile, schema).then(() => {
				f.printOk(`finished creating ${tempfile}`)
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
		f.printNotice(`writing to table ${tablename}...`)
		
		db.define(tablename, schema, {
			tableName: tablename,
			timestamps: false
		}).sync({force: true})
		.then(() => {
			// import CSV
			const load = mysql 
				? `LOAD DATA INFILE '${tempfile}' INTO "${tablename}"
					FIELDS TERMINATED BY ',' 
					ESCAPED BY '"'
					OPTIONALLY ENCLOSED BY '"'` 
				: `COPY "${tablename}" FROM '${tempfile}' 
					DELIMITER ','`
			
			db.query(load)
				.then(() => {
					f.printOk(`finished importing data into ${tablename}`)
				})
		}).catch(err => {
			f.printErr(err)
		}).finally(() => {
			fs.unlinkSync(tempfile)
			resolve()
		})
	})
}