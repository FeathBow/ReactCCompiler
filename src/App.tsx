import './app.scss';
import React, { useState } from 'react';
import { tokenize } from './utils/token';
import { parse } from './utils/parse';
import { generateCode } from './utils/generate';
import { logMessage } from './utils/logger';

function App(): JSX.Element {
    const [code, setCode] = useState('');

    const handleSubmit = (event: React.FormEvent): void => {
        event.preventDefault();

        const tokens = tokenize(code);
        logMessage('info', 'Tokens', { tokens: JSON.stringify(tokens) });
        const program = parse(tokens);
        logMessage('info', 'AST', { program: JSON.stringify(program) });
        // Traverse the AST to emit assembly.
        generateCode(program);
    };

    return (
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
    );
}

export default App;
