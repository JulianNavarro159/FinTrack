const {
    registerOrLoginUserService,
    getUserByEmailService,
    getUserByIdService,
    setCurrencyService,
    updateUserProfileService,
    directLoginService
} = require("../services/userService");

/**
 * Handles user registration or login via OAuth sync or form.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} Express response with token and user.
 */
const userRegister = async (req, res) => {
    try {
        const { name, lastName, email, password, currency, emailVerified, isAdmin } = req.body;
        const profilephoto = req.file ? req.file.path : (req.body.profilephoto || null);

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (!password || password.trim().length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        const [user, created] = await registerOrLoginUserService({
            name,
            lastName,
            email,
            password: password.trim(),
            currency: currency || "USD",
            profilephoto,
            emailVerified,
            isAdmin
        });

        if (!created) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        return res.status(201).json({
            token: user.tokenAuth,
            user: {
                id: user.id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                currency: user.currency,
                profilephoto: user.profilephoto
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

/**
 * Handles direct login with verified email and password credentials.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} Express response with token and user.
 */
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        const authData = await directLoginService(email, password);
        return res.status(200).json(authData);
    } catch (error) {
        const statusCode = error.status || (error.message.includes("Invalid") ? 401 : 500);
        return res.status(statusCode).json({ message: error.message || "Login failed" });
    }
};

/**
 * Retrieves the currently authenticated user's profile.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} Express response with user profile.
 */
const getMyProfile = async (req, res) => {
    try {
        const idUser = req.idUser;
        const user = await getUserByIdService(idUser);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving profile", error: error.message });
    }
};

/**
 * Updates full profile attributes for the authenticated user.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} Express response with updated profile.
 */
const updateProfile = async (req, res) => {
    try {
        const idUser = req.idUser;
        const { name, lastName, currency, password, currentPassword } = req.body;
        const profilephoto = req.file ? req.file.path : (req.body.profilephoto || undefined);

        const updated = await updateUserProfileService(idUser, {
            name,
            lastName,
            currency,
            profilephoto,
            password,
            currentPassword
        });

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updated,
            token: updated.token
        });
    } catch (error) {
        const statusCode = error.status || 500;
        return res.status(statusCode).json({ message: error.message || "Error updating profile" });
    }
};

/**
 * Updates preferred currency for the authenticated user.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} Express response with updated currency.
 */
const updateCurrency = async (req, res) => {
    try {
        const idUser = req.idUser;
        const { currency } = req.body;

        if (!currency || typeof currency !== "string") {
            return res.status(400).json({ message: "Valid currency string is required" });
        }

        const updated = await setCurrencyService(idUser, currency);
        return res.status(200).json({
            message: "Currency updated successfully",
            currency: updated.currency
        });
    } catch (error) {
        return res.status(500).json({ message: "Error updating currency", error: error.message });
    }
};

/**
 * Checks if user exists by email.
 * 
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} Express response with boolean flag.
 */
const userByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await getUserByEmailService(email);
        return res.status(200).json(!!user);
    } catch (error) {
        return res.status(500).json({ message: "Error checking user email", error: error.message });
    }
};

module.exports = {
    userRegister,
    userLogin,
    getMyProfile,
    updateProfile,
    updateCurrency,
    userByEmail
};