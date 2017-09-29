import { Meteor } from 'meteor/meteor';
import Twit from 'twit';

// API configuration

Meteor.startup(() => {

  // first, remove configuration in case service is already configured
  ServiceConfiguration.configurations.remove({ service: "twitter" })

  // next, source the token data from the private folder
  const oAuth = JSON.parse(Assets.getText("oauth.json"))
  const twAuth = JSON.parse(Assets.getText("twit.json"))

  // then, add it to the service configuration
  ServiceConfiguration.configurations.insert(oAuth)

  // starting up twit api: https://github.com/ttezel/twit
  T = new Twit(twAuth)

  // can use the below call to ensure the twit API is configured OK.
  //T.get("users/lookup", { screen_name: "Cal" }, function(err, res) { console.log(res) })
})


// Server methods

Meteor.methods({
  query: function (q, opts) {

    // debugging queries
    console.log("server:", q, opts)

    // sync version of our API async func
    var syncT = Meteor.wrapAsync(T.get, T)

    // call sync fn with params
    var result = syncT(q, opts)
    return result

  },
})
