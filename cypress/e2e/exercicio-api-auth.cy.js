/// <reference types="cypress" />

describe("API - Fluxo autenticado (token dinâmico) + perfis", () => {
  let admin;
  let comum;

  before(() => {
    // cria e loga admin
    cy.criarELogar({ administrador: "true", nomePrefixo: "Admin" }).then((data) => {
      admin = data; // { user, token }
    });

    // cria e loga usuário comum
    cy.criarELogar({ administrador: "false", nomePrefixo: "Comum" }).then((data) => {
      comum = data;
    });
  });

  it("Admin consegue criar produto (rota autenticada)", () => {
    const produto = {
      nome: `Produto QA ${Date.now()}`,
      preco: 99,
      descricao: "Produto criado via teste automatizado (admin)",
      quantidade: 10
    };

    cy.request({
      method: "POST",
      url: "/produtos",
      headers: {
        Authorization: admin.token
      },
      body: produto
    }).then((res) => {
      // ServeRest costuma devolver 201 ao criar
      expect([200, 201]).to.include(res.status);
      expect(res.body).to.have.property("message");
      // normalmente: "Cadastro realizado com sucesso"
      // e: _id
      expect(res.body).to.have.property("_id");
    });
  });

  it("Usuário comum NÃO consegue criar produto (admin only)", () => {
    const produto = {
      nome: `Produto Bloqueado ${Date.now()}`,
      preco: 99,
      descricao: "Tentativa de criar produto com usuário comum",
      quantidade: 10
    };

    cy.request({
      method: "POST",
      url: "/produtos",
      headers: {
        Authorization: comum.token
      },
      body: produto,
      failOnStatusCode: false // importante para validar negativo sem quebrar o teste
    }).then((res) => {
      // normalmente ServeRest retorna 403 para permissão
      expect([401, 403]).to.include(res.status);
      expect(res.body).to.have.property("message");
    });
  });

  it("Token inválido deve falhar (negativo clássico de auth)", () => {
    cy.request({
      method: "POST",
      url: "/produtos",
      headers: {
        Authorization: "Bearer TOKEN_INVALIDO"
      },
      body: {
        nome: `Produto Token Ruim ${Date.now()}`,
        preco: 10,
        descricao: "Token inválido",
        quantidade: 1
      },
      failOnStatusCode: false
    }).then((res) => {
      expect([401, 403]).to.include(res.status);
      expect(res.body).to.have.property("message");
    });
  });
});
