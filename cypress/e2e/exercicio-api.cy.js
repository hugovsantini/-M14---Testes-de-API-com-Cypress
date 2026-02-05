/// <reference types="cypress" />

describe('Testes da Funcionalidade Usuários', () => {

  const baseUrl = 'http://localhost:3000'

  let userId
  let emailValido

  function gerarEmail(prefix = 'usuario') {
    return `${prefix}_${Date.now()}@teste.com`
  }

  function gerarNomeBR() {
    const nomes = [
      'Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Giovana', 'Isabela',
      'João', 'Larissa', 'Marcos', 'Natália', 'Pedro', 'Rafaela', 'Sofia', 'Thiago',
      'Vanessa', 'Wesley', 'Yasmin'
    ]

    const sobrenomes = [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Lima', 'Ferreira', 'Costa',
      'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Gomes', 'Martins'
    ]

    const nome = nomes[Math.floor(Math.random() * nomes.length)]
    const sobrenome = sobrenomes[Math.floor(Math.random() * sobrenomes.length)]

    return `${nome} ${sobrenome}`
  }

  it('Deve validar contrato de usuários', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/usuarios`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('quantidade')
      expect(response.body).to.have.property('usuarios')
      expect(response.body.usuarios).to.be.an('array')

      // valida contrato mínimo de cada item (se existir ao menos 1)

      if (response.body.usuarios.length > 0) {
        response.body.usuarios.forEach((u) => {
          expect(u).to.have.property('_id')
          expect(u).to.have.property('nome')
          expect(u).to.have.property('email')
          expect(u).to.have.property('password')
          expect(u).to.have.property('administrador')
        })
      }
    })
  })

  it('Deve listar usuários cadastrados', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/usuarios`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.usuarios).to.be.an('array')
      expect(response.body.usuarios.length).to.be.greaterThan(0)
      expect(response.body.quantidade).to.eq(response.body.usuarios.length)
    })
  })

  it('Deve cadastrar um usuário com sucesso', () => {
    emailValido = gerarEmail('usuario')

    cy.request({
      method: 'POST',
      url: `${baseUrl}/usuarios`,
      body: {
        nome: gerarNomeBR(),
        email: emailValido,
        password: 'teste123',
        administrador: 'true',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('message')
      expect(response.body).to.have.property('_id')

      userId = response.body._id
      expect(userId).to.be.a('string').and.not.be.empty
    })
  })

  it('Deve validar um usuário com email inválido', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/usuarios`,
      failOnStatusCode: false,
      body: {
        nome: gerarNomeBR(),
        email: 'email_invalido', // inválido propositalmente
        password: 'teste123',
        administrador: 'true',
      },
    }).then((response) => {
      expect(response.status).to.eq(400)

      // ServeRest costuma retornar erro por campo (ex.: { email: "email deve ser um email válido" })

      expect(response.body).to.have.property('email')
    })
  })

  it('Deve editar um usuário previamente cadastrado', () => {
    expect(userId, 'userId precisa existir antes do PUT').to.exist

    cy.request({
      method: 'PUT',
      url: `${baseUrl}/usuarios/${userId}`,
      body: {
        nome: gerarNomeBR(),
        email: gerarEmail('usuario_editado'),
        password: 'novaSenha123',
        administrador: 'false',
      },
    }).then((response) => {

      // ServeRest pode responder 200 ou 201 no PUT dependendo da versão/comportamento
      
      expect([200, 201]).to.include(response.status)
      expect(response.body).to.have.property('message')
    })
  })

  it('Deve deletar um usuário previamente cadastrado', () => {
    expect(userId, 'userId precisa existir antes do DELETE').to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/usuarios/${userId}`,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('message')
    })
  })

})
