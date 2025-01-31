import Token from './token-class';

/**
 * 代表一个令牌管理器的类。
 * Class representing a token manager.
 */
class TokenManager {
    private static instance: TokenManager;
    private token: Token;
    constructor() {
        this.token = new Token();
    }

    /**
     * 获取 TokenManager 的单例实例
     * Get the singleton instance of TokenManager
     * @returns {Token} TokenManager 的单例实例。The singleton instance of TokenManager.
     * @static
     */
    public static getInstance(): TokenManager {
        if (TokenManager.instance === undefined) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    /**
     * 重置 TokenManager 的单例实例
     * Reset the singleton instance of TokenManager
     * @returns {void}
     * @static
     */
    public static resetInstance(): void {
        TokenManager.instance = new TokenManager();
        TokenManager.instance.token = new Token();
    }

    /**
     * 获取当前的令牌
     * Get the current token
     * @returns {Token} 当前的令牌。The current token.
     */
    public get nowToken(): Token {
        return this.token;
    }

    /**
     * 设置当前的令牌
     * Set the current token
     * @param {Token} token - 要设置的令牌。The token to set.
     * @returns {void}
     */
    public set nowToken(token: Token) {
        this.token = token;
    }
}

export default TokenManager;
