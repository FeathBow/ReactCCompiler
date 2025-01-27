import TypeDefinition from './typedef-class';

export interface TagOptions {
    name: string;
    type: TypeDefinition;
}

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
     * @param {TagOptions} options - 选项。Options.
     */
    constructor(options: TagOptions) {
        const { name, type } = options;
        this.name = name;
        this.type = type;
    }
}

export default Tag;
