import { defineCommand } from "citty";
import SwaggerParser from "@apidevtools/swagger-parser";
import yaml from 'js-yaml';
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

const postmanToOpenApi = require('postman-to-openapi')

// type operation = string | OpenAPIV2.Parameters | (OpenAPIV3.ParameterObject | OpenAPIV3_1.ReferenceObject)[] | (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined;



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

            let endPoints: any[] = [];

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

            console.log(JSON.stringify(endPoints, null, 2))
        } catch (err) {
            console.log(err)
        }
    }
})