import db from '@database';
import { IQuerySearchParams } from '@interfaces/paginate.interface';
import { FindOptions, literal, Op } from 'sequelize';
import _ from 'lodash';
import { validate } from 'uuid';
import uuidParser from 'uuid-parse';
import SearchBuilder from '@utils/sequelize/searchBuilder';
import bcrypt from 'bcryptjs';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

export const toUnderscored = obj => {
  _.forEach(obj, (k, v) => {
    obj[k] = v.replace(/(?:^|\.?)([A-Z])/g, (x, y) => `_${y.toLowerCase()}`).replace(/^_/, '');
  });
  return obj;
};

export const diffToString = val => {
  if (typeof val === 'undefined' || val === null) {
    return '';
  }
  if (val === true) {
    return '1';
  }
  if (val === false) {
    return '0';
  }
  if (typeof val === 'string') {
    return val;
  }
  if (!Number.isNaN(Number(val))) {
    return `${String(val)}`;
  }
  if ((typeof val === 'undefined' ? 'undefined' : typeof val) === 'object') {
    return `${JSON.stringify(val)}`;
  }
  if (Array.isArray(val)) {
    return `${JSON.stringify(val)}`;
  }
  return '';
};

export const isEmpty = (value: any): boolean => {
  if (value === null) {
    return true;
  } else if (typeof value !== 'number' && value === '') {
    return true;
  } else if (value === 'undefined' || value === undefined) {
    return true;
  } else return value !== null && typeof value === 'object' && !Object.keys(value).length;
};

export function formatPaginate(query: IQuerySearchParams): IQuerySearchParams {
  const defaultLimit = 1000;
  const order: string = query.order || 'DESC';
  const orderBy: string = query.orderBy || 'createdAt';
  const search: string = query.search || '';
  const limit = Number(query.limit) || defaultLimit;
  const offset = Number(query.offset) || 0;

  return { limit, offset, order, orderBy, search };
}

export function formatUsername(name: string): string {
  return name
    ? name
        .toLowerCase()
        .replace(/ /g, '_')
        .replace(/[^a-zA-Z0-9_ ]/g, '')
    : null;
}

export function isEmail(email: string): boolean {
  const emailRegexp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return email ? emailRegexp.test(email) : false;
}

export function getObjectDifference(a, b) {
  return _.reduce(
    a,
    function (result, value, key) {
      if (value && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      if (b[key] && typeof b[key] === 'object') {
        b[key] = JSON.stringify(b[key]);
      }
      return value == b[key] ? result : result.concat(key);
    },
    [],
  );
}

export function getArrayKeysDifference(a, b) {
  return _.reduce(
    b,
    function (result, value) {
      return a.includes(value) ? result : result.concat(value);
    },
    [],
  );
}

export function removeRequestUnwantedProperties(a: any, b: any) {
  const results = {};

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== undefined && b[a[i]] !== undefined) {
      results[a[i]] = b[a[i]];
    }
  }
  return results;
}

// search the database rows for given conditions,keyword and searchBy
export const searchGenerator = (options: any, keyword: string, searchBy = ['name']) => {
  const searchByWhat = [];
  searchBy.forEach(key =>
    searchByWhat.push({
      [key]: { [Op.iLike]: `%${keyword}%` },
    }),
  );

  options = {
    ...options,
    where: {
      ...options.where,
      [Op.or]: searchByWhat,
    },
  };

  return options;
};

export const formatIncludes = include => {
  const relationships = [];
  if (include && include.length > 0) {
    const associations = include.split(',');
    for (const association of associations) {
      if (association) relationships.push({ include: [], required: false, where: {}, association });
    }
  }
  return relationships;
};

export const capitalizeFirstLetter = string => string.charAt(0).toUpperCase() + string.slice(1);

export const camelCaseToUpperCase = (text: string): string | null => {
  return _.upperFirst(_.startCase(text).toLowerCase());
};

export const formatErrorText = (errors: string[]): string[] => {
  return errors.map(err => camelCaseToUpperCase(err));
};

export const extractSequelizeModelName = (modelName: string): string | null => {
  return modelName ? _.camelCase(modelName.split('Model')[0]) : null;
};

export const sanitizeWhere = obj => {
  if (obj && obj.where) {
    for (const key in obj.where) {
      if (obj.where[key] === undefined) {
        delete obj.where[key];
      }
    }
  }
  return obj;
};

export const delay = ms => new Promise(res => setTimeout(res, ms));

export const convertJSONKeys = (object, keys, invert = true) => {
  const newObject = {};
  if (invert) {
    keys = _.invert(keys);
  }
  Object.entries(object).forEach((o: any[]) => {
    newObject[keys[o[0]] ?? o[0]] = o[1];
  });
  return newObject;
};

export const hexToUUID = (hexString, invalidStringMsg = '') => {
  if (validate(hexString)) {
    return hexString;
  }
  const parsedHexString = hexString.replace(new RegExp('^0x'), '');

  if (!/[0-9A-Fa-f]{6}/g.test(parsedHexString)) {
    throw new Error(invalidStringMsg || 'Value is not valid hexadecimal number');
  }
  //Allocate 16 bytes for the uuid bytes representation
  const hexBuffer = Buffer.from(parsedHexString, 'hex');

  //Parse uuid string representation and send bytes into buffer
  const uuidResultBuffer = uuidParser.unparse(hexBuffer);

  //Create uuid utf8 string representation
  return uuidResultBuffer.toString('utf8');
};

export const sequelizeQueryBuilder = (
  options: FindOptions,
  queryParams: any,
  allowedKeys = ['name'],
  literals?: string | string[] | { searchOn: string; key: string }[],
  decodeQueryParams = true,
) => {
  const convertKeyToSnakeCase = (key: string) => {
    if (key.includes('.')) {
      const [relation, field] = key.split('.');
      return `${relation}.${_.snakeCase(field)}`;
    }
    return key;
  };

  const convertedKeys = allowedKeys.map(convertKeyToSnakeCase);
  const convertedFilter = _.mapKeys(queryParams?.filter, (_value, key) => convertKeyToSnakeCase(key));

  const convertedQueryParams = {
    ...queryParams,
    filter: convertedFilter,
  };

  if (convertedQueryParams?.filter) {
    convertedQueryParams.filter = _.pickBy(convertedQueryParams?.filter, (_value, key) => convertedKeys?.includes(key) || key === '_condition');
    if (decodeQueryParams === true) {
      //This part is when we have cyrillic letters to decode them because they come encoded, simple word comes in a format seemed as gybrish
      const queryParamsFilterKeys = Object.keys(convertedQueryParams?.filter);

      queryParamsFilterKeys?.forEach(k => {
        try {
          if (convertedQueryParams?.filter[k]?.iLike) {
            convertedQueryParams.filter[k].iLike = `%${decodeURIComponent(convertedQueryParams.filter[k].iLike.slice(1, -1))}%`;
          }
        } catch (e) {
          console.log('[ERROR_SEARCH]', e);
        }
      });
      //End of this check
    }
  } else {
    convertedQueryParams.filter = {};
  }

  let generatedOptions = new SearchBuilder(db.sequelize, convertedQueryParams).getFullQuery();

  generatedOptions.where = {
    ...generatedOptions.where,
    ...options.where,
  };

  delete options.where;
  generatedOptions = {
    ...generatedOptions,
    ...options,
  };

  if (literals?.length > 0) {
    literalSearch(generatedOptions, literals);
  }
  return generatedOptions;
};

export const literalSearch = (
  options: FindOptions,
  queryParams:
    | string
    | string[]
    | {
        searchOn: string;
        key: string;
      }[],
) => {
  if (options?.where && Object.keys(options.where).length > 0) {
    const prepareAndApplyLiteralSearch = (param: string | { searchOn: string; key: string }) => {
      const { key, searchOn } = prepareLiteralSearch(param);

      const whereClause = options.where[Op.or]?.[key] ?? options.where[key];
      if (whereClause?.[Op.iLike]) {
        const literalSearch = literal(`${searchOn}::text ILIKE '${whereClause[Op.iLike]}'`);
        if (options.where[Op.or]?.[key]) {
          options.where[Op.or][key] = literalSearch;
        } else {
          options.where[key] = literalSearch;
        }
      }
    };

    if (Array.isArray(queryParams)) {
      queryParams.forEach(prepareAndApplyLiteralSearch);
    } else {
      prepareAndApplyLiteralSearch(queryParams);
    }
  } else {
    console.log('No match:', options, Object.keys(options), typeof queryParams, queryParams);
  }
};

export const splitCamelCase = (string: string) => string.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');

export async function hashToken(token, saltRounds = 10) {
  const hashedToken = await bcrypt.hash(token, saltRounds);
  // Encode the hashed token using base64 without '/'
  return hashedToken.replace(/\//g, '_');
}

export function hashSyncPassword(password, saltRounds = 10) {
  return bcrypt.hashSync(password, saltRounds);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function getDTOvalues(dto: any) {
  return Object.values(dto).filter(value => typeof value === 'string');
}

export const prepareLiteralSearch = (
  queryParams: string | { searchOn: string; key: string },
): {
  searchOn: string;
  key: string;
} => {
  if (typeof queryParams === 'string') {
    return {
      searchOn: queryParams,
      key: queryParams,
    };
  }
  return queryParams;
};

export class EnumHelpers {
  static getNamesAndValues<T extends number>(e: any) {
    return EnumHelpers.getNames(e).map(n => ({ id: n, name: n, value: e[n] as T }));
  }

  static getNames(e: any) {
    return EnumHelpers.getObjValues(e).filter(v => typeof v === 'string') as string[];
  }

  static getValues<T extends number>(e: any) {
    return EnumHelpers.getObjValues(e).filter(v => typeof v === 'number') as T[];
  }

  static getSelectList<T extends number, U>(e: any, stringConverter: (arg: U) => string) {
    const selectList = new Map<T, string>();
    this.getValues(e).forEach(val => selectList.set(val as T, stringConverter(val as unknown as U)));
    return selectList;
  }

  static getSelectListAsArray<T extends number, U>(e: any, stringConverter: (arg: U) => string) {
    return Array.from(this.getSelectList(e, stringConverter), value => ({
      value: value[0] as T,
      presentation: value[1],
    }));
  }

  private static getObjValues(e: any): (number | string)[] {
    return Object.keys(e).map(k => e[k]);
  }
}

export function getModel(model: string): any {
  const getModelKeys = db.models;
  const convertName = _.upperFirst(_.camelCase(model));
  return getModelKeys[convertName];
}

export function generateSwaggerSchemaFromDTO(dtoClass: any): any {
  const className = dtoClass.name;
  const schemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
  });

  return schemas[className] || null;
}
