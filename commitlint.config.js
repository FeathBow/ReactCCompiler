// eslint-disable-next-line unicorn/prefer-module
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-case': [2, 'always', ['lower-case', 'upper-case']],
        'type-enum': [
            2,
            'always',
            ['build', 'ci', 'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert'],
        ],
    },
};
