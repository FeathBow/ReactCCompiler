import { logger, consoleTransport } from 'react-native-logs';

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

const logLevels: { [key in LogLevel]: number } = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    trace: 4,
};

const config = {
    severity: 'debug',
    levels: logLevels,
    transport: consoleTransport,
    transportOptions: {
        colors: {
            debug: 'blueBright',
            info: 'greenBright',
            warn: 'yellowBright',
            error: 'redBright',
            trace: 'whiteBright',
        },
    },
    async: true,
    dateFormat: 'time',
    printLevel: true,
    printDate: true,
    fixedExtLvlLength: false,
    enabled: true,
};

const log = logger.createLogger(config);

export function logMessage(
    level: LogLevel,
    message: string,
    context: object = {},
    error: Error | undefined = undefined,
    namespace: string = 'Logs',
): void {
    const stack = level === 'error' && (error === undefined ? new Error('Stack trace').stack : error.stack);
    const contextString = JSON.stringify(context);
    const namespacedLog = log.extend(namespace);
    const now = new Date();
    const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    namespacedLog[level](`[${timestamp}] ${message}\n${contextString}${stack === false ? '' : `\n${stack}`}`);
}

export function enableLogger(namespace: string): void {
    log.enable(namespace);
}

export function disableLogger(namespace: string): void {
    log.disable(namespace);
}
