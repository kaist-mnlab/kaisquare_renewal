var mongoose = require('mongoose');
var LectureSchema = require('../models/Lecture.js').LectureSchema;

var Lecture = mongoose.model('lectures', LectureSchema);

module.exports = {

	// JSON API for list of Courses
	list : function(req, res) {
		// Query Mongo for Courses, just get back the question text
		console.log(req.query);
		var query = {};
		if(req.query !== undefined && req.query)
			query = req.query;
		
		Lecture.find(query, {},{}, function(error, lectures) {
			
			res.json(lectures);
		});
	},
	
	// JSON API for getting a single Course
	lecture : function(req, res) {
		// Course ID comes in the URL
		var lectureId = req.params.id;
	
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

		var reqBody = req.body,
				// Filter out choices with empty text
				// Build up Course object to save
				lectureObj = {title: reqBody.title, 
							 description: reqBody.description,
							 status: reqBody.status,
							 date: reqBody.date,
							 course: reqBody.course,
							 vod_url: reqBody.vod_url,
							 ppt_page: reqBody.ppt_page,
							 duration: reqBody.duration,
							 presentation_url: reqBody.presentation_url,
							 material_url: reqBody.material_url,
							 ppt_event_log: reqBody.ppt_event_log,
							 };
		
		console.log("lectureCtrl.create: " + req.files);
		
		
		// Create Course model from built up Course object
		var lecture = new Lecture(lectureObj);
		if(req.files !== undefined)
			lecture.set('video.file', req.files.video);
		// Save Course to DB
		if(reqBody._id === undefined){
			lecture.save(function(err, doc) {
				if(err || !doc) {
					console.log(err);
					//throw 'new Error';
				} else {
					res.json(doc);
				}		
			});
		} else {
			Lecture.findByIdAndUpdate(reqBody._id , lectureObj, function(err, doc) {
				if(err || !doc) {
					console.log(err);
					//throw 'update Error';
				} else {
					res.json(doc);
				}		
			});
		}
		
	},

	delete : function(req, res) {
		Lecture.findByIdAndRemove(req.query.id, function(err, doc) {
				if(err || !doc) {
					console.log(err);
					//throw 'Error';
				} else {
					res.json(doc);
				}		
			});
			
	},
	
	

};
