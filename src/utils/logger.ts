import { logger, consoleTransport } from 'react-native-logs';

/**
 * 日志级别类型，包括 'error'、'warn'、'info'、'debug' 和 'trace'。
 *
 * Log level type, including 'error', 'warn', 'info', 'debug', and 'trace'.
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

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

/**
 * 记录一条消息。
 * @param {LogLevel} level 日志级别。The log level.
 * @param {string} message 要记录的消息。The message to log.
 * @param {object} context 上下文对象。The context object.
 * @param {Error | undefined} error 可选的错误对象。An optional error object.
 * @param {string} namespace 日志的命名空间。The namespace for the log.
 */
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

/**
 * 启用指定命名空间的日志记录。enable logging for the specified namespace.
 * @param {string} namespace 要启用的日志的命名空间。 The namespace for the log to enable.
 * @returns {void} 无返回值。No return value.
 */
export function enableLogger(namespace: string): void {
    log.enable(namespace);
}

/**
 * 禁用指定命名空间的日志记录。disable logging for the specified namespace.
 * @param {string} namespace 要禁用的日志的命名空间。The namespace for the log to disable.
 */
export function disableLogger(namespace: string): void {
    log.disable(namespace);
}
