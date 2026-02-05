/// <reference types="cypress" />

const contratoProdutos = require("../contracts/produtos.contract");

function randomInt(min = 1000, max = 9999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function novoProdutoNome(prefix = "Produto") {
  return `${prefix} Hugo ${Date.now()}_${randomInt()}`;
}

describe("Testes da Funcionalidade Produtos", () => {
  let adminToken;

  before(() => {
    // Pré-condição ÓBVIA: para criar/editar/deletar produto no ServeRest,
    // geralmente precisa estar autenticado como admin.
    cy.criarELogar({ administrador: "true", nomePrefixo: "Hugo Admin" }).then(({ token }) => {
      adminToken = token;
      expect(adminToken).to.be.a("string").and.to.have.length.greaterThan(10);
    });
  });

  it("Deve validar contrato de produtos", () => {
  cy.request({
    method: "GET",
    url: "/produtos",
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.body).to.be.jsonSchema(contratoProdutos);
  });
});


  it("Deve listar os produtos cadastrados", () => {
    cy.request({
      method: "GET",
      url: "/produtos",
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("produtos");
      expect(res.body.produtos).to.be.an("array");
      expect(res.body).to.have.property("quantidade");
      expect(res.body.quantidade).to.eq(res.body.produtos.length);
    });
  });

  it("Deve cadastrar um produto com sucesso", () => {
    const produto = {
      nome: novoProdutoNome("Café"),
      preco: randomInt(10, 999),
      descricao: "Produto de teste automatizado - EBAC",
      quantidade: randomInt(1, 50),
    };

    cy.request({
      method: "POST",
      url: "/produtos",
      headers: { Authorization: adminToken },
      body: produto,
    }).then((res) => {
      // ServeRest costuma retornar 201 ao cadastrar produto
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property("message");
      expect(res.body.message).to.match(/sucesso/i);
      expect(res.body).to.have.property("_id");
    });
  });

  it("Deve validar mensagem de erro ao cadastrar produto repetido", () => {
    // Estratégia correta:
    // 1) Cria produto A
    // 2) Tenta criar de novo com o MESMO nome
    const nomeRepetido = novoProdutoNome("Repetido");

    const payload = {
      nome: nomeRepetido,
      preco: randomInt(10, 999),
      descricao: "Produto repetido (negativo)",
      quantidade: randomInt(1, 50),
    };

    cy.request({
      method: "POST",
      url: "/produtos",
      headers: { Authorization: adminToken },
      body: payload,
    }).then((res1) => {
      expect(res1.status).to.eq(201);
      expect(res1.body).to.have.property("_id");

      cy.request({
        method: "POST",
        url: "/produtos",
        headers: { Authorization: adminToken },
        body: payload,
        failOnStatusCode: false, // obrigatório em cenário negativo
      }).then((res2) => {
        // ServeRest costuma retornar 400 para nome duplicado
        expect(res2.status).to.eq(400);

        // Mensagem mais comum do ServeRest:
        // "Já existe produto com esse nome"
        // (se variar, o regex abaixo ainda pega)
        expect(res2.body).to.have.property("message");
        expect(res2.body.message).to.match(/já existe|existe.*nome|duplicad/i);
      });
    });
  });

  it("Deve editar um produto já cadastrado", () => {
    // Aqui a ideia é testar regra de negócio de "conflito":
    // 1) Cria Produto A (nome A)
    // 2) Cria Produto B (nome B)
    // 3) Tenta editar o Produto B para ficar com nome A => deve falhar (400)

    const nomeA = novoProdutoNome("Conflito-A");
    const nomeB = novoProdutoNome("Conflito-B");

    const produtoA = {
      nome: nomeA,
      preco: randomInt(10, 999),
      descricao: "Produto A",
      quantidade: randomInt(1, 50),
    };

    const produtoB = {
      nome: nomeB,
      preco: randomInt(10, 999),
      descricao: "Produto B",
      quantidade: randomInt(1, 50),
    };

    cy.request({
      method: "POST",
      url: "/produtos",
      headers: { Authorization: adminToken },
      body: produtoA,
    }).then((resA) => {
      expect(resA.status).to.eq(201);
      const idA = resA.body._id;

      cy.request({
        method: "POST",
        url: "/produtos",
        headers: { Authorization: adminToken },
        body: produtoB,
      }).then((resB) => {
        expect(resB.status).to.eq(201);
        const idB = resB.body._id;

        // tentativa de "renomear" B para nome já usado por A
        cy.request({
          method: "PUT",
          url: `/produtos/${idB}`,
          headers: { Authorization: adminToken },
          body: {
            ...produtoB,
            nome: nomeA,
          },
          failOnStatusCode: false,
        }).then((resPut) => {
          expect(resPut.status).to.eq(400);
          expect(resPut.body).to.have.property("message");
          expect(resPut.body.message).to.match(/já existe|existe.*nome|duplicad/i);
        });

        // limpeza (boa prática)
        cy.request({
          method: "DELETE",
          url: `/produtos/${idA}`,
          headers: { Authorization: adminToken },
          failOnStatusCode: false,
        });

        cy.request({
          method: "DELETE",
          url: `/produtos/${idB}`,
          headers: { Authorization: adminToken },
          failOnStatusCode: false,
        });
      });
    });
  });

  it("Deve editar um produto cadastrado previamente", () => {
    // Edição "feliz":
    // 1) Cria um produto
    // 2) Edita o mesmo produto
    // 3) Valida mensagem/status
    const produto = {
      nome: novoProdutoNome("Editar"),
      preco: randomInt(10, 999),
      descricao: "Produto para edição",
      quantidade: randomInt(1, 50),
    };

    cy.request({
      method: "POST",
      url: "/produtos",
      headers: { Authorization: adminToken },
      body: produto,
    }).then((resCreate) => {
      expect(resCreate.status).to.eq(201);
      const produtoId = resCreate.body._id;

      const atualizado = {
        ...produto,
        nome: novoProdutoNome("Editado"),
        preco: randomInt(10, 999),
        descricao: "Produto editado com sucesso",
        quantidade: randomInt(1, 80),
      };

      cy.request({
        method: "PUT",
        url: `/produtos/${produtoId}`,
        headers: { Authorization: adminToken },
        body: atualizado,
      }).then((resPut) => {
        // ServeRest pode retornar 200 em update
        expect([200, 201]).to.include(resPut.status);
        expect(resPut.body).to.have.property("message");
        expect(resPut.body.message).to.match(/alterad|sucesso|atualiz/i);
      });

      // limpeza
      cy.request({
        method: "DELETE",
        url: `/produtos/${produtoId}`,
        headers: { Authorization: adminToken },
        failOnStatusCode: false,
      });
    });
  });
});
