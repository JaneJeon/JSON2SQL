const assert = require('assert'),
f = require('../helper'),
parse = require('csv-parse/lib/sync'),
sequelize = require('sequelize')

describe('CSV', () => {
	describe('#isValid()', () => {
		const schema = {
			boolField: sequelize.DataTypes.BOOLEAN,
			intField: sequelize.DataTypes.INTEGER,
			floatField: sequelize.DataTypes.DOUBLE,
			stringField: sequelize.DataTypes.TEXT
		},
		nullField = {
			boolField: null
		},
		incorrectBool = {
			boolField: 0
		},
		incorrectInt = {
			intField: 42.1
		},
		incorrectFloat = {
			floatField: 42
		},
		incorrectString = {
			stringField: true
		},
		idSchema = {
			id: {
				type: sequelize.DataTypes.INTEGER,
				primaryKey: true
			}
		},
		incorrectId = {
			id: '42'
		},
		correctId = {
			id: 42
		}
		
		function correct() {
			return {
				boolField: true,
				intField: 42,
				floatField: 42.1,
				stringField: 'foo'
			}
		}
		
		it('should compare the data types of fields', () => {
			assert.equal(f.isValid(correct(), schema), true)
			assert.equal(f.isValid(Object.assign(correct(), incorrectBool), schema), false)
			assert.equal(f.isValid(Object.assign(correct(), incorrectInt), schema), false)
			assert.equal(f.isValid(Object.assign(correct(), incorrectFloat), schema), false)
		})
		
		it('should implicitly convert string types', () => {
			const obj = correct()
			
			assert.equal(f.isValid(obj, schema), true)
			assert.strictEqual(obj['stringField'], correct()['stringField'])
			
			assert.equal(f.isValid(Object.assign(obj, incorrectString), schema), true)
			assert.strictEqual(typeof obj['stringField'], 'string')
		})
		
		it('should not reject null values', () => {
			assert.equal(f.isValid(Object.assign(correct(), nullField), schema), true)
		})
		
		it('should be aware that primary keys are wrapped in objects', () => {
			assert.equal(f.isValid(Object.assign(correct(), correctId), Object.assign(schema, idSchema)), true)
			assert.equal(f.isValid(Object.assign(correct(), incorrectId), schema), false)
		})
		
		it('should reject objects that are missing the id field', () => {
			assert.equal(f.isValid(correct(), schema), false)
		})
		
		it('should not reject objects that are missing other fields', () => {
			const obj = Object.assign(correct(), correctId)
			delete obj['intField']
			
			assert.equal(f.isValid(obj, schema), true)
		})
	})
	
	describe('#generateCSV()', () => {
		let parsed, nullIndex
		const schema = {
			boolField: null,
			intField: null,
			floatField: null,
			stringField: null,
			quotes: null,
			commas: null,
			quotesAndCommas: null,
			emptyString: null,
			nullField: null
		},
		obj = {
			boolField: true,
			intField: 0,
			floatField: 0.1,
			stringField: "it's RAW",
			quotes: 'math is "fun"',
			commas: '1, 2',
			quotesAndCommas: '","',
			emptyString: '',
			nullField: null
		},
		numFields = Object.keys(schema).length
		
		function CSVparse(input) {
			return parse(input)[0]
		}
		
		// if the strings are not escaped well, it will result in different number of fields
		it('should be comma separated values', () => {
			parsed = CSVparse(f.generateCSV(obj, schema))
			
			assert.equal(parsed.length, numFields)
		})
		
		it('should generate the CSV in the order of the fields in schema', () => {
			const fields = Object.keys(schema)
			
			for (var i = 0; i < numFields; i++) {
				const field = fields[i]
				
				// skip the NULL tests for now
				if (field !== 'nullField')
					// the CSV parsing library converts *everything* to a string.
					assert.equal(parsed[i], `${obj[field]}`)
			}
		})
		
		it('should replace null with NULL in non-mysql dialects', () => {
			nullIndex = Object.keys(schema).indexOf('nullField')
			
			assert.equal(parsed[nullIndex], 'NULL')
		})
		
		it('should replace null with \\N in mysql dialect', () => {
			const csvmysql = CSVparse(f.generateCSV(obj, schema, true))
			
			assert.equal(csvmysql[nullIndex], '\\N')
		})
	})
})