import { defineCommand } from "citty";
import SwaggerParser from "@apidevtools/swagger-parser";
import yaml from 'js-yaml';
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

const postmanToOpenApi = require('postman-to-openapi')

// type operation = string | OpenAPIV2.Parameters | (OpenAPIV3.ParameterObject | OpenAPIV3_1.ReferenceObject)[] | (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined;

interface endPoint {
    path: string,
    method: string,
    summary: string,
    parameters: object | null,
    requestBody: object,
    responses: object,
    tags: string[]
}

const fetcher_generator = function(endpoint: endPoint) {
    switch(endpoint.method) {
        case 'GET':
            return `export const get_${endpoint.path.replace(/\//g, '_').replace(/-/g, '_')} = async () => {
                const response = await fetch(\`${endpoint.path}\`, {
                    method: '${endpoint.method}',
                });
                const data = await response.json();
                return data;
            }`;
        case 'POST':
            return `export const post_${endpoint.path.replace(/\//g, '_').replace(/-/g, '_')} = async (body) => {
                const response = await fetch(\`${endpoint.path}\`, {
                    method: '${endpoint.method}',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                return data;
            }`;
        case 'PUT':
        case 'PATCH':
            return `export const put_${endpoint.path.replace(/\//g, '_').replace(/-/g, '_')} = async (body) => {
                const response = await fetch(\`${endpoint.path}\`, {
                    method: '${endpoint.method}',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                const data = await response.json();
                return data;
            }`;
        case 'DELETE':
            return `export const delete_${endpoint.path.replace(/\//g, '_').replace(/-/g, '_')} = async () => {
                const response = await fetch(\`${endpoint.path}\`, {
                    method: '${endpoint.method}',
                });
                const data = await response.json();
                return data;
            }`
        default: 
            return '';
    }
}

const deleteData = async (url: string) => {
    const response = await fetch(url, {
        method: 'DELETE'
    });
    const data = await response.json();
    return data;
}

const getData = async (url: string) => {
    const response = await fetch(url, {
        method: 'GET'
    });
    const data = await response.json();
    return data;
}

const putData = async (url: string, data: object) => {
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
}





export default defineCommand({
    meta: {
        name: "api",
        description: "Generate fetchers and hooks from Postman collection"
    },
    args: {
        path: {
          type: 'string',
          description: 'Api location',
          required: true
        },
        destination: {
            type: 'string',
            description: 'OpenAPI location',
            required: true
        }
    },
    async run({ args }) {
        const postmanCollection = args.path;
        const outputFile = args.destination;

        try {
            // Save the result in a file
            // const result = await postmanToOpenApi(postmanCollection, outputFile, { defaultTag: 'General' })
            
            const openApiSpecString = await postmanToOpenApi(postmanCollection, null, { defaultTag: 'General' });
            const openApiSpecObject = yaml.load(openApiSpecString) as OpenAPIV3.Document;
           
            let api = await SwaggerParser.validate(openApiSpecObject);

            let endPoints: endPoint[] = [];

            for (const path in api.paths) {
                const pathItem = api.paths[path];
                if (!pathItem) continue;

                for (const method in pathItem) {
                    const validMethods = ['get', 'post', 'put', 'delete', 'patch'];
                    if (validMethods.includes(method)) {
                        const operation: any = pathItem[method as keyof typeof pathItem];
                        
                        if (!operation || typeof operation !== 'object') continue;

                        endPoints.push({
                            path: path,
                            method: method.toUpperCase(),
                            summary: operation.summary,
                            parameters: operation.parameters?.map((p: any) => ({
                                name: p.name,
                                in: p.in,
                                schema: p.schema,
                                example: p.example
                            })) ?? null,
                            requestBody: operation.requestBody,
                            responses: operation.responses,
                            tags: operation.tags
                        });
                    }
                }
            }

            let fetchers: string[] = [];

            for (const endPoint of endPoints) {
                let func = fetcher_generator(endPoint as unknown as endPoint)
               fetchers.push(func)
            }

            const fs = require('fs')
            fs.writeFileSync(outputFile, `${fetchers.join(';\n\n')}`);


            // console.log(JSON.stringify(endPoints, null, 2))
            // console.log(JSON.stringify(fetchers));
        } catch (err) {
            console.log(err)
        }
    }
})