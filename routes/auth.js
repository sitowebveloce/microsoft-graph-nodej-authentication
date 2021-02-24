
const router = require('express-promise-router')();
const graph = require('../graph');

// GET SIGN IN
router.get('/signin', async(req, res) =>{
    // URL Parameters
    const urlParameters = {
        scopes: process.env.OAUTH_SCOPES.split(','),
        redirectUri: process.env.OAUTH_REDIRECT_URI
    };
    // TRY CATCH
    try{
        const authUrl = await req.app.locals.msalClient.getAuthCodeUrl(urlParameters);
            
        // Redirect
        res.redirect(authUrl);

    }catch(error){
        console.log(`Error: ${error}`);
        // Flash
        req.flash('error_msg', {
          message: 'Error getting auth URL',
          debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        // Redirect
        res.redirect('/');
    }
});

// GET AUTH CALLBACK
router.get('/cb', async (req, res) =>{
    const tokenRequest = {
        code: req.query.code,
        scopes: process.env.OAUTH_SCOPES.split(','),
        redirectUri: process.env.OAUTH_REDIRECT_URI
    };
    // TRY CATCH
    try{
        const response = await req.app.locals.msalClient.acquireTokenByCode(tokenRequest);

        // Flash
        // Save the user's homeAccountId in their session
      req.session.userId = response.account.homeAccountId;

      const user = await graph.getUserDetails(response.accessToken);

      // Add the user to user storage
      req.app.locals.users[req.session.userId] = {
        displayName: user.displayName,
        email: user.mail || user.userPrincipalName,
        timeZone: user.mailboxSettings.timeZone
      };
        // REDIRECT
        res.redirect('/');

    }catch(error){
        req.flash('error_msg', {
            message: 'Error completing authentication',
            debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
          });
        // REDIRECT
        res.redirect('/');
    }
});

// GET SIGNOUT
router.get('/signout', async (req, res)=>{

    if(req.session.userId){
        // Look up the user's account in the cache
        const accounts = await req.app.locals.msalClient
        .getTokenCache()
        .getAllAccounts();

        const userAccount = accounts.find(u => u.homeAccountId === req.session.userId);

        // Check user and remove
        if(userAccount){
            req.app.locals.msalClient
            .getTokenCache()
            .removeAccount(userAccount);
        };
        // Destroy user session
        req.session.destroy(err=>{
            if(err) console.log(err);
        });
        res.redirect('/');
    }
});

// Export 
module.exports = router;