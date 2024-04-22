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
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getCurrentWebContents } = require('@electron/remote');
const log = LoggerUtil.getLogger('AuthManager')

const usernames = 'Droopi29';
const passwords = 'France1789**/';


exports.addPhynariaAccount = async function(username, password) {
  try {
    const instance = axios.create({
      baseURL: 'https://phynaria.fr',
      headers: {
        'X-API-KEY': '6b825e81d47b2ca0c24b623a156284dd',
        'Content-Type': 'multipart/form-data' // Déplacer l'en-tête ici
      },
    });

    // Création d'un objet FormData et ajout des champs username et password
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    console.log(formData)

    // Envoi de la requête POST
    const response = await instance.post('/api/auth/login', formData);

    // Log de la réponse
    console.log('Réponse du serveur:', response.data);

    const responseObject = response.data;
    const token = responseObject.data.token;

    if (response.data.status == true) {
      const profile = await instance.get('/api/users/' + username)
      console.log(profile.data)
      const ret = ConfigManager.addMojangAuthAccount(uuidv4(), token, profile.data.realname, profile.data.realname);
      ConfigManager.save();
      return ret
    }

    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du compte Phynaria:', error);
    throw error; // Propagez l'erreur pour la gérer à un niveau supérieur si nécessaire
  }
};

async function validateSelectedPhynariaAccount(){

  const current = ConfigManager.getSelectedAccount();


  try {
    const instance = axios.create({
      baseURL: 'https://phynaria.fr',
      headers: {
        'X-API-KEY': '6b825e81d47b2ca0c24b623a156284dd',
        'Content-Type': 'multipart/form-data' // Déplacer l'en-tête ici
      },
    });

    // Envoi de la requête GET
    const response = await instance.get('/api/auth/sessions/' + current.username);

    // Log de la réponse
    console.log('Réponse du serveur:', response.data);

    if (response.data.status == true) {
      const responseObject = response.data;

      const tokens = responseObject.data.map(item => item.loginToken);
      
      console.log(current.accessToken)

      if (tokens.includes(current.accessToken)){
        return true;
      } else {
        return false;
      }


    }

    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du compte Phynaria:', error);
    return false;
    throw error; // Propagez l'erreur pour la gérer à un niveau supérieur si nécessaire
    
  }
}

exports.removePhynariaAccount = async function(uuid){
    try {

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