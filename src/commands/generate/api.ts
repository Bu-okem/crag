import { defineCommand } from "citty";
import { createClient } from '@hey-api/openapi-ts';
import yaml from 'js-yaml';

const postmanToOpenApi = require('postman-to-openapi')

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
            const openApiSpecObject = yaml.load(openApiSpecString) as {};

            createClient({
                input: openApiSpecObject,
                output: 'src/client',
            });

            // console.log(JSON.stringify(endPoints, null, 2))
            // console.log(JSON.stringify(fetchers));
        } catch (err) {
            console.log(err)
        }
    }
})