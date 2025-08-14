import { defineCommand } from "citty";

export default defineCommand({
    meta: {
        name: 'generate',
        description: 'Generate command'
    },
    subCommands: {
        api: () => import("./api").then(m => m.default),
      }
})