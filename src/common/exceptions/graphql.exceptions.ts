import { GraphQLError } from 'graphql';

export class NotFoundError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'NOT_FOUND',
      },
    });
  }
}

export class UnAuthorizedError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'UNAUTHORIZED',
      },
    });
  }
}

/** Signed in, but not allowed. Clients keep the session (unlike UNAUTHORIZED). */
export class ForbiddenError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'FORBIDDEN',
      },
    });
  }
}

export class BadRequestError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'BAD_REQUEST',
      },
    });
  }
}

export class InternalServerError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
}

export class UserError extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: 'USER_ERROR',
      },
    });
  }
}
