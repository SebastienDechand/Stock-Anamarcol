import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stock Anamarcol API",
      version: "1.0.0",
      description: "API de gestion de stock Anamarcol",
    },
    servers: [{ url: "http://localhost:4000", description: "Local" }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "jwt",
        },
      },
      schemas: {
        Item: {
          type: "object",
          properties: {
            _id: { type: "string" },
            posterId: { type: "string" },
            modifierName: { type: "string" },
            denomination: { type: "string" },
            quantite: { type: "number" },
            fournisseur: { type: "string" },
            etat: { type: "string" },
            image: { type: "string" },
            prepaCG: { type: "boolean" },
            prepaCaisse: { type: "boolean" },
            prepaTPV: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            pseudo: { type: "string" },
            email: { type: "string" },
            picture: { type: "string" },
            poste: { type: "string" },
            numero: { type: "string" },
            role: { type: "string" },
          },
        },
        Contact: {
          type: "object",
          properties: {
            _id: { type: "string" },
            nom: { type: "string" },
            email: { type: "string" },
            lien: { type: "string" },
            picture: { type: "string" },
            poste: { type: "string" },
            tel: { type: "string" },
          },
        },
        History: {
          type: "object",
          properties: {
            _id: { type: "string" },
            itemId: { type: "string" },
            action: { type: "string", enum: ["create", "update", "delete", "quantity_change"] },
            field: { type: "string" },
            oldValue: { type: "string" },
            newValue: { type: "string" },
            userName: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
    paths: {
      // ─── Auth ───
      "/api/user/register": {
        post: {
          tags: ["Auth"],
          summary: "Inscription",
          requestBody: {
            content: { "application/json": { schema: { type: "object", properties: { pseudo: { type: "string" }, email: { type: "string" }, password: { type: "string" } }, required: ["pseudo", "email", "password"] } } },
          },
          responses: { 201: { description: "Utilisateur créé" }, 400: { description: "Erreur de validation" } },
        },
      },
      "/api/user/login": {
        post: {
          tags: ["Auth"],
          summary: "Connexion",
          requestBody: {
            content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] } } },
          },
          responses: { 200: { description: "Connexion réussie" }, 400: { description: "Identifiants invalides" } },
        },
      },
      "/api/user/logout": {
        get: { tags: ["Auth"], summary: "Déconnexion", responses: { 200: { description: "Déconnecté" } } },
      },
      "/jwtid": {
        get: { tags: ["Auth"], summary: "Vérifier le JWT (retourne id + rôle)", responses: { 200: { description: "OK" }, 401: { description: "Non authentifié" } } },
      },
      // ─── Users ───
      "/api/user": {
        get: { tags: ["Users"], summary: "Liste des utilisateurs", responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/User" } } } } } } },
      },
      "/api/user/{id}": {
        get: { tags: ["Users"], summary: "Info utilisateur", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
        put: { tags: ["Users"], summary: "Modifier utilisateur", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
        delete: { tags: ["Users"], summary: "Supprimer utilisateur", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      },
      "/api/user/upload": {
        post: { tags: ["Users"], summary: "Upload photo de profil", requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } }, responses: { 200: { description: "OK" } } },
      },
      // ─── Items ───
      "/api/item": {
        get: {
          tags: ["Items"],
          summary: "Liste des articles (paginée)",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "fournisseur", in: "query", schema: { type: "string" }, description: "Virgule-séparé" },
            { name: "etat", in: "query", schema: { type: "string" }, description: "Virgule-séparé" },
            { name: "prepaCG", in: "query", schema: { type: "boolean" } },
            { name: "prepaCaisse", in: "query", schema: { type: "boolean" } },
            { name: "prepaTPV", in: "query", schema: { type: "boolean" } },
            { name: "sortBy", in: "query", schema: { type: "string" } },
            { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { items: { type: "array", items: { $ref: "#/components/schemas/Item" } }, total: { type: "number" }, page: { type: "number" }, totalPages: { type: "number" } } } } } } },
        },
        post: { tags: ["Items"], summary: "Créer un article", requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Item" } } } }, responses: { 201: { description: "Créé" } } },
      },
      "/api/item/{id}": {
        get: { tags: ["Items"], summary: "Détail d'un article", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
        put: { tags: ["Items"], summary: "Modifier un article", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
        delete: { tags: ["Items"], summary: "Supprimer un article (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      },
      "/api/item/history/{id}": {
        get: { tags: ["Items"], summary: "Historique d'un article", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/History" } } } } } } },
      },
      "/api/item/upload": {
        post: { tags: ["Items"], summary: "Upload image article", requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" }, itemId: { type: "string" } } } } } }, responses: { 200: { description: "OK" } } },
      },
      // ─── Contacts ───
      "/api/contacts": {
        get: { tags: ["Contacts"], summary: "Liste des contacts", responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Contact" } } } } } } },
        post: { tags: ["Contacts"], summary: "Créer un contact (admin)", responses: { 201: { description: "Créé" } } },
      },
      "/api/contacts/{id}": {
        get: { tags: ["Contacts"], summary: "Détail d'un contact", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
        put: { tags: ["Contacts"], summary: "Modifier un contact (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
        delete: { tags: ["Contacts"], summary: "Supprimer un contact (admin)", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      },
      // ─── Statistics ───
      "/api/statistics/dashboard": {
        get: { tags: ["Statistics"], summary: "Dashboard complet (toutes les stats)", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/articles": {
        get: { tags: ["Statistics"], summary: "Nombre d'articles", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/stock": {
        get: { tags: ["Statistics"], summary: "Stock total", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/fournisseurs": {
        get: { tags: ["Statistics"], summary: "Nombre de fournisseurs", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/articles/stockinf5": {
        get: { tags: ["Statistics"], summary: "Nb articles stock < 5", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/articles/low-stock": {
        get: { tags: ["Statistics"], summary: "Articles en stock faible", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/fournisseurs/list": {
        get: { tags: ["Statistics"], summary: "Liste des fournisseurs", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/fournisseurs/{fournisseur}": {
        get: { tags: ["Statistics"], summary: "Stats par fournisseur", parameters: [{ name: "fournisseur", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/etats/list": {
        get: { tags: ["Statistics"], summary: "Liste des états", responses: { 200: { description: "OK" } } },
      },
      "/api/statistics/etats/{etat}": {
        get: { tags: ["Statistics"], summary: "Stats par état", parameters: [{ name: "etat", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "OK" } } },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
