import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    Input,
    Button,
    useDisclosure,
    Stack,
    Textarea,
} from '@chakra-ui/react';
import React, { useRef, type ReactElement } from 'react';

/**
 * SignUpForm component
 * @returns {ReactElement} 返回一个 JSX 元素
 */
function SignUpForm(): ReactElement {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const buttonReference = useRef<HTMLButtonElement>(null);

    return (
        <div>
            <Button ref={buttonReference} colorScheme='teal' onClick={onOpen}>
                Sign Up
            </Button>
            <Drawer isOpen={isOpen} placement='bottom' onClose={onClose} finalFocusRef={buttonReference}>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Create your account</DrawerHeader>

                    <DrawerBody>
                        <Stack spacing={3}>
                            <Input placeholder='Name' />
                            <Input placeholder='Email' />
                            <Textarea placeholder='Message' />
                        </Stack>
                    </DrawerBody>

                    <DrawerFooter>
                        <Button variant='outline' mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button colorScheme='blue'>Save</Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

export default SignUpForm;
