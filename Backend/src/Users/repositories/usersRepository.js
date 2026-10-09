const jwt = require("jsonwebtoken");
const { User } = require("../../db");

const JWT_SECRET = process.env.JWT_SECRET || "fintrack_jwt_secret_key";

/**
 * Generates a signed JWT for a given user record.
 * 
 * @param {object} user - User model instance.
 * @returns {string} Signed JWT string.
 */
const generateUserToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin
        },
        JWT_SECRET,
        { expiresIn: "30d" }
    );
};

/**
 * Finds an existing user or creates a new one, provisioning tokenAuth.
 * 
 * @param {object} userData - User registration attributes.
 * @returns {Promise<[object, boolean]>} User instance and creation flag.
 */
const findOrCreateUser = async ({
    name,
    lastName,
    email,
    currency = "USD",
    password = null,
    profilephoto = null,
    emailVerified = false,
    isAdmin = false
}) => {
    const normalizedEmail = email.trim().toLowerCase();
    const [user, created] = await User.findOrCreate({
        where: { email: normalizedEmail },
        defaults: {
            name,
            lastName,
            email: normalizedEmail,
            currency: currency || "USD",
            password,
            profilephoto,
            emailVerified,
            isAdmin
        }
    });

    const token = generateUserToken(user);
    user.tokenAuth = token;
    await user.save();

    return [user, created];
};

/**
 * Finds user by unique email.
 * 
 * @param {string} email - Email address.
 * @returns {Promise<object|null>} User instance or null.
 */
const findUserByEmail = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    return await User.findOne({ where: { email: normalizedEmail } });
};

/**
 * Finds user by primary key.
 * 
 * @param {number} id - User ID.
 * @returns {Promise<object|null>} User instance or null.
 */
const findUserById = async (id) => {
    return await User.findByPk(id, {
        attributes: ["id", "name", "lastName", "email", "currency", "profilephoto", "isAdmin"]
    });
};

/**
 * Updates preferred currency for a user.
 * 
 * @param {number} id - User ID.
 * @param {string} currency - Currency code.
 * @returns {Promise<object>} Updated user.
 */
const updateUserCurrency = async (id, currency) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error("User not found");
    }
    user.currency = currency.toUpperCase().trim();
    await user.save();
    return user;
};

/**
 * Updates profile attributes for a user.
 * 
 * @param {number} id - User ID.
 * @param {object} profileData - Fields to update.
 * @returns {Promise<object>} Updated user attributes.
 */
const updateUserProfile = async (id, { name, lastName, currency, profilephoto }) => {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error("User not found");
    }

    if (name !== undefined) user.name = name.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (currency !== undefined) user.currency = currency.toUpperCase().trim();
    if (profilephoto !== undefined) user.profilephoto = profilephoto;

    await user.save();

    return {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        currency: user.currency,
        profilephoto: user.profilephoto
    };
};

module.exports = {
    generateUserToken,
    findOrCreateUser,
    findUserByEmail,
    findUserById,
    updateUserCurrency,
    updateUserProfile
};