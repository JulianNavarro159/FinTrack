const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../../db");

const JWT_SECRET = process.env.JWT_SECRET || "fintrack_jwt_secret_key";

/**
 * Hashes a plaintext password using bcrypt.
 * 
 * @param {string} plainPassword - Plaintext password to hash.
 * @returns {Promise<string|null>} Hashed password or null.
 */
const hashPassword = async (plainPassword) => {
    if (!plainPassword) return null;
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
};

/**
 * Compares plaintext password against stored hash.
 * 
 * @param {string} plainPassword - Plaintext input.
 * @param {string} hashedPassword - Stored hash.
 * @returns {Promise<boolean>} Match result.
 */
const comparePassword = async (plainPassword, hashedPassword) => {
    if (!plainPassword || !hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
};

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
 * Finds an existing user or creates a new one with hashed password.
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
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
        return [existingUser, false];
    }

    const hashedPassword = password ? await hashPassword(password) : null;
    const user = await User.create({
        name,
        lastName,
        email: normalizedEmail,
        currency: currency || "USD",
        password: hashedPassword,
        profilephoto,
        emailVerified,
        isAdmin
    });

    const token = generateUserToken(user);
    user.tokenAuth = token;
    await user.save();

    return [user, true];
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
 * Updates profile attributes for a user, with optional password change.
 * 
 * @param {number} id - User ID.
 * @param {object} profileData - Fields to update.
 * @returns {Promise<object>} Updated user attributes.
 */
const updateUserProfile = async (id, { name, lastName, currency, profilephoto, password, currentPassword }) => {
    const user = await User.findByPk(id);
    if (!user) {
        const error = new Error("User not found");
        error.status = 404;
        throw error;
    }

    if (password && password.trim().length > 0) {
        if (password.trim().length < 6) {
            const error = new Error("New password must be at least 6 characters long");
            error.status = 400;
            throw error;
        }

        if (user.password) {
            if (!currentPassword) {
                const error = new Error("Current password is required to change password");
                error.status = 400;
                throw error;
            }
            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) {
                const error = new Error("Current password does not match");
                error.status = 401;
                throw error;
            }
        }

        user.password = await hashPassword(password.trim());
        user.tokenAuth = generateUserToken(user);
    }

    if (name !== undefined && name !== null) user.name = name.trim();
    if (lastName !== undefined && lastName !== null) user.lastName = lastName.trim();
    if (currency !== undefined && currency !== null) user.currency = currency.toUpperCase().trim();
    if (profilephoto !== undefined) user.profilephoto = profilephoto;

    await user.save();

    return {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        currency: user.currency,
        profilephoto: user.profilephoto,
        token: user.tokenAuth
    };
};

module.exports = {
    generateUserToken,
    findOrCreateUser,
    findUserByEmail,
    findUserById,
    updateUserCurrency,
    updateUserProfile,
    hashPassword,
    comparePassword
};