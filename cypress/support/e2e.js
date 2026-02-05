
import './commands'

// habilita matcher: expect(body).to.be.jsonSchema(schema)
import chaiJsonSchemaAjv from 'chai-json-schema-ajv'
chai.use(chaiJsonSchemaAjv)
