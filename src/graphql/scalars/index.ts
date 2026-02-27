import { Kind } from 'graphql';
import { Scalar, CustomScalar } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@Scalar('JSON')
export class JSONScalar implements CustomScalar<any, any> {
  description = 'JSON custom scalar type';

  parseValue(value: any): any {
    return value;
  }

  serialize(value: any): any {
    return value;
  }

  parseLiteral(ast: any): any {
    if (ast.kind === Kind.OBJECT) {
      return JSON.parse(JSON.stringify(ast.value));
    }
    return null;
  }
}

export { GraphQLJSON };
