# Microsoft Graph API NodeJs Authentication
Simple Microsoft Graph authentication, login get token and fetch/post calendar events.

![GitHub Logo](/public/images/graph.gif)

# 🥞 Stack
* NodeJs
* Express
* [@microsoft/microsoft-graph-client](https://www.npmjs.com/package/@microsoft/microsoft-graph-client)
* [@azure/msal-node](https://www.npmjs.com/package/@azure/msal-node)
* [hbs](https://www.npmjs.com/package/hbs)

### Instructions
You need to install [nodejs](https://nodejs.org/en/) in your machine.

Rename env.env file in .env, go to [https://aad.portal.azure.com/](https://aad.portal.azure.com/) login with your microsoft account and register your app, grab the **Application (client) ID** and your **Client Secret** and place this values inside the .env file.

##### Install packages
Inside the project folder open a terminal and run
> npm i

##### Start
in the terminal run this command
> npm run start

Open a browser at this link
> http://localhost:3001


#### License MIT
**Author @lex gd ❤️**





