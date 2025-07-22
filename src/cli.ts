import { defineCommand, runMain } from 'citty'

const main = defineCommand({
  meta: {
    name: 'crag',
    version: '1.0.0',
    description: 'Generate API fetchers and React hooks from Postman collections'
  },
  subCommands: {
    generate: () => import("./commands/generate").then(m => m.default),
  },
})

runMain(main)