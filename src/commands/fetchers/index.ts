import { defineCommand } from "citty";

const fetchers = defineCommand({
    meta: {
        name: "fetchers",
        description: "Generate fetchers from Postman collection"
    },
})