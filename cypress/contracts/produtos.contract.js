module.exports = {
  type: "object",
  required: ["quantidade", "produtos"],
  properties: {
    quantidade: {
      type: "number"
    },
    produtos: {
      type: "array",
      items: {
        type: "object",
        required: ["_id", "nome", "preco", "descricao", "quantidade"],
        properties: {
          _id: {
            type: "string"
          },
          nome: {
            type: "string"
          },
          preco: {
            type: "number"
          },
          descricao: {
            type: "string"
          },
          quantidade: {
            type: "number"
          }
        }
      }
    }
  }
};
