import type React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import nasm from 'react-syntax-highlighter/dist/esm/languages/prism/nasm';
import okaidia from 'react-syntax-highlighter/dist/esm/styles/prism/okaidia';
import solarizedlight from 'react-syntax-highlighter/dist/esm/styles/prism/solarizedlight';

export type SyntaxHighlightStyle = Record<string, React.CSSProperties>;

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('nasm', nasm);

export const getSyntaxHighlightStyle = (colorMode: string): SyntaxHighlightStyle =>
    colorMode === 'light' ? solarizedlight : okaidia;

export default SyntaxHighlighter;
