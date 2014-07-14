'use strict';

define(['angular',
        'poll/poll.controller', 'poll/poll.service',
        ], function(angular) {

angular.module('poll', ['poll.controller', 'poll.service']);

});
