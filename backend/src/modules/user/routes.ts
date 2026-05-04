import type { FastifyInstance } from 'fastify';
import { loginHandler, registerHandler, logoutHandler, profileHandler, listUsersHandler, deleteUserHandler, changePasswordHandler } from './handler.js';
import { authenticateUser, authenticateAdmin } from '../../middleware/auth.js';

const loginSchema = {
  description: 'User login',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      requestId: { type: 'string' },
      username: { type: 'string', description: 'Username' },
      password: { type: 'string', description: 'Password' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            token: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                expires_at: { type: 'number' }
              }
            },
            profile: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                user_id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                nickname: { type: 'string' },
                avatar: { type: 'string' },
                gender: { type: 'string' },
                description: { type: 'string' },
                department: { type: 'string' },
                remark: { type: 'string' }
              }
            },
            permissions: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }
};

const registerSchema = {
  description: 'User registration',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      requestId: { type: 'string' },
      username: { type: 'string', description: 'Username' },
      password: { type: 'string', description: 'Password' },
      role: { type: 'string', description: 'User role (default: user)' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        }
      }
    }
  }
};

const logoutSchema = {
  description: 'User logout',
  tags: ['User'],
  body: {
    type: 'object',
    properties: {
      requestId: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' }
      }
    }
  }
};

const profileSchema = {
  description: 'Get user profile',
  tags: ['User'],
  body: {
    type: 'object',
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'Profile ID (optional, uses token user if omitted)' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                user_id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                nickname: { type: 'string' },
                avatar: { type: 'string' },
                gender: { type: 'string' },
                description: { type: 'string' },
                department: { type: 'string' },
                remark: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

const listUsersSchema = {
  description: 'List users',
  tags: ['User'],
  body: {
    type: 'object',
    properties: {
      requestId: { type: 'string' },
      role: { type: 'string', description: 'Filter by role (admin/user)' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  role: { type: 'string' },
                  disabled: { type: 'number' },
                  profile_id: { type: 'string' },
                  created_at: { type: 'number' },
                  updated_at: { type: 'number' },
                  profile: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      user_id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      nickname: { type: 'string' },
                      avatar: { type: 'string' },
                      gender: { type: 'string' },
                      description: { type: 'string' },
                      department: { type: 'string' },
                      remark: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const deleteUserSchema = {
  description: 'Delete a user',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'User ID' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
      },
    },
  },
};

const changePasswordSchema = {
  description: 'Change user password',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['id', 'new_password'],
    properties: {
      requestId: { type: 'string' },
      id: { type: 'string', description: 'User ID' },
      new_password: { type: 'string', description: 'New password' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        code: { type: 'number' },
        message: { type: 'string' },
      },
    },
  },
};

export async function userRoutes(fastify: FastifyInstance) {
  fastify.post('/api/user/login', { schema: loginSchema }, loginHandler);
  fastify.post('/api/user/register', { schema: registerSchema }, registerHandler);
  fastify.post('/api/user/logout', { preHandler: [authenticateUser], schema: logoutSchema }, logoutHandler);
  fastify.post('/api/user/profile', { preHandler: [authenticateUser], schema: profileSchema }, profileHandler);
  fastify.post('/api/user/list', { preHandler: [authenticateAdmin], schema: listUsersSchema }, listUsersHandler);
  fastify.post('/api/user/delete', { preHandler: [authenticateAdmin], schema: deleteUserSchema }, deleteUserHandler);
  fastify.post('/api/user/password', { preHandler: [authenticateAdmin], schema: changePasswordSchema }, changePasswordHandler);
}

export default userRoutes;