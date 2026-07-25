import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stock Anamarcol API",
      version: "1.0.0",
      description: "Anamarcol stock management API",
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
            name: { type: "string" },
            quantity: { type: "number" },
            supplier: { type: "string" },
            status: { type: "string" },
            image: { type: "string" },
            cgKit: { type: "boolean" },

            tpvKit: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            picture: { type: "string" },
            position: { type: "string" },
            phone: { type: "string" },
            department: { type: "string" },
            role: { type: "string" },
          },
        },
        Contact: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            link: { type: "string" },
            picture: { type: "string" },
            position: { type: "string" },
            phone: { type: "string" },
          },
        },
        History: {
          type: "object",
          properties: {
            _id: { type: "string" },
            itemId: { type: "string" },
            action: {
              type: "string",
              enum: ["create", "update", "delete", "quantity_change"],
            },
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
      // #region Auth
      "/api/user/register": {
        post: {
          tags: ["Auth"],
          summary: "Inscription",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["username", "email", "password"],
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            400: { description: "Validation error" },
          },
        },
      },
      "/api/user/login": {
        post: {
          tags: ["Auth"],
          summary: "Connexion",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: {
            200: { description: "Login successful" },
            400: { description: "Invalid credentials" },
          },
        },
      },
      "/api/user/logout": {
        get: {
          tags: ["Auth"],
          summary: "Déconnexion",
          responses: { 200: { description: "Logged out" } },
        },
      },
      "/jwtid": {
        get: {
          tags: ["Auth"],
          summary: "Vérifier le JWT (retourne id + rôle)",
          responses: {
            200: { description: "OK" },
            401: { description: "Not authenticated" },
          },
        },
      },
      // #endregion
      // #region Users
      "/api/user": {
        get: {
          tags: ["Users"],
          summary: "Liste des utilisateurs",
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Users"],
          summary: "Créer un utilisateur (admin)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    username: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["username", "email", "password"],
                },
              },
            },
          },
          responses: {
            201: { description: "User created" },
            403: { description: "Access denied - admin required" },
          },
        },
      },
      "/api/user/{id}": {
        get: {
          tags: ["Users"],
          summary: "Info utilisateur",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        put: {
          tags: ["Users"],
          summary: "Modifier utilisateur",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        delete: {
          tags: ["Users"],
          summary: "Supprimer utilisateur",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/user/upload": {
        post: {
          tags: ["Users"],
          summary: "Upload photo de profil",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: { file: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/user/{id}/role": {
        put: {
          tags: ["Users"],
          summary: "Modifier le rôle d'un utilisateur (admin)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    role: {
                      type: "string",
                      enum: ["user", "hotline", "admin", "superadmin"],
                    },
                  },
                  required: ["role"],
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            403: { description: "Access denied" },
          },
        },
      },
      // #endregion
      // #region Items
      "/api/item": {
        get: {
          tags: ["Items"],
          summary: "Liste des articles (paginée)",
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", default: 1 },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20 },
            },
            { name: "search", in: "query", schema: { type: "string" } },
            {
              name: "supplier",
              in: "query",
              schema: { type: "string" },
              description: "Comma-separated",
            },
            {
              name: "status",
              in: "query",
              schema: { type: "string" },
              description: "Comma-separated",
            },
            { name: "cgKit", in: "query", schema: { type: "boolean" } },
            { name: "tpvKit", in: "query", schema: { type: "boolean" } },
            { name: "sortBy", in: "query", schema: { type: "string" } },
            {
              name: "sortOrder",
              in: "query",
              schema: { type: "string", enum: ["asc", "desc"] },
            },
          ],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Item" },
                      },
                      total: { type: "number" },
                      page: { type: "number" },
                      totalPages: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Items"],
          summary: "Créer un article",
          requestBody: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Item" },
              },
            },
          },
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/item/{id}": {
        get: {
          tags: ["Items"],
          summary: "Détail d'un article",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        put: {
          tags: ["Items"],
          summary: "Modifier un article",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        delete: {
          tags: ["Items"],
          summary: "Supprimer un article (admin)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/item/history/{id}": {
        get: {
          tags: ["Items"],
          summary: "Historique d'un article",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/History" },
                  },
                },
              },
            },
          },
        },
      },
      "/api/item/upload": {
        post: {
          tags: ["Items"],
          summary: "Upload image article",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    itemId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/item/preparation-batch": {
        post: {
          tags: ["Items"],
          summary: "Opérations de préparation en lot (cgKit / tpvKit)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ids: { type: "array", items: { type: "string" } },
                    field: { type: "string", enum: ["cgKit", "tpvKit"] },
                    value: { type: "boolean" },
                  },
                  required: ["ids", "field", "value"],
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            401: { description: "Not authenticated" },
          },
        },
      },
      // #endregion
      // #region Contacts
      "/api/contacts": {
        get: {
          tags: ["Contacts"],
          summary: "Liste des contacts",
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Contact" },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Contacts"],
          summary: "Créer un contact (admin)",
          responses: { 201: { description: "Created" } },
        },
      },
      "/api/contacts/upload": {
        post: {
          tags: ["Contacts"],
          summary: "Upload photo de contact (admin)",
          requestBody: {
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    contactId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "OK" },
            403: { description: "Access denied" },
          },
        },
      },
      "/api/contacts/{id}": {
        get: {
          tags: ["Contacts"],
          summary: "Détail d'un contact",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        put: {
          tags: ["Contacts"],
          summary: "Modifier un contact (admin)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
        delete: {
          tags: ["Contacts"],
          summary: "Supprimer un contact (admin)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      // #endregion
      // #region History
      "/api/history": {
        get: {
          tags: ["History"],
          summary: "Historique complet (audit + items, admin)",
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 200 },
            },
          ],
          responses: {
            200: { description: "OK" },
            401: { description: "Not authenticated" },
            403: { description: "Access denied - admin required" },
          },
        },
      },
      // #endregion
      // #region Shipments
      "/api/shipments": {
        get: {
          tags: ["Shipments"],
          summary: "Liste des envois (Hotline + admin)",
          responses: {
            200: { description: "OK" },
            401: { description: "Not authenticated" },
            403: { description: "Access denied" },
          },
        },
        post: {
          tags: ["Shipments"],
          summary: "Créer un envoi (Hotline + admin)",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    clientName: { type: "string" },
                    piece: { type: "string" },
                    address: { type: "string" },
                    requestDate: { type: "string", format: "date-time" },
                    description: { type: "string" },
                  },
                  required: ["clientName"],
                },
              },
            },
          },
          responses: {
            201: { description: "Created" },
            401: { description: "Not authenticated" },
            403: { description: "Access denied" },
          },
        },
      },
      "/api/shipments/{id}/sent": {
        put: {
          tags: ["Shipments"],
          summary: "Marquer un envoi comme envoyé (Hotline + admin)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "OK" },
            401: { description: "Not authenticated" },
            403: { description: "Access denied" },
          },
        },
      },
      "/api/shipments/{id}": {
        delete: {
          tags: ["Shipments"],
          summary: "Supprimer un envoi (admin)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "OK" },
            401: { description: "Not authenticated" },
            403: { description: "Access denied - admin required" },
          },
        },
      },
      "/api/history/purge": {
        post: {
          tags: ["History"],
          summary: "Purger tout l'historique et l'audit (superadmin)",
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      deletedAudit: { type: "number" },
                      deletedHistory: { type: "number" },
                    },
                  },
                },
              },
            },
            403: { description: "Access denied - superadmin required" },
          },
        },
      },
      // #endregion
      // #region Statistics
      "/api/statistics/dashboard": {
        get: {
          tags: ["Statistics"],
          summary: "Dashboard complet (toutes les stats)",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/articles": {
        get: {
          tags: ["Statistics"],
          summary: "Nombre d'articles",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/stock": {
        get: {
          tags: ["Statistics"],
          summary: "Stock total",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/suppliers": {
        get: {
          tags: ["Statistics"],
          summary: "Nombre de fournisseurs",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/articles/stockinf5": {
        get: {
          tags: ["Statistics"],
          summary: "Nb articles stock < 5",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/articles/low-stock": {
        get: {
          tags: ["Statistics"],
          summary: "Articles en stock faible",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/suppliers/list": {
        get: {
          tags: ["Statistics"],
          summary: "Liste des fournisseurs",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/suppliers/{supplier}": {
        get: {
          tags: ["Statistics"],
          summary: "Stats par fournisseur",
          parameters: [
            {
              name: "supplier",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/statuses/list": {
        get: {
          tags: ["Statistics"],
          summary: "Liste des états",
          responses: { 200: { description: "OK" } },
        },
      },
      "/api/statistics/statuses/{status}": {
        get: {
          tags: ["Statistics"],
          summary: "Stats par état",
          parameters: [
            {
              name: "status",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: { 200: { description: "OK" } },
        },
      },
      // #endregion
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
