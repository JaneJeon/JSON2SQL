const assert = require('assert'),
f = require('../helper'), 
parse = require('csv-parse/lib/sync'),
Sequelize = require('sequelize'),

comment1 = {
	"author_flair_text": null,
	"parent_id": "t1_c3we975",
	"name": "t1_c3weani",
	"created_utc": "1330560000",
	"score": 2,
	"subreddit": "AskReddit",
	"body": "Gas demand will \"skyrocket\", what do you think gas prices will look like?",
	"retrieved_on": 1428444551,
	"edited": false,
	"distinguished": null
},
comment2 = {
	"created_utc": "1330560090",
	"score": 1,
	"subreddit": "fffffffuuuuuuuuuuuu",
	"parent_id": "t3_qc3jc",
	"name": "t1_c3weba9",
	"author_flair_text": null,
	"distinguished": "moderator",
	"edited": true,
	"body": "Sorry, no comparison comics.",
	"retrieved_on": 1428444564
}

describe('Path', function() {
	const absolutePath = '/Users/JaneJeon/Desktop/cat.jpg'
	
	it('should not touch absolute paths', function() {
		assert.strictEqual(f.absolute(absolutePath), absolutePath)
	})
	
	it('should return absolute path', function() {
		assert.strictEqual(f.absolute('~/Desktop/cat.jpg'), absolutePath)
	})
})

describe('Schema', function() {
	const schema = {}
	
	it('should pick up existing fields', function() {
		f.generateSchema(comment1, schema)
		
		assert.strictEqual(schema['name'], Sequelize.DataTypes.TEXT)
		assert.strictEqual(schema['score'], Sequelize.DataTypes.INTEGER)
		assert.strictEqual(schema['edited'], Sequelize.DataTypes.BOOLEAN)
	})
	
	it('should not have fields for null values', function() {
		assert.equal(schema.hasOwnProperty('distinguished'), false)
	})
	
	it('should fill in null field, given a value', function() {
		f.generateSchema(comment2, schema)
		
		assert.strictEqual(schema['distinguished'], Sequelize.DataTypes.TEXT)
	})
	
	describe('CSV', function() {
		let parsed1, parsed2, numFields, nullIndex

		function CSVparse(input) {
			return parse(input, {escape: '\\'})[0]
		}
		
		// if the strings are not escaped well, it will result in different number of fields
		it('should be comma separated values', function() {
			numFields = Object.keys(schema).length
			parsed1 = CSVparse(f.generateCSV(comment1, schema))
			parsed2 = CSVparse(f.generateCSV(comment2, schema))
			
			assert.equal(parsed1.length, numFields)
			assert.equal(parsed2.length, numFields)
		})
		
		it('should generate the CSV in the order of the fields in schema', function() {
			for (var i = 0; i < numFields; i++) {
				const field = Object.keys(schema)[i]
				
				// skip the NULL tests for now
				if (field !== 'author_flair_text' && field !== 'distinguished') {
					// the CSV parsing library converts *everything* to a string. Not my fault.
					assert.equal(parsed1[i], '' + comment1[field])
					assert.equal(parsed2[i], '' + comment2[field])
				}
			}
		})
		
		it('should replace null for "NULL" in non-mysql dialects', function() {
			nullIndex = Object.keys(schema).indexOf('distinguished')
			
			assert.strictEqual(parsed1[nullIndex], 'NULL')
		})
		
		it('should replace null for "\\N" in mysql dialect', function() {
			const csvmysql = CSVparse(f.generateCSV(comment1, schema, true))
			
			assert.strictEqual(csvmysql[nullIndex], '\\N')
		})
	})
})