/**
 * AuthManager
 * 
 * This module aims to abstract login procedures. Results from Mojang's REST api
 * are retrieved through our Mojang module. These results are processed and stored,
 * if applicable, in the config using the ConfigManager. All login procedures should
 * be made through this module.
 * 
 * @module authmanager
 */
// Requirements
const ConfigManager          = require('./configmanager')
const { LoggerUtil }         = require('helios-core')
const { AZURE_CLIENT_ID }    = require('./ipcconstants')

const {AuthClient} = require('azuriom-auth')

const log = LoggerUtil.getLogger('AuthManager')



exports.addPhynariaAccount = async function(username, password) {

    const client = new AuthClient('https://phynaria.fr')
    
    let result = await client.login(username, password)
        

     if (result.status === 'pending' && result.requires2fa) {
            const twoFactorCode = '' // IMPORTANT: Replace with the 2FA user temporary code
            result = await client.login(email, password, twoFactorCode)
    }

    if(result.status == 'success'){

        const ret = ConfigManager.addMojangAuthAccount(result.uuid, result.accessToken, username, result.username);
        ConfigManager.save();
        return ret

    }  else {
        return Promise.reject("Nom d'utilisateur ou mot de passe inconnue");
    }

    
}

async function validateSelectedPhynariaAccount(){

    const client = new AuthClient('https://phynaria.fr')
    const current = ConfigManager.getSelectedAccount();

    const reponse = client.verify(current.accessToken);

    if (reponse.status == 'success') {  
        log.info('Account access token validated.')
        return true;
    }
    
}

exports.removePhynariaAccount = async function(uuid){
    try {

        const client = new AuthClient('https://phynaria.fr')
        const authAcc = ConfigManager.getAuthAccount(uuid)
        const response = client.logout(authAcc.accessToken)

        ConfigManager.removeAuthAccount(uuid)
        ConfigManager.save()
        return Promise.resolve()
    
    } catch (err){
        log.error('Error while removing account', err)
        return Promise.reject(err)
    }
}



/**
 * Validate the selected auth account.
 * 
 * @returns {Promise.<boolean>} Promise which resolves to true if the access token is valid,
 * otherwise false.
 */
exports.validateSelected = async function(){
    
    return await validateSelectedPhynariaAccount();
    
}