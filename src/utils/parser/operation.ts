/**
 * 类型定义的大小到 Store 操作的映射。
 * A mapping from the size of a type definition to store operation.
 * @type {Record<number | 'default', string>}
 */
export const sizeToStoreOperation: Record<number | 'default', string> = {
    1: 'mov %al, (%rdi)',
    2: 'mov %ax, (%rdi)',
    4: 'mov %eax, (%rdi)',
    default: 'mov %rax, (%rdi)',
};

/**
 * 类型定义的大小到 Load 操作的映射。
 * A mapping from the size of a type definition to load operation.
 * @type {Record<number | 'default', string>}
 */
export const sizeToLoadOperation: Record<number | 'default', string> = {
    1: 'movsbq (%rax), %rax',
    2: 'movswq (%rax), %rax',
    4: 'movsxd (%rax), %rax',
    default: 'mov (%rax), %rax',
};
