import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Box,
    useColorModeValue,
    IconButton,
    useClipboard,
    useColorMode,
    Text,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight, okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeModalProperties {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    result: string;
}

/**
 * A modal component that displays syntax-highlighted code.
 * @param {CodeModalProps} props - The props for the component.
 * @returns {JSX.Element} The rendered CodeModal component.
 */
function CodeModal({ isOpen, onClose, code, result }: Readonly<CodeModalProperties>): JSX.Element {
    const { onCopy } = useClipboard(code);
    const bg = useColorModeValue('white', 'gray.700');
    const color = useColorModeValue('gray.800', 'white');
    const { colorMode } = useColorMode();
    const currentStyle = colorMode === 'light' ? solarizedlight : okaidia;

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size='xl'>
            <ModalOverlay />
            <ModalContent bg={bg} color={color}>
                <ModalHeader>Explore Code</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box position='relative' zIndex='1'>
                        <IconButton
                            icon={<CopyIcon />}
                            size='sm'
                            aria-label='Copy code'
                            position='absolute'
                            top='1'
                            right='1'
                            onClick={onCopy}
                        />
                        {code !== null && code.length > 0 && (
                            <>
                                <Box
                                    display='flex'
                                    justifyContent='center'
                                    alignItems='center'
                                    p={2}
                                    bg={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                                    color={colorMode === 'light' ? 'black' : 'white'}
                                    borderRadius='md'
                                    _hover={{
                                        bg: colorMode === 'light' ? 'gray.300' : 'gray.600',

                                        transition: 'all 0.2s ease-in-out',
                                        borderRadius: 'md',
                                    }}
                                >
                                    <Text fontWeight='bold' fontSize='sm'>CPP</Text>
                                </Box>
                                <SyntaxHighlighter
                                    language='cpp'
                                    style={currentStyle}
                                    showLineNumbers
                                    wrapLines
                                    wrapLongLines
                                    customStyle={{ whiteSpace: 'pre-wrap', marginTop: 0 }}
                                    lineProps={(lineNumber) => {
                                        const style: React.CSSProperties = { display: 'block' };
                                        if (lineNumber % 2 === 0) {
                                            style.backgroundColor = colorMode === 'light' ? '#ede5cf' : '#2c2c2c';
                                        }
                                        return { style };
                                    }}
                                >
                                    {code}
                                </SyntaxHighlighter>
                                <Box
                                    mt={4}
                                    p={4}
                                    bg={colorMode === 'light' ? 'gray.200' : 'gray.700'}
                                    color={colorMode === 'light' ? 'gray.900' : 'white'}
                                    borderRadius='lg'
                                >
                                    <Text fontWeight='bold' textAlign='center'>
                                        Result
                                    </Text>
                                    <Box
                                        mt={2}
                                        p={4}
                                        bg={colorMode === 'light' ? 'gray.100' : 'gray.600'}
                                        color={colorMode === 'light' ? 'gray.900' : 'white'}
                                        borderRadius='lg'
                                    >
                                        <Text textAlign='center'>{result}</Text>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default CodeModal;
