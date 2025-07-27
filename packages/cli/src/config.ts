import { loadConfig } from "c12";
import type { ConfigOption } from "~/schema";

export const { config, configFile, layers } = await loadConfig<ConfigOption>({
  name: "crag"
});
