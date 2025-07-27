import { Schema } from "effect"

export type ConfigOption = Schema.Schema.Type<typeof configOptions>;
export type InputEntry = Schema.Schema.Type<typeof inputEntry>;

export const StringFromPath = Schema.transform(
  Schema.NonEmptyTrimmedString,
  Schema.NonEmptyTrimmedString, {
  strict: true,
  encode: (v) => {
    function validatePath(path: string) {
      console.log(">>> ", path);

      if (path.startsWith('/')) {
        throw new Error(`Please use a relative path: Path(${path})`);
      }

      if (path.startsWith('./')) return path;
      if (path.startsWith('https://') || path.startsWith('http://')) return path;

      // Ensure the file exists
      throw new Error(`Invalid Input Path(${path}) not found`);
    }

    return validatePath(v);
  },
  decode: (v) => v
}).pipe(
  Schema.annotations({
    description: "A string representing a path to a file or URL",
    examples: ["./path/to/file", "https://example.com/file"]
  })
)

export const input = Schema.Struct({
  path: StringFromPath,
  type: Schema.Literal("postman", "openapi").pipe(
    Schema.annotations({
      description: "The source input type",
      examples: ["postman", "openapi"]
    })
  )
});

export const inputEntry = Schema.Union(
  input,
  StringFromPath
)

export const configOptions = Schema.Struct({
  input: Schema.typeSchema(inputEntry).pipe(Schema.NonEmptyArray),
  output: Schema.NonEmptyString,
  verbose: Schema.Boolean.pipe(
    Schema.annotations({
      description: "Enable verbose logging",
      examples: [true, false]
    })
  )
});
