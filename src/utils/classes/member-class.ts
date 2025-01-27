import Token from './token-class';
import TypeDefinition from './typedef-class';

/**
 * 成员选项接口。
 * Member options interface.
 * @interface
 * @property {Token} token - 词法单元。Lexical unit.
 * @property {TypeDefinition} type - 类型。Type.
 * @property {Member} nextMember - 下一个成员。Next member.
 * @property {number} offset - 偏移量。Offset.
 */
export interface MemberOptions {
    token?: Token;
    type?: TypeDefinition;
    nextMember?: Member;
    offset?: number;
}

/**
 * 代表一个类或结构体的成员
 * Represents a member of a class or struct
 */
class Member {
    /** 下一个成员。next member */
    nextMember?: Member;
    /** 成员的类型。The type of the member */
    type?: TypeDefinition;
    /** 成员的词法单元。The lexical unit of the member */
    token?: Token;
    /** 偏移量。offset */
    offset = 0;

    /**
     * 类构造函数。
     * Class constructor
     * @param {TypeDefinition} type - 成员的类型。The type of the member.
     * @param {Token} token - 成员的词法单元。The lexical unit of the member.
     * @param {Member} nextMember - 下一个成员。Next member.
     * @param {number} offset - 偏移量。offset.
     * @returns {Member} 类实例（Class instance）。
     * @class
     */
    constructor(options: MemberOptions = {}) {
        this.type = options.type;
        this.token = options.token;
        this.nextMember = options.nextMember;
        this.offset = options.offset ?? 0;
    }

    /**
     * 深拷贝。
     * Deep copy.
     * @returns {Member} 深拷贝后的成员。Deep copy of the member.
     */
    deepCopy(): Member {
        return new Member({
            type: this.type === undefined ? undefined : this.type.deepCopy(),
            token: this.token === undefined ? undefined : { ...this.token },
            nextMember: this.nextMember === undefined ? undefined : this.nextMember.deepCopy(),
            offset: this.offset,
        });
    }
}

export default Member;
