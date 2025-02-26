/**
 * @swagger
 * components:
 *   securitySchemes:
 *     authentication:
 *       type: apiKeyModel
 *       in: header
 *       name: Authorization
 *       description: Authentication token
 *   parameters:
 *     limit:
 *       in: query
 *       name: limit
 *       schema:
 *          type: integer
 *          minimum: 0
 *          maximum: 100
 *          default: 10
 *       example: 5
 *       description: Limit of rows. Should be positive and lower or equal to 100
 *     offset:
 *       in: query
 *       name: offset
 *       schema:
 *          type: integer
 *          minimum: 0
 *          default: 10
 *       example: 0
 *       description: Offset of rows. Should be positive. Default = 0
 *     search:
 *       in: query
 *       name: search
 *       schema:
 *          type: string
 *       example: search
 *       description: Search. Should be string
 *     withGroup:
 *       in: query
 *       name: withGroup
 *       schema:
 *          type: string
 *       example: true
 *       description: Filter devices that do not belong to any group
 *     variantId:
 *       in: query
 *       name: variantId
 *       schema:
 *          type: string
 *          format: uuid
 *       description: Filter devices by variantId
 * security:
 *       - authentication: []

 */
