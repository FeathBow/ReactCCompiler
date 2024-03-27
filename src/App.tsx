import React, { useState } from 'react';
import { tokenize } from './utils/token';
import { parse } from './utils/parse';
import { generateCode, getGenerated } from './utils/generate';
import { logMessage } from './utils/logger';

function App(): JSX.Element {
    const [code, setCode] = useState('');
    const [output, setOutput] = useState<string[]>([]);

    const handleSubmit = (event: React.FormEvent): void => {
        event.preventDefault();

        const tokens = tokenize(code);
        logMessage('info', 'Tokens', { tokens: JSON.stringify(tokens) });
        const program = parse(tokens);
        logMessage('info', 'AST', { program: JSON.stringify(program) });
        // Traverse the AST to emit assembly.
        generateCode(program);
        setOutput(getGenerated());
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
        </div>
    );
}

interface OutputProps {
    output: string[];
}

function OutputComponent({ output }: OutputProps): JSX.Element {
    return (
        <div>
            {output.map((line, index) => (
                <p key={index}>{line}</p>
            ))}
        </div>
    );
}

export default App;
