const {
    loginUserServices,
    verifyingTokenService,
    getUserByEmailServices,
    serviceGetByEmail
} = require('../services/userService');

const userRegister = async (req, res) => {
    try {
        const { name, lastName, email, emailVerified, isAdmin } = req.body;

        const profilephoto = req.file ? req.file.path : null;

        if (!email) {
            return res.status(400).json({ message: 'Proporcione un correo electrónico' });
        }

        const [user, created] = await loginUserServices({
            name,
            lastName,
            email,
            profilephoto, // Guardar directamente la URL de Cloudinary
            emailVerified,
            isAdmin
        });

        return res.status(created ? 201 : 200).json({ token: user.tokenAuth });

    } catch (error) {
        console.error("❌ Error en userRegister:", error);
        res.status(500).json({ message: error.message || "Error en el servidor" });
    }
};

const userByEmail = async ( req, res ) => {
    try {
        let { email } = req.params;
        email = email.trim().toLowerCase()
        const isVerified = await serviceGetByEmail( email );

        if( !isVerified ){
            return res.status(200).json( isVerified )
        }
        return res.status(200).json( isVerified )
        
    } catch (error) {
        return res.status(500).send( 'No se pudo procesar la solicitud' )
    }
};

const userByOnliEmail = async ( req, res ) => {
    try {
        const { email } = req.params;
        const formatedEmail = email.trim().toLowerCase();
        const user = await getUserByEmailServices(formatedEmail);
        if (user) return res.status(200).json(true);
        return res.status(404).json(false);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuario", detail: error.message });
    }
}

const getToken = async ( req, res ) => {
    try {
        const token = req.header('Authorization').split(' ')[1]
        const verifying = await verifyingTokenService( token )
        res.status(200).json( verifying )
    } catch (error) {
        // res.status(500).send( error )
        res.status(500).json({ error:'No se pudo procesar la solicitud de verificación', detail: error.message } )
    }
}

module.exports = {
    userRegister,
    userByEmail,
    userByOnliEmail,
    getToken
}