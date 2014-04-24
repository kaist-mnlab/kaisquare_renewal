var mongoose = require('mongoose');
var LectureSchema = require('../models/Lecture.js').LectureSchema;

var Lecture = mongoose.model('lectures', LectureSchema);

module.exports = {

	// JSON API for list of Courses
	list : function(req, res) {
		// Query Mongo for Courses, just get back the question text
		console.log("lecture list");
		
		Lecture.find({}, {},{}, function(error, lectures) {
			
			res.json(lectures);
		});
	},
	
	// JSON API for getting a single Course
	lecture : function(req, res) {
		// Course ID comes in the URL
		var lectureId = req.params.id;
		console.log("lecture read");
		// Find the Course by its ID, use lean as we won't be changing it
		Lecture.findById(lectureId, '', { lean: true }, function(err, lecture) {
			if(lecture) {
				//save course content
		
				res.json(lecture);
			} else {
				res.json({error:true});
			}
		});
	},
	
	// JSON API for creating a new poll
	create : function(req, res) {
		console.log("save");
		var reqBody = req.body,
				// Filter out choices with empty text
				//choices = reqBody.choices.filter(function(v) { return v.text != ''; }),
				// Build up Course object to save
				lectureObj = {title: reqBody.title, 
							 description: reqBody.description,
							 status: reqBody.status,
							 course: reqBody.course,
							 };

		
		// Create Course model from built up Course object
		var lecture = new Lecture(lectureObj);
		
		// Save Course to DB
		if(reqBody._id === undefined){
			lecture.save(function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
		} else {
			Lecture.findByIdAndUpdate(reqBody._id , lectureObj, function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
		}
		
	},

	delete : function(req, res) {
		Lecture.findByIdAndRemove(req.query.id, function(err, doc) {
				if(err || !doc) {
					throw 'Error';
				} else {
					res.json(doc);
				}		
			});
			
	},
	
	

};
