const { loginUser, verifyingTokenUser, getUserByEmail, verifyEmail } = require("../repositories/usersRepository");


const loginUserServices = async (userInfo) => {
    const infoUser = {
        name: userInfo.name,
        lastName: userInfo.lastName || null,
        email: userInfo.email,
        profilephoto: userInfo.profilephoto || null,
        emailVerified: userInfo.emailVerified || false,
        isAdmin: userInfo.isAdmin || false
    }
    const [ user,create ] = await loginUser( infoUser );
    if(create){
        // await sendWelcomeEmail( infoUser.email, infoUser.email )
        // await sendReviewEmail( infoUser.email, infoUser.email )
    }
    return [user,create]
}

const serviceGetByEmail = async ( emailToVerify ) => {
    // console.log("acaaaaaaaaa en servicegetbyEmail")
    const userIsVerified = await verifyEmail( emailToVerify )
    return userIsVerified
}

const getUserByEmailServices = async ( email ) =>{
    const searchedUser = await getUserByEmail( email )
    // if(!searchedUser){
        //     throw new Error ('Usuario no fue encontrado')
        // }
        return searchedUser
}

const verifyingTokenService = async ( token ) => {
    const verifyingToken = await verifyingTokenUser( token );
    return verifyingToken
}

module.exports = {
    loginUserServices,
    serviceGetByEmail,
    getUserByEmailServices,
    verifyingTokenService
}