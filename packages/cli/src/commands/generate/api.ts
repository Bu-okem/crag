import { defineCommand } from "citty";
import { Match, pipe, Schema } from "effect";
import { createClient } from '@hey-api/openapi-ts';
import postmanToOpenApi from 'postman-to-openapi';
import { config, configFile } from "~/config";
import { type InputEntry, input } from "~/schema";
import { rootLogger } from "~/logger";

export default defineCommand({
  meta: {
    name: "api",
    description: "Generate fetchers and hooks from Postman collection"
  },
  args: {
    path: {
      type: 'string',
      description: 'API Spec location',
      required: false
    },
    destination: {
      type: 'string',
      description: 'Output directory',
      required: false
    },
    'client-only': {
      type: 'boolean',
      description: 'Generate only TypeScript client (no hooks)',
      default: false
    },
    'hooks-only': {
      type: 'boolean',
      description: 'Generate only React Query hooks (no client)',
      default: false
    }
  },
  async setup({ args }) {
    rootLogger.debug("$$", config);
    const inputs = config.input;

    for (const input_entry of inputs) {
      const input_parsed = InputImpl.normalize(input_entry);
      const output_dir = args.destination ?? config.output;

      try {
        const p_input = input_parsed.type === "postman" ?
          await postmanToOpenAPISpecs(input_parsed.path)
          : input_parsed.path;

        // Determine what to generate
        const generateClient = !args['hooks-only'];
        const generateHooks = !args['client-only'];

        const plugins = [];
        
        if (generateClient) {
          plugins.push('@hey-api/typescript');
        }

        if (generateHooks) {
          plugins.push('@tanstack/react-query');
        }

        await createClient({
          input: p_input,
          output: output_dir,
          plugins: generateHooks ? ['@hey-api/typescript', '@tanstack/react-query', '@hey-api/sdk'] : ['@hey-api/typescript', '@hey-api/sdk'],
          configFile: configFile
        });

        if (generateClient && generateHooks) {
          rootLogger.success("🎉 Generated API client and React hooks");
        } else if (generateClient) {
          rootLogger.success("🎉 Generated API client");
        } else {
          rootLogger.success("🎉 Generated React hooks");
        }

      } catch (err) {
        console.log(err);
      }
    }
  }
});

async function postmanToOpenAPISpecs(path_to_collection: string) {
  try {
    // @ts-expect-error
    return await postmanToOpenApi(path_to_collection, null, { defaultTag: 'General' });
  } catch (error) {
    throw new Error("Error generating OpenAPI spec from Postman Collection", { cause: error });
  }
}

const InputImpl = {
  normalize(input_entry: InputEntry) {
    const encode = Schema.encodeSync(input);

    return pipe(
      Match.value(input_entry),
      Match.when(Match.string, (path) => {
        return encode({
          type: "openapi",
          path: path
        })
      }),
      Match.orElse((e) => encode(e)),
    )
  },
}