const aws = require('aws-sdk');
const status = require('http-status');
const UUIDv4 = require('uuid/v4');
const Joi = require('@hapi/joi');

aws.config.update({ region: 'us-east-2' });
const ddb = new aws.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const TABLE_NAME = process.env.TABLE_NAME;

const openHouseSchema = Joi.object({
    name: Joi.string().required(),
    date: Joi.number().integer().positive().required(),
    info: Joi.string().required(),
    visible: Joi.boolean().required()
});

exports.handler = async (event, context) => {
    try {
        switch (event.httpMethod) {
            case 'GET':
                return getOpenHouses();

            case 'POST':
                return createOpenHouse(JSON.parse(event.body));

            case 'PUT':
                if (!event.pathParameters || !event.pathParameters.uuid) {
                    return {
                        statusCode: status.BAD_REQUEST,
                        body: JSON.stringify({
                            error: 'Missing UUID in URL path'
                        })
                    }
                }
                return updateOpenHouse(event.pathParameters.uuid, JSON.parse(event.body));

            case 'DELETE':
                if (!event.pathParameters || !event.pathParameters.uuid) {
                    return {
                        statusCode: status.BAD_REQUEST,
                        body: JSON.stringify({
                            error: 'Missing UUID in URL path'
                        })
                    }
                }
                return deleteOpenHouse(event.pathParameters.uuid);

            default:
                return { statusCode: status.METHOD_NOT_ALLOWED };
        }
    } catch (err) {
        console.err(err);
        return err;
    }
};

async function getOpenHouses() {
    try {
        const data = await ddb.scan({ TableName: TABLE_NAME }).promise();

        return {
            statusCode: status.OK,
            body: JSON.stringify({
                openHouses: data.Items
            })
        };
    } catch (err) {
        console.error(err);
        return err;
    }
}

async function createOpenHouse(body) {
    try {
        const { value: openHouse, error } = openHouseSchema.validate(body);
        if (error) {
            return {
                statusCode: status.BAD_REQUEST,
                body: JSON.stringify({
                    error: error.details.map((error) => error.message).join('; ')
                })
            }
        }

        await ddb.put({
            TableName: TABLE_NAME,
            Item: {
                UUID: UUIDv4(),
                ...openHouse
            }
        }).promise();

        return { statusCode: status.CREATED };
    } catch (err) {
        console.error(err);
        return err;
    }
}

async function updateOpenHouse(uuid, body) {
    try {
        // Check to ensure uuid exists first
        const existingData = await ddb.get({
            TableName: TABLE_NAME,
            Key: { UUID: uuid }
        }).promise();
        if (!existingData.Item) {
            return {
                statusCode: status.NOT_FOUND,
                body: JSON.stringify({
                    error: 'Open House does not exist'
                })
            }
        }

        const { value: openHouse, error } = openHouseSchema.validate(body);
        if (error) {
            return {
                statusCode: status.BAD_REQUEST,
                body: JSON.stringify({
                    error: error.details.map((detail) => detail.message).join('; ')
                })
            }
        }

        // Save new building item
        await ddb.put({
            TableName: TABLE_NAME,
            Item: {
                UUID: uuid,
                ...openHouse
            }
        }).promise();

        return { statusCode: status.OK };
    } catch (err) {
        console.error(err);
        return err;
    }
}

async function deleteOpenHouse(uuid) {
    try {
        await ddb.delete({
            TableName: TABLE_NAME,
            Key: { UUID: uuid }
        }).promise();

        return { statusCode: status.OK };
    } catch (err) {
        console.error(err);
        return err;
    }
}
