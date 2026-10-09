const {
    findOrCreateUser,
    findUserByEmail,
    findUserById,
    updateUserCurrency,
    updateUserProfile,
    generateUserToken,
    hashPassword,
    comparePassword
} = require("../repositories/usersRepository");

/**
 * Service to register or authenticate a user via OAuth or credentials.
 * 
 * @param {object} userInfo - User payload.
 * @returns {Promise<[object, boolean]>} User instance and creation status.
 */
const registerOrLoginUserService = async (userInfo) => {
    return await findOrCreateUser(userInfo);
};

/**
 * Service to retrieve user by email.
 * 
 * @param {string} email - User email address.
 * @returns {Promise<object|null>} User instance or null.
 */
const getUserByEmailService = async (email) => {
    return await findUserByEmail(email);
};

/**
 * Service to retrieve user by ID.
 * 
 * @param {number} id - User primary ID.
 * @returns {Promise<object|null>} User instance or null.
 */
const getUserByIdService = async (id) => {
    return await findUserById(id);
};

/**
 * Service to update user preferred currency.
 * 
 * @param {number} id - User ID.
 * @param {string} currency - Currency code.
 * @returns {Promise<object>} Updated user.
 */
const setCurrencyService = async (id, currency) => {
    return await updateUserCurrency(id, currency);
};

/**
 * Service to update user personal profile data.
 * 
 * @param {number} id - User ID.
 * @param {object} data - Profile fields to modify.
 * @returns {Promise<object>} Updated user record.
 */
const updateUserProfileService = async (id, data) => {
    return await updateUserProfile(id, data);
};

/**
 * Service to authenticate user directly with verified credentials.
 * 
 * @param {string} email - Email address.
 * @param {string|null} password - Required password.
 * @returns {Promise<{ user: object, token: string }>} User and auth token.
 */
const directLoginService = async (email, password = null) => {
    const user = await findUserByEmail(email);
    if (!user) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    if (!user.password) {
        if (!password) {
            const error = new Error("Password is required to secure this account");
            error.status = 400;
            throw error;
        }
        const hashedPassword = await hashPassword(password);
        user.password = hashedPassword;
        const token = generateUserToken(user);
        user.tokenAuth = token;
        await user.save();
        return {
            user: {
                id: user.id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                currency: user.currency,
                profilephoto: user.profilephoto
            },
            token
        };
    }

    if (!password) {
        const error = new Error("Password is required");
        error.status = 400;
        throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.status = 401;
        throw error;
    }

    const token = generateUserToken(user);
    user.tokenAuth = token;
    await user.save();

    return {
        user: {
            id: user.id,
            name: user.name,
            lastName: user.lastName,
            email: user.email,
            currency: user.currency,
            profilephoto: user.profilephoto
        },
        token
    };
};

module.exports = {
    registerOrLoginUserService,
    getUserByEmailService,
    getUserByIdService,
    setCurrencyService,
    updateUserProfileService,
    directLoginService
};