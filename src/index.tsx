/* eslint-disable import/no-import-module-exports */
import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import App from './app';
/* eslint-enable import/no-import-module-exports */

/* eslint-disable unicorn/prefer-module */
if (module?.hot !== undefined) {
    module.hot.accept();
}
/* eslint-enable unicorn/prefer-module */

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
