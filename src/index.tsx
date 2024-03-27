import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import axios from 'axios';

if (module?.hot) {
    module.hot.accept();
}

// axios test using public api
axios
    .get('https://jsonplaceholder.typicode.com/posts')
    .then((response) => {
        console.log(response.data);
    })
    .catch((error) => {
        console.log(error);
    });

ReactDOM.render(<App />, document.querySelector('#root'));
