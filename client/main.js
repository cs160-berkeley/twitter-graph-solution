import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import './main.html';

// Session default
Session.setDefault("users", [])


// Main events
Template.main.onRendered(function() {
  console.log("page rendered!")
})

Template.main.helpers({
  userID() {
    return Meteor.user().services.twitter.id
  },

  sName() {
    return Meteor.user().services.twitter.screenName
  },

  ulink() {
    return "https://twitter.com/" + Meteor.user().services.twitter.screenName
  },

  users() {
    return Session.get("users")
  },
});

Template.main.events({
  'click button#submit'(e) {
    let tId = Meteor.user().services.twitter.id

    Meteor.call("query", "users/show", { user_id: tId }, function(err, result) {
      if (err)
        console.warn(err)

      else { // get the current user profile
        pushUser(result)

        // get full friends objects for the current user, until we hit the API limit
        Meteor.call("query", "friends/list", { user_id: tId, count: 15   }, getUserFriends)
      }
    })

    // save users friends, find their friends
    function getUserFriends (err, result) {
      if (err)
        console.warn(err)
      else {
        result.users.map(pushUser)
        var users = Session.get("users")
        users.map(setFriends)
      }
    }

    // Helper function
    function pushUser(user) {
      var users = Session.get("users")
      if (users.findIndex(u => u.id_str == user.id_str ) == -1) {
        users.push(user) // returns length!
        Session.set("users", users)
      }
    }

    // Setting friends field - Careful, since this will be called once/per
    // count specified in the total user count + 1 (for the current users)
    function setFriends(user, i) {
      var users = Session.get("users")
      if (users[i]["friend_ids"])
        return // don't re-query

      Meteor.call("query", "friends/ids", { screen_name: user.screen_name }, function(err, result) {
        if (err)
          console.warn(err)
        else { // get friend ids
          var users = Session.get("users")
          users[i]["friend_ids"] = result.ids
          Session.set("users", users)
        }
      })
    }

  },

  'click button#view'(e) { // reset
    console.log("building view")

    var users = Session.get("users"),
      json = {}

    // have users, generate the viz
    console.log("we have users now")
    json.nodes = filterNodes(users)
    json.links = filterLinks(users)

    // triggers viz#autorun
    Session.set("json", json)
    console.log(json)

    // Helper function - filter data on node (only retain link, name and uid).
    function filterNodes(users) {
      return users.map(function(u) {
        console.log(u)
        return {
          color: u.profile_link_color,
          name: u.screen_name,
          uid: u.id_str,
        }
      })
    }

    // Helper function - construct links between followers.
    function filterLinks(users) {
      return users.map(function(u, i) { // for each user

        u.friend_ids = u.friend_ids || [] // default -> empty array

        // Iterate over each of this user's friend_ids, seeing if they follow
        // any of the other users that we have recieved data for.
        return u.friend_ids.map(function(uid) { // for each friend
          return {
            target: uid2index(users, uid),
            source: i,
            weight: 1,
          }
        }).filter(function(u) { // remove if not friend (target not found)
          return u && u.target !== -1
        })

      }).reduce(function(a, b) { // flatten arrays into [Hash, Hash, ...]
        return a.concat(b);
      }, []);
    }

    // Helper function - map from a twitter userID to their ID in [nodes]
    function uid2index (users, uid) {
      return users.findIndex(u => u.id === uid)
    }

    function unDef(x) {
      return typeof x == 'undefined'
    }
  },

  'click button#erase'(e) { // reset
    console.log("user data reset")
    Session.set("users", [])
  },
});


// Friends setup
Template.user.helpers({
  uName() {
    return this.name
  },

  uLink() {
    return "https://twitter.com/" + this.screen_name
  },

  uStatus() {
    return this.status.text
  },
})

