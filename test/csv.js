const assert = require('assert'),
CSV = require('../src/csv'),
parse = require('csv-parse/lib/sync')

describe('CSV', () => {
	describe('#convert()', () => {
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
			parsed = CSVparse(CSV.convert(obj, schema))
			
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
			const csvmysql = CSVparse(CSV.convert(obj, schema, true))
			
			assert.equal(csvmysql[nullIndex], '\\N')
		})
	})
})