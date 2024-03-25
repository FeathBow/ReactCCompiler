import React from 'react';
import Header from 'Components/Header';
import './App.scss';

interface IProperties {
    name: string;
    age: number;
}

function App(properties: IProperties) {
    const { name, age } = properties;
    return (
        <div className='app'>
            <Header />
            <span>{`Hello! I'm ${name}, ${age} years old.`}</span>
        </div>
    );
}

export default App;
