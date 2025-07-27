import { createConsola, LogLevels } from 'consola';
import { config } from './config';
import { isDevelopment } from 'std-env';

export const rootLogger = createConsola({
  level: isDevelopment ? LogLevels.debug : config.verbose ? LogLevels.trace : LogLevels.info,
});
