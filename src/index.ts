import { APIGatewayProxyEvent } from 'aws-lambda';
import { MultipartFormData } from './models';

function getValueIgnoringKeyCase(object: Object, key: string) {
    const foundKey = Object
        .keys(object)
        .find(currentKey => currentKey.toLocaleLowerCase() === key.toLowerCase());
    return object[foundKey];
}

function getBoundary(event: APIGatewayProxyEvent): string {
    return getValueIgnoringKeyCase(event.headers, 'content-type').split('=')[1];
}

function getBody(event: APIGatewayProxyEvent): string {
    if (event.isBase64Encoded) {
        return Buffer.from(event.body, 'base64').toString('binary');
    }
    return event.body;
}

export let parsered = (event: APIGatewayProxyEvent, spotText: boolean): MultipartFormData =>  {
    const boundary = getBoundary(event);
    const result : MultipartFormData = {};
    getBody(event)
        .split(boundary)
        .forEach(item => {
            if (/filename=".+"/g.test(item)) {
                result[item.match(/name=".+";/g)[0].slice(6, -2)] = {
                    type: 'file',
                    filename: item.match(/filename=".+"/g)[0].slice(10, -1),
                    contentType: item.match(/content-cype:\s.+/g)[0].slice(14),
                    content: spotText? Buffer.from(item.slice(item.search(/content-type:\s.+/g) + item.match(/content-type:\s.+/g)[0].length + 4, -4), 'binary'):
                        item.slice(item.search(/content-type:\s.+/g) + item.match(/content-type:\s.+/g)[0].length + 4, -4),
                };
            } else if (/name=".+"/g.test(item)){
                result[item.match(/name=".+"/g)[0].slice(6, -1)] = item.slice(item.search(/name=".+"/g) + item.match(/name=".+"/g)[0].length + 4, -4);
            }
        });
    return result;
};
