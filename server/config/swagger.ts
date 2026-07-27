import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stock Anamarcol API',
      version: '1.0.0',
      description: 'Anamarcol stock management API',
    },
    servers: [{ url: 'http://localhost:4000', description: 'Local' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
        },
      },
      schemas: {
        Item: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            posterId: { type: 'string' },
            modifierName: { type: 'string' },
            name: { type: 'string' },
            quantity: { type: 'number' },
            supplier: { type: 'string' },
            status: { type: 'string' },
            image: { type: 'string' },
            cgKit: { type: 'boolean' },

            tpvKit: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            picture: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
            department: { type: 'string' },
            role: { type: 'string' },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            link: { type: 'string' },
            picture: { type: 'string' },
            position: { type: 'string' },
            phone: { type: 'string' },
          },
        },
        History: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            itemId: { type: 'string' },
            action: {
              type: 'string',
              enum: ['create', 'update', 'delete', 'quantity_change'],
            },
            field: { type: 'string' },
            oldValue: { type: 'string' },
            newValue: { type: 'string' },
            userName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
    paths: {
      // #region Auth
      '/api/user/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['username', 'email', 'password'],
                },
              },
            },
          },
          responses: {
            201: { description: 'User created' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/user/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            400: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/user/logout': {
        get: {
          tags: ['Auth'],
          summary: 'Logout',
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/jwtid': {
        get: {
          tags: ['Auth'],
          summary: 'Verify JWT (returns id + role)',
          responses: {
            200: { description: 'OK' },
            401: { description: 'Not authenticated' },
          },
        },
      },
      // #endregion
      // #region Users
      '/api/user': {
        get: {
          tags: ['Users'],
          summary: 'List users',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Create a user (admin)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                  required: ['username', 'email', 'password'],
                },
              },
            },
          },
          responses: {
            201: { description: 'User created' },
            403: { description: 'Access denied - admin required' },
          },
        },
      },
      '/api/user/{id}': {
        get: {
          tags: ['Users'],
          summary: 'User info',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/user/upload': {
        post: {
          tags: ['Users'],
          summary: 'Upload profile picture',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/user/{id}/role': {
        put: {
          tags: ['Users'],
          summary: "Update a user's role (admin)",
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      enum: ['user', 'hotline', 'admin', 'superadmin'],
                    },
                  },
                  required: ['role'],
                },
              },
            },
          },
          responses: {
            200: { description: 'OK' },
            403: { description: 'Access denied' },
          },
        },
      },
      // #endregion
      // #region Items
      '/api/item': {
        get: {
          tags: ['Items'],
          summary: 'List items (paginated)',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20 },
            },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            {
              name: 'supplier',
              in: 'query',
              schema: { type: 'string' },
              description: 'Comma-separated',
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: 'Comma-separated',
            },
            { name: 'cgKit', in: 'query', schema: { type: 'boolean' } },
            { name: 'tpvKit', in: 'query', schema: { type: 'boolean' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string' } },
            {
              name: 'sortOrder',
              in: 'query',
              schema: { type: 'string', enum: ['asc', 'desc'] },
            },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Item' },
                      },
                      total: { type: 'number' },
                      page: { type: 'number' },
                      totalPages: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Items'],
          summary: 'Create an item',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Item' },
              },
            },
          },
          responses: { 201: { description: 'Created' } },
        },
      },
      '/api/item/{id}': {
        get: {
          tags: ['Items'],
          summary: 'Item detail',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Items'],
          summary: 'Update an item',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
        delete: {
          tags: ['Items'],
          summary: 'Delete an item (admin)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/item/history/{id}': {
        get: {
          tags: ['Items'],
          summary: 'Item history',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/History' },
                  },
                },
              },
            },
          },
        },
      },
      '/api/item/upload': {
        post: {
          tags: ['Items'],
          summary: 'Upload item image',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    itemId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/item/preparation-batch': {
        post: {
          tags: ['Items'],
          summary: 'Batch preparation operations (cgKit / tpvKit)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ids: { type: 'array', items: { type: 'string' } },
                    field: { type: 'string', enum: ['cgKit', 'tpvKit'] },
                    value: { type: 'boolean' },
                  },
                  required: ['ids', 'field', 'value'],
                },
              },
            },
          },
          responses: {
            200: { description: 'OK' },
            401: { description: 'Not authenticated' },
          },
        },
      },
      // #endregion
      // #region Contacts
      '/api/contacts': {
        get: {
          tags: ['Contacts'],
          summary: 'List contacts',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Contact' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Contacts'],
          summary: 'Create a contact (admin)',
          responses: { 201: { description: 'Created' } },
        },
      },
      '/api/contacts/upload': {
        post: {
          tags: ['Contacts'],
          summary: 'Upload contact picture (admin)',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    contactId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'OK' },
            403: { description: 'Access denied' },
          },
        },
      },
      '/api/contacts/{id}': {
        get: {
          tags: ['Contacts'],
          summary: 'Contact detail',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
        put: {
          tags: ['Contacts'],
          summary: 'Update a contact (admin)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
        delete: {
          tags: ['Contacts'],
          summary: 'Delete a contact (admin)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      // #endregion
      // #region History
      '/api/history': {
        get: {
          tags: ['History'],
          summary: 'Full history (audit + items, admin)',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 200 },
            },
          ],
          responses: {
            200: { description: 'OK' },
            401: { description: 'Not authenticated' },
            403: { description: 'Access denied - admin required' },
          },
        },
      },
      // #endregion
      // #region Shipments
      '/api/shipments': {
        get: {
          tags: ['Shipments'],
          summary: 'List shipments (Hotline + admin)',
          responses: {
            200: { description: 'OK' },
            401: { description: 'Not authenticated' },
            403: { description: 'Access denied' },
          },
        },
        post: {
          tags: ['Shipments'],
          summary: 'Create a shipment (Hotline + admin)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    clientName: { type: 'string' },
                    piece: { type: 'string' },
                    address: { type: 'string' },
                    requestDate: { type: 'string', format: 'date-time' },
                    description: { type: 'string' },
                  },
                  required: ['clientName'],
                },
              },
            },
          },
          responses: {
            201: { description: 'Created' },
            401: { description: 'Not authenticated' },
            403: { description: 'Access denied' },
          },
        },
      },
      '/api/shipments/{id}/sent': {
        put: {
          tags: ['Shipments'],
          summary: 'Mark a shipment as sent (Hotline + admin)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'OK' },
            401: { description: 'Not authenticated' },
            403: { description: 'Access denied' },
          },
        },
      },
      '/api/shipments/{id}': {
        delete: {
          tags: ['Shipments'],
          summary: 'Delete a shipment (admin)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'OK' },
            401: { description: 'Not authenticated' },
            403: { description: 'Access denied - admin required' },
          },
        },
      },
      '/api/history/purge': {
        post: {
          tags: ['History'],
          summary: 'Purge all history and audit logs (superadmin)',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      deletedAudit: { type: 'number' },
                      deletedHistory: { type: 'number' },
                    },
                  },
                },
              },
            },
            403: { description: 'Access denied - superadmin required' },
          },
        },
      },
      // #endregion
      // #region Statistics
      '/api/statistics/dashboard': {
        get: {
          tags: ['Statistics'],
          summary: 'Full dashboard (all stats)',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/articles': {
        get: {
          tags: ['Statistics'],
          summary: 'Number of items',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/stock': {
        get: {
          tags: ['Statistics'],
          summary: 'Total stock',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/suppliers': {
        get: {
          tags: ['Statistics'],
          summary: 'Number of suppliers',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/articles/stockinf5': {
        get: {
          tags: ['Statistics'],
          summary: 'Items with stock < 5',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/articles/low-stock': {
        get: {
          tags: ['Statistics'],
          summary: 'Low stock items',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/suppliers/list': {
        get: {
          tags: ['Statistics'],
          summary: 'List suppliers',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/suppliers/{supplier}': {
        get: {
          tags: ['Statistics'],
          summary: 'Stats by supplier',
          parameters: [
            {
              name: 'supplier',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/statuses/list': {
        get: {
          tags: ['Statistics'],
          summary: 'List statuses',
          responses: { 200: { description: 'OK' } },
        },
      },
      '/api/statistics/statuses/{status}': {
        get: {
          tags: ['Statistics'],
          summary: 'Stats by status',
          parameters: [
            {
              name: 'status',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { 200: { description: 'OK' } },
        },
      },
      // #endregion
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
