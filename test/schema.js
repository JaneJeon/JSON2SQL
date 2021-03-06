const assert = require('assert'),
Schema = require('../src/schema')
sequelize = require('sequelize')

describe('Schema', () => {
	describe('#update()', () => {
		const schema = {},
		obj1 = {
			boolField: false,
			intField1: 42,
			intField2: '42',
			floatField: 42.1,
			stringField: 'foo',
			nullField: null
		},
		obj2 = {
			nullField: 'world'
		}
		
		it('should pick up non-null fields', () => {
			Schema.update(obj1, schema)
			
			assert.strictEqual(schema['boolField'], sequelize.DataTypes.BOOLEAN)
			assert.strictEqual(schema['intField1'], sequelize.DataTypes.INTEGER)
			assert.strictEqual(schema['intField2'], sequelize.DataTypes.TEXT)
			assert.strictEqual(schema['floatField'], sequelize.DataTypes.DOUBLE)
			assert.strictEqual(schema['stringField'], sequelize.DataTypes.TEXT)
		})
		
		it('should not have fields for null values', () => {
			assert.equal(schema.hasOwnProperty('nullField'), false)
		})
		
		it('should fill in null field, given a value', () => {
			Schema.update(obj2, schema)
			
			assert.strictEqual(schema['nullField'], sequelize.DataTypes.TEXT)
		})
		
		describe('#setKey()', () => {
			const schema = {},
			obj = {
				id: 123
			}
			
			it('should specify primary key for field named id', () => {
				Schema.update(obj, schema)
				
				assert.strictEqual(schema['id']['type'], sequelize.DataTypes.INTEGER)
				assert.strictEqual(schema['id']['primaryKey'], true)
			})
		})
	})
})