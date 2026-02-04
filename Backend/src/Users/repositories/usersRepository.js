const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { User } = require('../../db')
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;

const loginUser = async ({ name, lastName, email, profilephoto, emailVerified, isAdmin }) => {
    
    const newUserInfo = {
        name,
        lastName,
        email,
        profilephoto,
        emailVerified,
        isAdmin
    };
    const [ user, create ]  = await User.findOrCreate({ 
        where: { email },
        defaults: newUserInfo
    });
    
    const tokenJWT = jwt.sign(
        {
            email: user.email, 
            activeUser: create ? true : user.activeUser,
            isAdmin: user.isAdmin
        },
        JWT_SECRET
        // {
        //     expiresIn: "4h" // expira en 40 horas
        // }
    );

    
    if( create ){
        user.tokenAuth = tokenJWT;
        user.changed('tokenAuth', true);
        await user.save();
        await user.reload();
        return [user, create];
    };
    return [user, create];
};

const verifyEmail = async ( emailToVerify ) => {
    const user = await User.findOne(
        { 
            where: {
                email: emailToVerify
            }
        }
    );
    // Si el correo ya estaba registrado
    if( !!user ){
        // y tiene un token creado
        // console.log("el user ->", user.tokenAuth)
        if( user.tokenAuth ){
            // try {
                
            //Verificar token
            const decoded = jwt.decode( user.tokenAuth, JWT_SECRET );
            // si el token existe, uso el email de la decodificación
            // para retornar la información del usuario
            if( decoded.email ){
                console.log("jwt:   ", decoded.email)
                return user.tokenAuth
            };
        };
    }
    // si no es un usuario registrado
    else return false;
};

const getUserByEmail = async (email) => {
    const userToFind = await EntityUsers.findOne({
        where: {
            email: email
        }
    });
    return !!userToFind.email;
};

const verifyingTokenUser = async (token) => {
    const {emailUser} = jwt.decode( token, JWT_SECRET );
    const user = await EntityUsers.findOne({
        where: {
            emailUser: emailUser
        },
        include: [{
            model: EntityUserAddress,
            attributes: ['idUserAddress', 'identifierName', 'numberAddress', 'addressName', 'postalCode', 'provinceAddress', 'cityAddress', 'country']
        }]
    }) 
    
    if( user ){
        return user
    }
    throw new Error (" el token no esta asignado a ningun usuario registrado")
};

module.exports = {
    loginUser,
    verifyEmail,
    getUserByEmail,
    verifyingTokenUser
}