const {
    userRegister,
    userByEmail,
    userByOnliEmail,
    getToken
} = require('./../controllers/userController.js');
const upload = require('../../../src/configCloudinary.js');

const routesUsers = require('express').Router();

routesUsers.post('/', upload.single('profilephoto'), userRegister);
routesUsers.get('/:email', userByEmail);
routesUsers.get('/email/:email', userByOnliEmail);
routesUsers.get('/auth/token', getToken);

module.exports = routesUsers;