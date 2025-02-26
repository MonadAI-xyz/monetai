import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import HttpException from '@exceptions/http/HttpException';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { removeRequestUnwantedProperties } from '@utils/utils';
import { HttpError } from '@exceptions/http/HttpError';

// Utility function to format validation errors
const formatErrors = (errors: ValidationError[], property = '', formatted: Record<string, string> = {}): Record<string, string> => {
  errors.forEach((error: ValidationError) => {
    if (error.constraints) {
      formatted[property ? `${property}[${error.property}]` : error.property] = Object.values(error.constraints).join(', ');
    } else {
      Object.assign(formatted, formatErrors(error.children, property ? `${property}[${error.property}]` : error.property, formatted));
    }
  });
  return formatted;
};

// Validation middleware
const validationMiddleware = (
  RequestDTO: new () => any,
  value: 'body' | 'query' | 'params' = 'body',
  removeUnwantedProperties = true,
  skipMissingProperties = false,
): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (removeUnwantedProperties) {
        const className = RequestDTO.name;
        const schema = validationMetadatasToSchemas({ schemaNameField: className });
        const DTOProperties = schema[className]?.properties;
        if (DTOProperties) {
          req[value] = removeRequestUnwantedProperties(Object.keys(DTOProperties), req[value]);
        }
      }

      const objectToValidate = plainToInstance(RequestDTO, req[value]);
      const errors = await validate(objectToValidate, { skipMissingProperties });

      if (errors.length > 0) {
        const formattedErrors = formatErrors(errors);
        const message = `${'ERROR_MESSAGE.ERROR.VALIDATION_ERROR'}: ${Object.keys(formattedErrors).join(', ')}`;
        next(new HttpError({ message, errors: { errors: formattedErrors, status: 400 } }));
      } else {
        next();
      }
    } catch (error) {
      console.error('[VALIDATION] Error:', error);
      next(new HttpException(500, error?.message || 'Internal Server Error'));
    }
  };
};

export default validationMiddleware;
