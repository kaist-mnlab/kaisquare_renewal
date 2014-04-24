var _ =           require('underscore')
    , User =      require('../routes/authentication.js')
    , UserModel = require('../models/User')
    , userRoles = require('../models/accessCfg').userRoles;

module.exports = {
    index: function(req, res) {
    
    /*
        var users = User.findAll();
        _.each(users, function(user) {
            delete user.password;
            delete user.twitter;
            delete user.facebook;
            delete user.google;
            delete user.linkedin;
        });
        res.json(users);
        */
    },
    user : function(req, res) {
		// Course ID comes in the URL
		var userId = req.params.userId;

		// Find the Course by its ID, use lean as we won't be changing it
		UserModel.findById(userId, '', { lean: true }, function(err, user) {
			if(user) {
				//save course content
				res.json(user);
			} else {
				res.json({error:true});
			}
		});
	},
};