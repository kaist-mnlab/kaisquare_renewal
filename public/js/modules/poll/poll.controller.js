'use strict';

/* Controllers */
define(['angular'], function(angular) {
angular.module('poll.controller', [])
//app
.controller('PollListCtrl',
['$rootScope', '$scope', 'Poll', function($rootScope, $scope, Poll) {

	$scope.polls = Poll.query();
}]);


//app
angular.module('poll.controller')
.controller('PollItemCtrl',
['$scope', '$stateParams', 'socket', 'Poll', function($scope, $stateParams, socket, Poll) {


	$scope.poll = Poll.get({pollId: $stateParams.pollId});

	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $stateParams.pollId) {
			$scope.poll = data;
		}
	});
	
	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $stateParams.pollId) {
			$scope.poll.choices = data.choices;
			$scope.poll.totalVotes = data.totalVotes;
		}		
	});
	
	$scope.vote = function() {
		var pollId = $scope.poll._id,
				choiceId = $scope.poll.userVote;
		
		if(choiceId) {
			var voteObj = { poll_id: pollId, choice: choiceId };
			socket.emit('send:vote', voteObj);
		} else {
			alert('You must select an option to vote for');
		}
	};
}]);

//app
angular.module('poll.controller')
.controller('PollNewCtrl',
['$scope', '$location','Poll', function($scope, $location, Poll) {
// Define an empty poll model object
	$scope.poll = {
		question: '',
		choices: [ { text: '' }, { text: '' }, { text: '' }]
	};
	
	// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.poll.choices.push({ text: '' });
	};
	
	// Validate and save the new poll to the database
	$scope.createPoll = function() {
		var poll = $scope.poll;
		// Check that a question was provided
		if(poll.question.length > 0) {
			var choiceCount = 0;
			
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = poll.choices.length; i < ln; i++) {
				var choice = poll.choices[i];
				
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
		
			if(choiceCount > 1) {
				// Create a new poll from the model
				var newPoll = new Poll(poll);
				
				// Call API to save poll to the database
				newPoll.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						$location.path('/polls');
					} else {
						alert('Could not create poll');
					}
				});
			} else {
				alert('You must enter at least two choices');
			}
		} else {
			alert('You must enter a question');
		}
	};
}]);


});