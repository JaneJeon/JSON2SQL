const assert = require('assert'),
Record = require('../src/record')
sequelize = require('sequelize')

describe('Record', () => {
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
			assert.equal(Record.isValid(correct(), schema), true)
			assert.equal(Record.isValid(Object.assign(correct(), incorrectBool), schema), false)
			assert.equal(Record.isValid(Object.assign(correct(), incorrectInt), schema), false)
			assert.equal(Record.isValid(Object.assign(correct(), incorrectFloat), schema), false)
		})
		
		it('should implicitly convert string types', () => {
			const obj = correct()
			
			assert.equal(Record.isValid(obj, schema), true)
			assert.strictEqual(obj['stringField'], correct()['stringField'])
			
			assert.equal(Record.isValid(Object.assign(obj, incorrectString), schema), true)
			assert.strictEqual(typeof obj['stringField'], 'string')
		})
		
		it('should not reject null values', () => {
			assert.equal(Record.isValid(Object.assign(correct(), nullField), schema), true)
		})
		
		it('should be aware that primary keys are wrapped in objects', () => {
			assert.equal(Record.isValid(Object.assign(correct(), correctId), Object.assign(schema, idSchema)), true)
			assert.equal(Record.isValid(Object.assign(correct(), incorrectId), schema), false)
		})
		
		it('should reject objects that are missing the id field', () => {
			assert.equal(Record.isValid(correct(), schema), false)
		})
		
		it('should not reject objects that are missing other fields', () => {
			const obj = Object.assign(correct(), correctId)
			delete obj['intField']
			
			assert.equal(Record.isValid(obj, schema), true)
		})
	})
})