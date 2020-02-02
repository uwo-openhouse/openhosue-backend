const {
    OPEN_HOUSES_TABLE,
    OPEN_HOUSE_ATTENDEES_TABLE,
    ENDPOINT_OVERRIDE
} = process.env;

const aws = require('aws-sdk');
aws.config.update({ region: 'us-east-2' });

let ddb;
if (ENDPOINT_OVERRIDE) {
    ddb = new aws.DynamoDB.DocumentClient({
        endpoint: ENDPOINT_OVERRIDE,
        apiVersion: '2012-08-10',
        maxRetries: 1
    });
} else {
    ddb = new aws.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
}

// Use dependency injection to allow for easier unit testing
module.exports.handler = require('./handler.js')({
    dynamo: {
        scanOpenHouses: () => ddb.scan({ TableName: OPEN_HOUSES_TABLE }).promise(),
        putOpenHouse: (item) => ddb.put({ TableName: OPEN_HOUSES_TABLE, Item: item }).promise(),
        getOpenHouse: (uuid) => ddb.get({ TableName: OPEN_HOUSES_TABLE, Key: { uuid }}).promise(),
        deleteOpenHouse: (uuid) => ddb.delete({ TableName: OPEN_HOUSES_TABLE, Key: { uuid }}).promise(),

        getOpenHouseAttendees: (uuid) => ddb.get({ TableName: OPEN_HOUSE_ATTENDEES_TABLE, Key: { uuid }}).promise(),
        putOpenHouseAttendees: (item) => ddb.put({ TableName: OPEN_HOUSE_ATTENDEES_TABLE, Item: item }).promise(),
        deleteOpenHouseAttendees: (uuid) => ddb.delete({ TableName: OPEN_HOUSE_ATTENDEES_TABLE, Key: { uuid }}).promise(),
    }
});