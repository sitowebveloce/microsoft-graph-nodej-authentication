const router = require('express-promise-router')();
const graph = require('../graph.js');
const moment = require('moment-timezone');
const iana = require('windows-iana');
const { body, validationResult } = require('express-validator');
const validator = require('validator');

/* GET /calendar */
router.get('/',
  async function(req, res) {
    if (!req.session.userId) {
      // Redirect unauthenticated requests to home page
      res.redirect('/')
    } else {
      const params = {
        active: { calendar: true }
      };

      // Get the user
      const user = req.app.locals.users[req.session.userId];
      // Convert user's Windows time zone ("Pacific Standard Time")
      // to IANA format ("America/Los_Angeles")
      // Moment needs IANA format
      const timeZoneId = iana.findOneIana(user.timeZone);
      console.log(`Time zone: ${timeZoneId.valueOf()}`);

      // Calculate the start and end of the current week
      // Get midnight on the start of the current week in the user's timezone,
      // but in UTC. For example, for Pacific Standard Time, the time value would be
      // 07:00:00Z
      var startOfWeek = moment.tz(timeZoneId.valueOf()).startOf('week').utc();
      var endOfWeek = moment(startOfWeek).add(7, 'day');
      console.log(`Start: ${startOfWeek.format()}`);

      // Get the access token
      var accessToken;
      try {
        accessToken = await getAccessToken(req.session.userId, req.app.locals.msalClient);
      } catch (err) {
        req.flash('error_msg', {
          message: 'Could not get access token. Try signing out and signing in again.',
          debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });

        return;
      }

      if (accessToken && accessToken.length > 0) {
        try {
          // Get the events
          const events = await graph.getCalendarView(
            accessToken,
            startOfWeek.format(),
            endOfWeek.format(),
            user.timeZone
            );

          // res.json(events.value);
          // CREATE AN AVENT OBJECT
          params.events = events.value;
        } catch (err) {
          req.flash('error_msg', {
            message: 'Could not fetch events',
            debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
          });
        }
      }
      else {
        req.flash('error_msg', 'Could not get an access token');
      }

      // Render calendar view
      res.render('calendar', params);
    }
  }
);

async function getAccessToken(userId, msalClient) {
  // Look up the user's account in the cache
  try {
    const accounts = await msalClient
      .getTokenCache()
      .getAllAccounts();

    const userAccount = accounts.find(a => a.homeAccountId === userId);

    // Get the token silently
    const response = await msalClient.acquireTokenSilent({
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI,
      account: userAccount
    });

    return response.accessToken;
  } catch (err) {
    console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
}

/* GET /calendar/new */
router.get('/new',
  function(req, res) {
    if (!req.session.userId) {
      // Redirect unauthenticated requests to home page
      res.redirect('/')
    } else {
      res.locals.newEvent = {};
      res.render('newevent');
    }
  }
);


/* POST /calendar/new */

router.post('/new', async (req, res)=> {
  // If no logged in redirect

  if (!req.session.userId) {
    // Redirect unauthenticated requests to home page
    res.redirect('/');
  } else {
    // Build an object from the form values
    const formData = {
      subject: req.body['ev-subject'],
      attendees: req.body['ev-attendees'],
      start: req.body['ev-start'],
      end: req.body['ev-end'],
      body: req.body['ev-body']
    };

    // Get the access token
    var accessToken;
    try {
      accessToken = await getAccessToken(req.session.userId, req.app.locals.msalClient);
     
    } catch (err) {
      req.flash('error_msg', {
        message: 'Could not get access token. Try signing out and signing in again.',
        debug: JSON.stringify(err, Object.getOwnPropertyNames(err))
      });
      return;
    }

    // Get the user
    const user = req.app.locals.users[req.session.userId];

    // Create the event
    try {
      await graph.createEvent(accessToken, formData, user.timeZone);
    } catch (error) {
      req.flash('error_msg', {
        message: 'Could not create event',
        debug: JSON.stringify(error, Object.getOwnPropertyNames(error))
      });
    }

    // Redirect back to the calendar view
    return res.redirect('/calendar');
  }
}
);

module.exports = router;