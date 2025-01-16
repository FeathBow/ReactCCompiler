import type Variable from './localvariable-class';
import { ASTNodeKind } from '../commons';
import type TypeDefinition from './typedef-class';

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
}

export default ASTNode;
