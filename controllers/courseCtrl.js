var mongoose = require('mongoose');
var CourseSchema = require('../models/Course.js').CourseSchema;

var Course = mongoose.model('courses', CourseSchema);

module.exports = {

	// JSON API for list of Courses
	list : function(req, res) {
		// Query Mongo for Courses, just get back the question text
		Course.find({}, {},{}, function(error, courses) {

			res.json(courses);
		});
	},
	
	// JSON API for getting a single Course
	course : function(req, res) {
		// Course ID comes in the URL
		var courseId = req.params.id;
		
		// Find the Course by its ID, use lean as we won't be changing it
		Course.findById(courseId, '', { lean: true }, function(err, course) {
			if(course) {
				//save course content
		
				res.json(course);
			} else {
				res.json({error:true});
			}
		});
	},
	
	// JSON API for creating a new poll
	create : function(req, res) {
		
		var reqBody = req.body,
				// Filter out choices with empty text
				//choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
				// Build up Course object to save
				courseObj = {title: reqBody.title, 
							 abstract: reqBody.abstract,
							 description: reqBody.description,
							 hidden: reqBody.hidden,
							 users: reqBody.users,
							 };

		console.log(courseObj.users);
		
		// Create Course model from built up Course object
		var course = new Course(courseObj);
		
		// Save Course to DB
		if(reqBody._id === undefined){
			course.save(function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
		} else {
			Course.findByIdAndUpdate(reqBody._id , courseObj, function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
		}
		
	},

	delete : function(req, res) {
		Course.findByIdAndRemove(req.query.id, function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
			
	},
	
	

};
