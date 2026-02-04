const { Router } = require('express');

const routesUsers = require('./../Users/routes/routesUsers');
const routesTransaction = require('./../Transaction/routes/routesTransaction');

const router = () => {
    const routers = Router();
    routers.use('/transaction', routesTransaction);

    return routers;
}

const auth_router = () => {
    const routers = Router();
    routers.use('/users', routesUsers);

    return routers;
}

module.exports = {
    router: router(),
    auth_router: auth_router()
};