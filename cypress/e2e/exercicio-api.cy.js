/// <reference types="cypress" />

describe("Testes da Funcionalidade Usuários", () => {
  it("Deve validar contrato de usuários", () => {
    cy.request({
      method: "GET",
      url: "usuarios",
    }).then((res) => {
      expect(res.status).to.eq(200);

      expect(res.body).to.have.property("quantidade");
      expect(res.body).to.have.property("usuarios");
      expect(res.body.usuarios).to.be.an("array");

      if (res.body.usuarios.length > 0) {
        const u = res.body.usuarios[0];
        expect(u).to.have.property("_id");
        expect(u).to.have.property("nome");
        expect(u).to.have.property("email");
        expect(u).to.have.property("password");
        expect(u).to.have.property("administrador");
      }
    });
  });

  it("Deve listar usuários cadastrados", () => {
    cy.request({
      method: "GET",
      url: "usuarios",
    }).then((res) => {
      expect(res.status).to.eq(200);

      expect(res.body).to.have.property("usuarios").and.to.be.an("array");
      expect(res.body).to.have.property("quantidade");
      expect(res.body.quantidade).to.eq(res.body.usuarios.length);
    });
  });

  it("Deve cadastrar um usuário com sucesso", () => {
    cy.criarUsuario({ administrador: "false", nomeBase: "Hugo" }).then((user) => {
      cy.request({
        method: "GET",
        url: `usuarios/${user._id}`,
      }).then((res) => {
        expect(res.status).to.eq(200);

        expect(res.body).to.have.property("_id", user._id);
        expect(res.body).to.have.property("nome", user.nome);
        expect(res.body).to.have.property("email", user.email);
        expect(res.body).to.have.property("administrador", user.administrador);
      });
    });
  });

  it("Deve validar um usuário com email inválido", () => {
    cy.request({
      method: "POST",
      url: "usuarios",
      failOnStatusCode: false,
      body: {
        nome: "Teste Email Invalido",
        email: "emailinvalido",
        password: "teste123",
        administrador: "false",
      },
    }).then((res) => {
      expect(res.status).to.eq(400);

      // ServeRest retorna algo como: { email: "email deve ser um email válido" }
      expect(res.body).to.have.property("email");
      expect(res.body.email).to.be.a("string");
      expect(res.body.email.toLowerCase()).to.include("email");
    });
  });

  it("Deve editar um usuário previamente cadastrado", () => {
    cy.criarUsuario({ administrador: "false", nomeBase: "Hugo" }).then((user) => {
      const nomeEditado = `${user.nome} EDITADO`;

      cy.request({
        method: "PUT",
        url: `usuarios/${user._id}`,
        body: {
          nome: nomeEditado,
          email: user.email,
          password: user.password,
          administrador: user.administrador,
        },
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property("message", "Registro alterado com sucesso");
      });

      // valida regra de negócio: realmente alterou
      cy.request({
        method: "GET",
        url: `usuarios/${user._id}`,
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property("nome", nomeEditado);
      });
    });
  });

  it("Deve deletar um usuário previamente cadastrado", () => {
    cy.criarUsuario({ administrador: "false", nomeBase: "Hugo" }).then((user) => {
      cy.request({
        method: "DELETE",
        url: `usuarios/${user._id}`,
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property("message", "Registro excluído com sucesso");
      });

      cy.request({
        method: "GET",
        url: `usuarios/${user._id}`,
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(400);
        expect(res.body).to.have.property("message");
        expect(res.body.message).to.be.a("string");
        expect(res.body.message.toLowerCase()).to.include("não encontrado");
      });
    });
  });
});
