import { defineCommand } from "citty";
import {consola} from "consola";

export default defineCommand({
    meta: {
        name: "api",
        description: "Generate fetchers and hooks from Postman collection"
    },
    args: {
        link: {
          type: 'string',
          description: 'Api link',
          required: true
        },
    },
    run({ args }) {
        consola.success(`API: ${args.link}`)
    }
})