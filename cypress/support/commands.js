/// <reference types="cypress" />

function randomInt(min = 1000, max = 9999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const nomesBR = [
  "Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda",
  "Gabriel", "Helena", "Igor", "Juliana", "Kaio", "Larissa",
  "Marcos", "Natália", "Otávio", "Patrícia", "Rafael", "Sabrina",
  "Thiago", "Vanessa"
];

Cypress.Commands.add("criarUsuario", ({ administrador = "false", nomePrefixo = "Usuario" } = {}) => {
  const nome = `${nomePrefixo} ${nomesBR[randomInt(0, nomesBR.length - 1)]} ${randomInt()}`;
  const email = `user_${Date.now()}_${randomInt()}@teste.com`;
  const password = `teste${randomInt(10, 99)}123`;

  return cy.request({
    method: "POST",
    url: "/usuarios",
    body: {
      nome,
      email,
      password,
      administrador
    }
  }).then((res) => {
    expect(res.status).to.eq(201);
    expect(res.body).to.have.property("_id");

    return {
      _id: res.body._id,
      nome,
      email,
      password,
      administrador
    };
  });
});

Cypress.Commands.add("loginApi", ({ email, password }) => {
  return cy.request({
    method: "POST",
    url: "/login",
    body: { email, password }
  }).then((res) => {
    // ServeRest normalmente retorna 200 e authorization
    expect(res.status).to.eq(200);
    expect(res.body).to.have.property("authorization");

    const token = res.body.authorization;
    return token;
  });
});

/**
 * Helper de “sessão” por perfil:
 * - cria usuário
 * - faz login
 * - devolve tudo pronto: { user, token }
 */
Cypress.Commands.add("criarELogar", ({ administrador = "false", nomePrefixo = "Usuario" } = {}) => {
  return cy.criarUsuario({ administrador, nomePrefixo }).then((user) => {
    return cy.loginApi({ email: user.email, password: user.password }).then((token) => {
      return { user, token };
    });
  });
});
Cypress.Commands.add('token', (email, senha) => {
  return cy.request({
    method: 'POST',
    url: '/login',
    body: { email, password: senha },
    failOnStatusCode: false
  }).then((res) => {
    expect(res.status).to.eq(200)
    expect(res.body).to.have.property('authorization')
    return res.body.authorization
  })
})
