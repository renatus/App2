//Controller to work with GPS
app.controller('checkinController', function ($scope, $q, indexedDBexo, UUID4, positionService) {

    //Add new Checkin entry to $scope and DB
    //You can get user-entered field value without passing object to function with construction like $scope.activity.title
    $scope.addEntry = function(){
        var curTimestamp = new Date().getTime();
        //Get universally unique identifier for a new entry
        var entryID = UUID4.generate();

        //Get current position
        positionService.get().then(function(position){
            //Save current position
            positionService.save(position);
            console.log(position);
        });
    }

});



//Service to work with Geolocation data
app.service('positionService', function($q, indexedDBexo, UUID4){

    //Method to get current position
    this.get = function(){
        var deferred = $q.defer();

        //Get current position
        window.navigator.geolocation.getCurrentPosition(function(data) {
            //If position acquered successfully, return position
            deferred.resolve(data);
        }, function(error) {
            //If we've failed to get position, return error
            deferred.reject(error);
        });

        return deferred.promise;
    }



    //Method to save position
    this.save = function(position){
        //Date, Time and Timezone format examples:
        //var curDate = "2013-05-30";
        //var curTime = "23:00";
        //var timeZoneName = "Europe/Moscow";

        //Usually timestamp is at seconds, and JavaScript works with milliseconds
        //So we have to multiply timestamp value by 1000, but with position.timestamp we don't have to do that
        //Date and time from GPS can be wrong in Android emulator, that's OK.
        //Date (and hence Services) module can't handle ISO 8601-formatted dates, but Views module can
        //So for now we'll use such dates as "2013-12-07 00:00:00", and in future - such as "1997-07-16T19:20+01:00"
        //Get current Date, Time, Timestamp and Timezone
        var curDateTime = new Date(position.timestamp);
        var curTimestamp = position.timestamp;
        var curDate = moment(curDateTime).format('YYYY-MM-DD');
        var curTime = moment(curDateTime).format('HH:mm:ss');
        //Determine the time zone of the browser client, jstz.min.js required
        var timeZone = jstz.determine();
        var timeZoneName = timeZone.name();
        //.getTimezoneOffset() will return result in minutes, Drupal uses seconds
        var timeZoneOffset = curDateTime.getTimezoneOffset() * 60;


        //We should not put inappropriate values, like NULL, at app DB
        //So we can't put geolocation object properties directly to DB, we should check them first
        //NULL and other non-numeric values should be replaced by an empty field

        //Attempt to save more digits, than allowed by Drupal Field's Scale setting will give us error
        //We can put more digits, than specified in Scale setting, though, so we've to limit number of all digits in decimal number
        //.toPrecision(13) will round number to 13 digits, it will return string rather than number
        //ECMA-262 requires .toPrecision() precision of up to 21 digits, and Chrome 32 can get arguments between 1 and 21 (Firefox 26 - between 1 and 100)
        //Switch to .toPrecision(32) in the future, as backend can store up to 32 digits for latLonAccuracy, altitude, altitudeAccuracy and speed
        if (angular.isNumber(position.coords.latitude)) {
            var coordsLatitude = position.coords.latitude;
        } else {
            var coordsLatitude = "";
        }

        if (angular.isNumber(position.coords.longitude)) {
            var coordsLongitude = position.coords.longitude;
        } else {
            var coordsLongitude = "";
        }

        if (angular.isNumber(position.coords.accuracy)) {
            var coordsAccuracy = (position.coords.accuracy).toPrecision(21);
        } else {
            var coordsAccuracy = "";
        }

        if (angular.isNumber(position.coords.altitude)) {
            var coordsAltitude = (position.coords.altitude).toPrecision(21);
        } else {
            var coordsAltitude = "";
        }

        if (angular.isNumber(position.coords.altitudeAccuracy)) {
            var coordsAltitudeAccuracy = (position.coords.altitudeAccuracy).toPrecision(21);
        } else {
            var coordsAltitudeAccuracy = "";
        }

        if (angular.isNumber(position.coords.heading)) {
            var coordsHeading = (position.coords.heading).toPrecision(13);
        } else {
            var coordsHeading = "";
        }

        if (angular.isNumber(position.coords.speed)) {
            var coordsSpeed = (position.coords.speed).toPrecision(21);
        } else {
            var coordsSpeed = "";
        }

        //Get universally unique identifier for a new entry
        var entryID = UUID4.generate();



        //Create entry object
        //For performance reasons, simple entry types do not support revisions and different languages
        var newEntry = {
            "uuid":entryID,
            "date":curDate,
            "time":curTime,
            "dateTimeTimestamp":curTimestamp,
            "dateTimeTZ":timeZoneName,
            "dateTimeOffset":timeZoneOffset,
            //like 55.58175515 Latitude in decimal degrees. (Number)
            "latitude":coordsLatitude,
            //like 37.67745413 Longitude in decimal degrees. (Number)
            "longitude":coordsLongitude,
            //like 17 Accuracy level of the latitude and longitude coordinates in meters. (Number)
            "latLonAccuracy":coordsAccuracy,
            //like 202.3000030517578 Height of the position in meters above the ellipsoid. (Number)
            "altitude":coordsAltitude,
            //like null Accuracy level of the altitude coordinate in meters. (Number)
            "altitudeAccuracy":coordsAltitudeAccuracy,
            //like 84.80000305175781 Direction of travel, specified in degrees counting clockwise relative to the true north. (Number)
            "heading":coordsHeading,
            //like 1 Current ground speed of the device, specified in meters per second. (Number)
            "speed":coordsSpeed,
            "createdTimeStamp": curTimestamp,
            "modifiedTimeStamp": curTimestamp,
            //Looks like we should not bother about timezone here
            //Mark entry as updated locally, by putting in last update timestamp
            "lastUpdatedLocally":moment(curDateTime).format('X')
		};

        //Add new entry to DB
        indexedDBexo.addEntry(newEntry, "checkins").then(function(){
            console.log('Check-in saved to DB!');
        });

	alert("You've checked-in successfully! " +
          'Latitude: '          + position.coords.latitude          + '\n' +
          'Longitude: '         + position.coords.longitude         + '\n' +
          'Altitude: '          + position.coords.altitude          + '\n' +
          'Accuracy: '          + position.coords.accuracy          + '\n' +
          'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
          'Heading: '           + position.coords.heading           + '\n' +
          'Speed: '             + position.coords.speed             + '\n' +
          'Timestamp: '         + position.timestamp                + '\n' +
          'Measurement time: '  + curDateTime                       + '\n' +
          'Current time: '      + new Date()                        + '\n');
    }

});
