const jwt = require("jsonwebtoken");
const { User } = require("../../db");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            return res.status(401).json({ message: "No autorizado, token requerido" });
        }

        const token = authHeader.split(" ")[1]; // Extraer el token (Formato: Bearer <token>)
        if (!token) {
            return res.status(401).json({ message: "Token inválido o no presente" });
        }

        // Verificar el token con la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.email) {
            return res.status(401).json({ message: "Token no válido" });
        }

        // Buscar el usuario en la base de datos
        const user = await User.findOne({ where: { email: decoded.email } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Agregar el id del usuario al request
        req.idUser = user.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Error de autenticación", error: error.message });
    }
};

module.exports = authMiddleware;