import type Variable from './variable-class';
import ASTNodeKind from '../enums/astnodekind-enum';
import type TypeDefinition from './typedef-class';
import type Member from './member-class';

/**
 * 抽象语法树节点选项接口。
 * Abstract syntax tree node options interface.
 * @interface
 * @property {ASTNodeKind} nodeKind - 节点类型。Node kind.
 * @property {ASTNode} nextNode - 下一个节点。Next node.
 * @property {ASTNode} leftNode - 左节点。Left node.
 * @property {ASTNode} rightNode - 右节点。Right node.
 * @property {Variable} localVar - 局部变量。Local variable.
 * @property {number} numberValue - 数字值。Number value.
 * @property {ASTNode} blockBody - 语句块体。Block body.
 * @property {ASTNode} condition - 条件。Condition.
 * @property {ASTNode} trueBody - 真体。True body.
 * @property {ASTNode} elseBody - 否体。Else body.
 * @property {ASTNode} initBody - 初始化体。Init body.
 * @property {ASTNode} incrementBody - 增量体。Increment body.
 * @property {TypeDefinition} typeDef - 类型定义。Type definition.
 * @property {string} functionDef - 函数定义。Function definition.
 * @property {ASTNode} functionArgs - 函数参数。Function arguments.
 * @property {number} nodeNumber - 结点编号。Node number.
 * @property {Member} members - 成员。Member.
 */
export interface ASTNodeOptions {
    nodeKind?: ASTNodeKind;
    nextNode?: ASTNode;
    leftNode?: ASTNode;
    rightNode?: ASTNode;
    localVar?: Variable;
    numberValue?: number;
    blockBody?: ASTNode;
    condition?: ASTNode;
    trueBody?: ASTNode;
    elseBody?: ASTNode;
    initBody?: ASTNode;
    incrementBody?: ASTNode;
    typeDef?: TypeDefinition;
    functionDef?: string;
    functionArgs?: ASTNode;
    nodeNumber?: number;
    members?: Member;
}

/**
 * 代表一个抽象语法树节点的类。
 * AST node class.
 */
class ASTNode {
    /** 节点类型。Node kind. */
    nodeKind: ASTNodeKind = ASTNodeKind.Addition;
    /** 下一个节点。Next node. */
    nextNode?: ASTNode;
    /** 左节点。Left node. */
    leftNode?: ASTNode;
    /** 右节点。Right node. */
    rightNode?: ASTNode;
    /** 局部变量。Local variable. */
    localVar?: Variable;
    /** 数字值。Number value. */
    numberValue?: number;
    /** 语句块体。Block body. */
    blockBody?: ASTNode;
    /** 条件。Condition. */
    condition?: ASTNode;
    /** 真体。True body. */
    trueBody?: ASTNode;
    /** 否体。Else body. */
    elseBody?: ASTNode;
    /** 初始化体。Init body. */
    initBody?: ASTNode;
    /** 增量体。Increment body. */
    incrementBody?: ASTNode;
    /** 类型定义。Type definition. */
    typeDef?: TypeDefinition;
    /** 函数定义。Function definition. */
    functionDef?: string;
    /** 函数参数。Function arguments. */
    functionArgs?: ASTNode;
    /** 结点编号。Node number. */
    nodeNumber = 0;
    /** 成员。 Member */
    members?: Member;

    /**
     * 类构造函数。
     * Class constructor
     * @param {ASTNodeOptions} options - 节点选项。Node options.
     */
    constructor(options: ASTNodeOptions) {
        this.nodeKind = options.nodeKind ?? ASTNodeKind.Addition;
        this.nextNode = options.nextNode;
        this.leftNode = options.leftNode;
        this.rightNode = options.rightNode;
        this.localVar = options.localVar;
        this.numberValue = options.numberValue;
        this.blockBody = options.blockBody;
        this.condition = options.condition;
        this.trueBody = options.trueBody;
        this.elseBody = options.elseBody;
        this.initBody = options.initBody;
        this.incrementBody = options.incrementBody;
        this.typeDef = options.typeDef;
        this.functionDef = options.functionDef;
        this.functionArgs = options.functionArgs;
        this.nodeNumber = options.nodeNumber ?? 0;
        this.members = options.members;
    }
}

export default ASTNode;
