import React from 'react';
import './index.scss';

/**
 * Header 组件，用于显示页面的标题。
 * The Header component, used to display the title of the page.
 * @returns {JSX.Element} 返回一个 JSX 元素。Return a JSX element.
 */
function Header() : JSX.Element{
    return (
        <div className='header'>
            <span>I am Header</span>
        </div>
    );
}

export default Header;
