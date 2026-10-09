const { Router } = require('express');

const routesUsers = require('../Users/routes/routesUsers');
const routesTransaction = require('../Transaction/routes/routesTransaction');
const routesCategories = require('../Categories/routes/routesCategories');

const createMainRouter = () => {
    const mainRouter = Router();
    mainRouter.use('/transaction', routesTransaction);
    mainRouter.use('/categories', routesCategories);
    return mainRouter;
};

const createAuthRouter = () => {
    const authRouter = Router();
    authRouter.use('/users', routesUsers);
    return authRouter;
};

module.exports = {
    router: createMainRouter(),
    auth_router: createAuthRouter()
};