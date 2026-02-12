function randomInt(min = 1000, max = 9999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const nomesBR = [
  "Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda",
  "Gabriel", "Helena", "Igor", "Juliana", "Kaio", "Larissa",
  "Marcos", "Natália", "Otávio", "Patrícia", "Rafael", "Sabrina",
  "Thiago", "Vanessa"
];

Cypress.Commands.add("token", (email, senha) => {
  return cy.request({
    method: "POST",
    url: "login",
    body: {
      email,
      password: senha,
    },
  }).then((response) => {
    expect(response.status).to.equal(200);
    expect(response.body).to.have.property("authorization");
    return response.body.authorization;
  });
});

Cypress.Commands.add("cadastrarProduto", (token, produto, preco, descricao, quantidade) => {
  return cy.request({
    method: "POST",
    url: "produtos",
    headers: { authorization: token },
    body: {
      nome: produto,
      preco,
      descricao,
      quantidade,
    },
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("criarUsuario", ({ administrador = "false", nomeBase = "Hugo" } = {}) => {
  const nomeAleatorio = nomesBR[randomInt(0, nomesBR.length - 1)];
  const nome = `${nomeBase} ${nomeAleatorio} ${Date.now()}`;
  const email = `user_${Date.now()}_${randomInt()}@teste.com`;
  const password = `teste${randomInt(10, 99)}123`;

  return cy.request({
    method: "POST",
    url: "usuarios",
    body: { nome, email, password, administrador },
  }).then((res) => {
    expect(res.status).to.eq(201);
    expect(res.body).to.have.property("_id");

    return { _id: res.body._id, nome, email, password, administrador };
  });
});
