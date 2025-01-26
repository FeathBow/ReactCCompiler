import Token from './token-class';
import TypeDefinition from './typedef-class';

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
    constructor(type?: TypeDefinition, token?: Token, nextMember?: Member, offset = 0) {
        this.type = type;
        this.token = token;
        this.nextMember = nextMember;
        this.offset = offset;
    }

    /**
     * 深拷贝。
     * Deep copy.
     * @returns {Member} 深拷贝后的成员。Deep copy of the member.
     */
    deepCopy(): Member {
        return new Member(
            this.type === undefined ? undefined : this.type.deepCopy(),
            this.token === undefined ? undefined : { ...this.token },
            this.nextMember === undefined ? undefined : this.nextMember.deepCopy(),
            this.offset,
        );
    }
}

export default Member;
