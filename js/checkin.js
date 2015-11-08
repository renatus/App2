//Controller to work with Geolocation
app.controller('checkinController', function ($rootScope, $scope, $mdDialog, positionService) {

    //Get all entries from $rootScope and put them to $scope object to use all AngularJS goodness (not always possible with $rootScope)
    $scope.checkins = $rootScope.exo.checkins;



    //Method to add new Checkin entry to $scope and DB
    $scope.addEntry = function(){
        //Get current position
        positionService.get().then(function(position){
            //Save current position
            positionService.save(position);
            console.log(position);
        });
    }



    //Test GPS sensor
    $scope.testGPS = function(){
        //Get current position
        positionService.get().then(function(position){
            //Show message with geolocation data
            positionService.test(position);
            console.log(position);
        });
    }

});



//Service to work with Geolocation data
app.service('positionService', function($rootScope, $q, indexedDBexo, UUID4, userInterface, backendSync){

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
            //enableHighAccuracy option enables GPS usage (otherwise location will be calculated based on WiFi and cells signal only)
            //maximumAge option tells, is it possible to use previously acquired location (and how old it may be)
            //timeout option sets time period, after that device will give up trying to find it's position
            //maximumAge and timeout values are in milliseconds
        }, {enableHighAccuracy: true, maximumAge: 20000, timeout: 60000});

        return deferred.promise;
    }



    //Method to save position to AngularJS model, and to IndexedDB
    this.save = function(position){
        //Date, Time and Timezone format examples:
        //var curDate = "2013-05-30";
        //var curTime = "23:00";
        //var timeZoneName = "Europe/Moscow";

        //Usually timestamp is at seconds, and JavaScript works with milliseconds
        //So we have to multiply timestamp value by 1000, but with position.timestamp we don't have to do that
        //Date and time from GPS can be wrong in Android emulator, that's OK.
        //Drupal Date (and hence Services) module can't handle ISO 8601-formatted dates, but Views module can
        //So for now we'll use such dates as "2013-12-07 00:00:00", and in future - such as "1997-07-16T19:20+01:00"
        //Get current Date, Time, Timestamp and Timezone
        var curDateTime = new Date(position.timestamp);
        //Device-provided time can be wrong or obsolete (position request process can be long), use GPS-provided time
        var curTimestamp = position.timestamp;
        var curDate = moment(curDateTime).format('YYYY-MM-DD');
        var curTime = moment(curDateTime).format('HH:mm:ss');
        //Determine the time zone of the browser client, jstz.min.js required
        var timeZone = jstz.determine();
        //Determine time zone name
        var timeZoneName = timeZone.name();
        //.getTimezoneOffset() will return result in minutes, Drupal uses seconds
        var timeZoneOffset = curDateTime.getTimezoneOffset() * 60;


        //IndexedDB may save all JS data types, but for now we shouldn't put inappropriate values, like NULL, to app DB
        //So we can't put geolocation object directly to DB, we should check it's properties first
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
        //For performance reasons, simple entry types should not support revisions and different languages
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
            //Backend URL probably should not be synced to backend, as it knows it's URL
            //It should be used on client to sync to right backend
            "backendURL":window.localStorage.getItem("backendURL"),
            "createdTimeStamp": curTimestamp,
            "modifiedTimeStamp": curTimestamp,
            //Looks like we should not bother about timezone here
            //Mark entry as updated locally, by putting in last update timestamp
            "lastUpdatedLocally":moment(curDateTime).format('X')
		};

        //Add new entry to DB
        indexedDBexo.addEntry(newEntry, "checkins").then(function(){
            console.log('Check-in saved to DB!');

            //Add new entry to $rootScope
            $rootScope.exo.checkins.push(newEntry);

            //If we're connected to the internet
            //navigator.onLine will always return True at desktop Linux, and at Chrome for Android
            if (navigator.onLine) {
                //Sync new or modified data to backend
                backendSync.checkins(entryID);
            }

            //Create text message to notify user about successfull check-in
            var alertTitle = "You've checked-in successfully!";
            var alertBody = '' +
            // 'Latitude: '          + position.coords.latitude          + '\n' +
            '<p>Latitude: '          + position.coords.latitude          + '</p>' +
            '<p>Longitude: '         + position.coords.longitude         + '</p>' +
            '<p>Altitude: '          + position.coords.altitude          + '</p>' +
            '<p>Accuracy: '          + position.coords.accuracy          + '</p>' +
            '<p>Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '</p>' +
            '<p>Heading: '           + position.coords.heading           + '</p>' +
            '<p>Speed: '             + position.coords.speed             + '</p>' +
            '<p>Timestamp: '         + position.timestamp                + '</p>' +
            '<p>Measurement time: '  + curDateTime                       + '</p>' +
            '<p>Current time: '      + new Date()                        + '</p>';

            //Notify user about successfull check-in
            //alertTitle, alertButton, alertBody
            userInterface.alert(alertTitle, "Ok", alertBody);
        });
    }



    //Method to test GPS sensor
    this.test = function(position){
        //Get current Date, Time, Timestamp and Timezone from GPS
        var curDateTime = new Date(position.timestamp);

        //Create text message to notify user about successfull check-in
        var alertTitle = "GPS works fine!";
        var alertBody = '' +
        '<p>Latitude: '          + position.coords.latitude          + '</p>' +
        '<p>Longitude: '         + position.coords.longitude         + '</p>' +
        '<p>Altitude: '          + position.coords.altitude          + '</p>' +
        '<p>Accuracy: '          + position.coords.accuracy          + '</p>' +
        '<p>Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '</p>' +
        '<p>Heading: '           + position.coords.heading           + '</p>' +
        '<p>Speed: '             + position.coords.speed             + '</p>' +
        '<p>Timestamp: '         + position.timestamp                + '</p>' +
        '<p>Measurement time: '  + curDateTime                       + '</p>' +
        '<p>Current time: '      + new Date()                        + '</p>';

        //Notify user about successfull check-in
        //alertTitle, alertButton, alertBody
        userInterface.alert(alertTitle, "Ok", alertBody);
    }

});
