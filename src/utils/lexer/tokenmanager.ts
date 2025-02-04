import Token from './token';

/**
 * 代表一个令牌管理器的类。
 * Class representing a token manager.
 */
class TokenManager {
    private token: Token;

    /**
     * 类构造函数。
     * Class constructor.
     */
    constructor() {
        this.token = new Token();
    }

    /**
     * 获取当前令牌。
     * Get the current token.
     * @returns {Token} 当前令牌。The current token.
     */
    public get nowToken(): Token {
        return this.token;
    }

    /**
     * 设置当前令牌。
     * Set the current token.
     * @param {Token} token - 新的令牌。The new token.
     */
    public set nowToken(token: Token) {
        this.token = token;
    }
}

export default TokenManager;
