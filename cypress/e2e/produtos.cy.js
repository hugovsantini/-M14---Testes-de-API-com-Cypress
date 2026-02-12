/// <reference types="cypress" />
import contrato from "../contracts/produtos.contract";

describe("Testes da Funcionalidade Produtos", () => {
  let token;

  before(() => {
    cy.token("fulano@qa.com", "teste").then((tkn) => {
      token = tkn;
    });
  });

  it("Deve validar contrato de produtos", () => {
    cy.request({
      method: "GET",
      url: "produtos",
    }).then((response) => {
      return contrato.validateAsync(response.body);
    });
  });

  it("Deve listar os produtos cadastrados", () => {
    cy.request({
      method: "GET",
      url: "produtos",
    }).then((response) => {
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property("produtos").and.to.be.an("array");
      expect(response.body).to.have.property("quantidade");
      expect(response.body.quantidade).to.eq(response.body.produtos.length);
    });
  });

  it("Deve cadastrar um produto com sucesso", () => {
    const produto = `Produto EBAC ${Date.now()}`;

    cy.request({
      method: "POST",
      url: "produtos",
      headers: { authorization: token },
      body: {
        nome: produto,
        preco: 200,
        descricao: "Produto novo",
        quantidade: 100,
      },
    }).then((response) => {
      expect(response.status).to.equal(201);
      expect(response.body.message).to.equal("Cadastro realizado com sucesso");
      expect(response.body).to.have.property("_id");
    });
  });

  it("Deve validar mensagem de erro ao cadastrar produto repetido", () => {
    const nomeRepetido = `Produto EBAC Repetido ${Date.now()}`;

    cy.cadastrarProduto(token, nomeRepetido, 250, "Descrição do produto novo", 180).then((res1) => {
      expect(res1.status).to.equal(201);
      expect(res1.body.message).to.equal("Cadastro realizado com sucesso");
    });

    cy.cadastrarProduto(token, nomeRepetido, 250, "Descrição do produto novo", 180).then((res2) => {
      expect(res2.status).to.equal(400);
      expect(res2.body.message).to.equal("Já existe produto com esse nome");
    });
  });

  it("Deve editar um produto já cadastrado", () => {
    // evita depender de "produtos[0]" existir/criar risco
    const produto = `Produto EBAC ${Date.now()}`;

    cy.cadastrarProduto(token, produto, 250, "Descrição do produto novo", 180).then((createRes) => {
      expect(createRes.status).to.equal(201);
      const id = createRes.body._id;

      const nomeEditado = `Produto Editado EBAC ${Date.now()}`;

      cy.request({
        method: "PUT",
        url: `produtos/${id}`,
        headers: { authorization: token },
        body: {
          nome: nomeEditado,
          preco: 100,
          descricao: "Produto editado",
          quantidade: 100,
        },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("Registro alterado com sucesso");
      });
    });
  });

  it("Deve editar um produto cadastrado previamente", () => {
    const produto = `Produto EBAC ${Date.now()}`;

    cy.cadastrarProduto(token, produto, 250, "Descrição do produto novo", 180).then((createRes) => {
      expect(createRes.status).to.equal(201);
      const id = createRes.body._id;

      const nomeEditado = `Produto EBAC Editado ${Date.now()}`;

      cy.request({
        method: "PUT",
        url: `produtos/${id}`,
        headers: { authorization: token },
        body: {
          nome: nomeEditado,
          preco: 200,
          descricao: "Produto editado",
          quantidade: 300,
        },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("Registro alterado com sucesso");
      });
    });
  });

  it("Deve deletar um produto previamente cadastrado", () => {
    const produto = `Produto EBAC ${Date.now()}`;

    cy.cadastrarProduto(token, produto, 250, "Descrição do produto novo", 180).then((createRes) => {
      expect(createRes.status).to.equal(201);
      const id = createRes.body._id;

      cy.request({
        method: "DELETE",
        url: `produtos/${id}`,
        headers: { authorization: token },
      }).then((res) => {
        expect(res.status).to.equal(200);
        expect(res.body.message).to.equal("Registro excluído com sucesso");
      });
    });
  });
});
