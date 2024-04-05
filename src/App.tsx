import React, { useState } from 'react';
import { tokenize } from './utils/token';
import { parse } from './utils/parse';
import { generateCode, getGenerated } from './utils/generate';
import { logMessage } from './utils/logger';

/**
 * App 组件，用于处理用户输入的代码，生成和显示输出。
 * The App component, used to handle user input code, generate and display output.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function App(): JSX.Element {
    const [code, setCode] = useState('');
    const [output, setOutput] = useState<string[]>([]);
    const [quadruple, setQuadruple] = useState('');
    const handleSubmit = (event: React.FormEvent): void => {
        event.preventDefault();

        const tokens = tokenize(code);
        logMessage('info', 'Tokens', { tokens: JSON.stringify(tokens) });
        const { functionNode, quadrupleOutput } = parse(tokens);
        logMessage('info', 'AST', { program: JSON.stringify(functionNode) });
        // Traverse the AST to emit assembly.
        generateCode(functionNode);
        setOutput(getGenerated());
        setQuadruple(quadrupleOutput);
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <textarea
                    aria-label='Code Input'
                    value={code}
                    onChange={(event) => {
                        setCode(event.target.value);
                    }}
                />
                <button type='submit'>Submit</button>
            </form>
            <OutputComponent output={output} />
            <QuadrupleOutputComponent quadrupleOutput={quadruple} />
        </div>
    );
}

interface OutputProperties {
    readonly output: string[];
}
/**
 * OutputComponent 组件，用于显示输出的结果。
 * The OutputComponent, used to display the output results.
 * @param {OutputProperties} output - 需要显示的输出结果。The output results to display.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function OutputComponent({ output }: OutputProperties): JSX.Element {
    return (
        <div>
            {output.map((line) => (
                <p key={line}>{line}</p>
            ))}
        </div>
    );
}

interface QuadrupleOutputProperties {
    readonly quadrupleOutput: string;
}

/**
 * QuadrupleOutputComponent 组件，用于显示四元式输出。
 * The QuadrupleOutputComponent, used to display the quadruple output.
 * @param {QuadrupleOutputProperties} quadrupleOutput - 需要显示的四元式输出。The quadruple output to display.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function QuadrupleOutputComponent({ quadrupleOutput }: QuadrupleOutputProperties): JSX.Element {
    return <pre>{quadrupleOutput}</pre>;
}

export default App;
