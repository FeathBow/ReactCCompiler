import TypeDefinition from './typedef-class';

/**
 * 代表一个 tag 的类。可用于结构体和联合体等的定义。
 * Class representing a tag. Can be used for struct and union.
 */
class Tag {
    /** 名字。Name. */
    name: string;
    /** 类型。Type. */
    type: TypeDefinition;

    /**
     * 类构造函数。
     * Class constructor
     * @param {string} name - 名字。Name.
     * @param {TypeDefinition} type - 类型。Type.
     */
    constructor(name: string, type: TypeDefinition) {
        this.name = name;
        this.type = type;
    }
}

export default Tag;
