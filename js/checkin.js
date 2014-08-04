//checkinM is a module to handle check-ins
var checkinMod = angular.module('checkinM', ['exoApp']);



//Controller to work with activities
app.controller('checkinController', function ($scope, $q, indexedDBexo, UUID4, getPosition) {

    //Add new activity entry to $scope and DB
    //You can get user-entered field value without passing object to function with construction like $scope.activity.title
    $scope.addEntryl = function(){
        var curTimestamp = new Date().getTime();
        //Get universally unique identifier for a new entry
        var entryID = UUID4.generate();

        getPosition.current().then(function(position){
            console.log(position);
        });

        //Create entry object
        //For performance reasons, simple entry types do not support revisions and different languages
        var newEntry = {
            "uuid": entryID,
            "createdTimeStamp": curTimestamp,
            "modifiedTimeStamp": curTimestamp
		};

        //Add new entry to DB
        indexedDBexo.addEntry(newEntry, "checkins").then(function(){
            console.log('Check-in saved to DB!');
        });

        //Add new entry to $scope
        $scope.activities.push(newEntry);
    }

});



//Service to get device position
app.service('getPosition', function($q){

    //Get current position
    this.current = function(){
        var deferred = $q.defer();

        window.navigator.geolocation.getCurrentPosition(function(data) {
            //Return position
            deferred.resolve(data);
        }, function(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    }

});
