var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/config.ts
import { loadConfig } from "c12";
var config, configFile, layers;
var init_config = __esm({
  async "src/config.ts"() {
    "use strict";
    ({ config, configFile, layers } = await loadConfig({
      name: "crag"
    }));
  }
});

// src/schema.ts
import { Schema } from "effect";
var StringFromPath, input, inputEntry, configOptions;
var init_schema = __esm({
  "src/schema.ts"() {
    "use strict";
    StringFromPath = Schema.transform(
      Schema.NonEmptyTrimmedString,
      Schema.NonEmptyTrimmedString,
      {
        strict: true,
        encode: (v) => {
          function validatePath(path) {
            console.log(">>> ", path);
            if (path.startsWith("/")) {
              throw new Error(`Please use a relative path: Path(${path})`);
            }
            if (path.startsWith("./")) return path;
            if (path.startsWith("https://") || path.startsWith("http://")) return path;
            throw new Error(`Invalid Input Path(${path}) not found`);
          }
          return validatePath(v);
        },
        decode: (v) => v
      }
    ).pipe(
      Schema.annotations({
        description: "A string representing a path to a file or URL",
        examples: ["./path/to/file", "https://example.com/file"]
      })
    );
    input = Schema.Struct({
      path: StringFromPath,
      type: Schema.Literal("postman", "openapi").pipe(
        Schema.annotations({
          description: "The source input type",
          examples: ["postman", "openapi"]
        })
      )
    });
    inputEntry = Schema.Union(
      input,
      StringFromPath
    );
    configOptions = Schema.Struct({
      input: Schema.typeSchema(inputEntry).pipe(Schema.NonEmptyArray),
      output: Schema.NonEmptyString,
      verbose: Schema.Boolean.pipe(
        Schema.annotations({
          description: "Enable verbose logging",
          examples: [true, false]
        })
      )
    });
  }
});

// src/logger.ts
import { createConsola, LogLevels } from "consola";
import { isDevelopment } from "std-env";
var rootLogger;
var init_logger = __esm({
  async "src/logger.ts"() {
    "use strict";
    await init_config();
    rootLogger = createConsola({
      level: isDevelopment ? LogLevels.debug : config.verbose ? LogLevels.trace : LogLevels.info
    });
  }
});

// src/commands/generate/api.ts
var api_exports = {};
__export(api_exports, {
  default: () => api_default
});
import { defineCommand } from "citty";
import { Match, pipe, Schema as Schema2 } from "effect";
import { createClient } from "@hey-api/openapi-ts";
import postmanToOpenApi from "postman-to-openapi";
async function postmanToOpenAPISpecs(path_to_collection) {
  try {
    return await postmanToOpenApi(path_to_collection, null, { defaultTag: "General" });
  } catch (error) {
    throw new Error("Error generating OpenAPI spec from Postman Collection", { cause: error });
  }
}
var api_default, InputImpl;
var init_api = __esm({
  async "src/commands/generate/api.ts"() {
    "use strict";
    await init_config();
    init_schema();
    await init_logger();
    api_default = defineCommand({
      meta: {
        name: "api",
        description: "Generate fetchers and hooks from Postman collection"
      },
      args: {
        path: {
          type: "string",
          description: "API Spec location",
          required: false
        },
        destination: {
          type: "string",
          description: "OpenAPI location",
          required: false
        }
      },
      async setup({ args }) {
        rootLogger.debug("$$", config);
        const inputs = config.input;
        for (const input_entry of inputs) {
          const input_parsed = InputImpl.normalize(input_entry);
          const output_dir = args.destination ?? config.output;
          try {
            const p_input = input_parsed.type === "postman" ? await postmanToOpenAPISpecs(input_parsed.path) : input_parsed.path;
            await createClient({
              input: p_input,
              output: output_dir,
              configFile
            });
            rootLogger.success("\u{1F389} Generated API client");
          } catch (err) {
            console.log(err);
          }
        }
      }
    });
    InputImpl = {
      normalize(input_entry) {
        const encode = Schema2.encodeSync(input);
        return pipe(
          Match.value(input_entry),
          Match.when(Match.string, (path) => {
            return encode({
              type: "openapi",
              path
            });
          }),
          Match.orElse((e) => encode(e))
        );
      }
    };
  }
});

// src/commands/generate/index.ts
var generate_exports = {};
__export(generate_exports, {
  default: () => generate_default
});
import { defineCommand as defineCommand2 } from "citty";
var generate_default;
var init_generate = __esm({
  "src/commands/generate/index.ts"() {
    "use strict";
    generate_default = defineCommand2({
      meta: {
        name: "generate",
        description: "Generate command"
      },
      subCommands: {
        api: () => init_api().then(() => api_exports).then((m) => m.default)
      }
    });
  }
});

// src/cli.ts
import { defineCommand as defineCommand3, runMain } from "citty";
var main = defineCommand3({
  meta: {
    name: "crag",
    version: "1.0.0",
    description: "Generate API fetchers and React hooks from Postman collections"
  },
  subCommands: {
    generate: () => Promise.resolve().then(() => (init_generate(), generate_exports)).then((m) => m.default)
  }
});
runMain(main);
//# sourceMappingURL=crag.js.map