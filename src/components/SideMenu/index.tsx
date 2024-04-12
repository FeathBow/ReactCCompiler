import React from 'react';
import {
    Box,
    Flex,
    Icon,
    Collapse,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    type BoxProps,
    Tooltip,
    PopoverHeader,
} from '@chakra-ui/react';
import { FiChevronDown } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useMenuState, useCollapse, type MenuList } from './commons';

const menuItemClass = {
    p: '4',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    fontSize: 'sm',
    _hover: { bg: 'blue.300' },
    borderRadius: 'lg',
    boxShadow: 'sm',
};

const activeClass = {
    color: 'green.500',
    fontWeight: 'semibold',
};

const unActiveClass = {
    color: 'grey.50',
    fontWeight: 'normal',
};

/**
 * 目录组件，用于显示目录项列表。
 * Menu component that displays a list of menu items.
 * @param {MenuList} menuList - List of menu items to display.
 * @returns {JSX.Element} The rendered menu component.
 */
function SideMenu({ menuList }: Readonly<{ menuList: MenuList }>): JSX.Element {
    const { expandedMenu, activeMenuIndexes, toggleMenuExpand, setMenuActive } = useMenuState();
    const { collapseButton, showCollapseBtn, hideCollapseBtn, isMenuCollapse } = useCollapse();

    const isExpanded = (index: number): boolean => expandedMenu.includes(index);
    const isActive = (index: number, subIndex = -1): boolean => {
        if (subIndex !== -1) {
            return activeMenuIndexes[0] === index && activeMenuIndexes[1] === subIndex;
        }
        return activeMenuIndexes[0] === index;
    };

    const onMenuClick = (index: number, menuItem: MenuList[number]): void => {
        setMenuActive(index);
        if (menuItem.subMenu !== null) toggleMenuExpand(index);
    };

    const renderSubMenu = (
        subMenu: MenuList[number]['subMenu'],
        index: number,
        properties?: BoxProps,
    ): JSX.Element[] | undefined =>
        subMenu?.map(
            (subMenuItem, subIndex): JSX.Element => (
                <Link to={subMenuItem.path ?? '/'} key={subMenuItem.title}>
                    <Box
                        {...menuItemClass}
                        {...(isActive(index, subIndex) ? activeClass : unActiveClass)}
                        pl='8'
                        key={subMenuItem.title}
                        onClick={(): void => {
                            setMenuActive(index, subIndex);
                        }}
                        {...properties}
                    >
                        {subMenuItem.title}
                    </Box>
                </Link>
            ),
        );

    const renderMenuItem = (menuItem: MenuList[number], index: number): JSX.Element =>
        menuItem.path === undefined ? ( 
            <Flex
                align='center'
                justify='space-between'
                {...menuItemClass}
                {...(isActive(index) ? activeClass : unActiveClass)}
                onClick={() => {
                    onMenuClick(index, menuItem);
                }}
            >
                <Flex align='center' overflow='hidden'>
                    <Box mr='3'>{menuItem.icon}</Box>
                    {!isMenuCollapse && <Box fontSize='sm'>{menuItem.title}</Box>}
                </Flex>
                {!isMenuCollapse && menuItem.subMenu !== undefined && (
                    <Icon
                        transition='transform 0.2s ease-in-out'
                        transform={`rotate(${isExpanded(index) ? -180 : 0}deg)`}
                        as={FiChevronDown}
                    />
                )}
            </Flex>
        ) : (
            <Link to={menuItem.path} key={menuItem.title}>
                <Flex
                    align='center'
                    justify='space-between'
                    {...menuItemClass}
                    {...(isActive(index) ? activeClass : unActiveClass)}
                    onClick={() => {
                        onMenuClick(index, menuItem);
                    }}
                >
                    <Flex align='center' overflow='hidden'>
                        <Box mr='3'>{menuItem.icon}</Box>
                        {!isMenuCollapse && <Box fontSize='sm'>{menuItem.title}</Box>}
                    </Flex>
                    {!isMenuCollapse && menuItem.subMenu !== undefined && (
                        <Icon
                            transition='transform 0.2s ease-in-out'
                            transform={`rotate(${isExpanded(index) ? -180 : 0}deg)`}
                            as={FiChevronDown}
                        />
                    )}
                </Flex>
            </Link>
        );

    return (
        <Box
            h='100%'
            boxShadow='lg'
            w={isMenuCollapse ? '50px' : '200px'}
            position='relative'
            transition='width 0.2s'
            borderRadius='lg'
            onMouseEnter={() => {
                showCollapseBtn();
            }}
            onMouseLeave={() => {
                hideCollapseBtn();
            }}
        >
            {collapseButton}
            <Flex direction='column' height='100%'>
                {menuList.map((menuItem, index) => (
                    <Box key={menuItem.title}>
                        <Popover trigger='hover' placement='right' closeOnBlur={false} offset={[0, 16]}>
                            {menuItem.subMenu === undefined ? (
                                <Tooltip
                                    hasArrow
                                    placement='right'
                                    label={menuItem.title}
                                    aria-label={menuItem.title}
                                    isDisabled={!isMenuCollapse}
                                >
                                    {renderMenuItem(menuItem, index)}
                                </Tooltip>
                            ) : (
                                <PopoverTrigger>{renderMenuItem(menuItem, index)}</PopoverTrigger>
                            )}

                            <PopoverContent w='max-content' hidden={!isMenuCollapse || menuItem.subMenu === undefined}>
                                <PopoverArrow />
                                <PopoverHeader p='3' color='gray.600' fontSize='sm' fontWeight='semibold'>
                                    {menuItem.title}
                                </PopoverHeader>

                                {renderSubMenu(menuItem.subMenu, index, {
                                    pl: '3',
                                    p: '3',
                                })}
                            </PopoverContent>
                        </Popover>

                        {menuItem.subMenu !== undefined && (
                            <Collapse in={isExpanded(index) && !isMenuCollapse} animateOpacity>
                                {menuItem.subMenu.map((subMenuItem, subIndex) => (
                                    <Link to={subMenuItem.path ?? '/'} key={subMenuItem.title}>
                                        <Box
                                            pl='8'
                                            {...menuItemClass}
                                            {...(isActive(index, subIndex) ? activeClass : unActiveClass)}
                                            onClick={() => {
                                                setMenuActive(index, subIndex);
                                            }}
                                        >
                                            {subMenuItem.title}
                                        </Box>
                                    </Link>
                                ))}
                            </Collapse>
                        )}
                    </Box>
                ))}
            </Flex>
        </Box>
    );
}

export default SideMenu;
