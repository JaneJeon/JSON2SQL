import os from 'os'
import path from 'path'
import Sequelize from 'sequelize'

// defaults
const opts = {
	dialect: 'postgres',
	host: 'localhost',
	database: os.userInfo().username,
	username: os.userInfo().username,
	password: null
}
Object.assign(opts, require('minimist')(process.argv.slice(2)))

const db = new Sequelize({
	database: opts.database,
	username: opts.username,
	password: opts.password,
	host: opts.host,
	dialect: opts.dialect
	// if additional parameters are needed, pass them in through command-line arguments
})

db.authenticate()
	.catch(err => {
		console.error(err)
		process.exit(1)
	})

const limit = 100
opts._.forEach(file => {
	let i = 0
	const csv = file + '.csv', schema = {}
	
	// look through some lines to determine the structure
	const stream = require('readline').createInterface({
		input: require('fs').createReadStream(file)
	})
	
	stream.on('line', line => {
		const obj = JSON.parse(line)
		
		if (++i === limit)
			Object.keys(obj)
				.filter(key => !schema.hasOwnProperty(key))
				.forEach(key => {
					switch (typeof obj[key]) {
						case 'boolean':
							schema[key] = Sequelize.DataTypes.BOOLEAN
							break
						case 'number':
							schema[key] = Number.isInteger(obj[key])
								? Sequelize.DataTypes.INTEGER
								: Sequelize.DataTypes.DOUBLE
							break
						case 'string':
							schema[key] = Sequelize.DataTypes.STRING
					}
				})
		
		// convert to CSV
	})
	
	const tablename = opts.hasOwnProperty('table')
		? opts['table']
		: path.parse(file).name
	
	db.define(tablename, schema).sync().then(() => {
		// import CSV
	})
})