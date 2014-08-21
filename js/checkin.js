//Controller to work with Geolocation
app.controller('checkinController', function ($rootScope, $scope, $q, indexedDBexo, UUID4, positionService) {

    //Get all entries from $rootScope and put them to $scope object
    $scope.checkins = $rootScope.exo.checkins;



    //Add new Checkin entry to $scope and DB
    //You can get user-entered field value without passing object to function with construction like $scope.activity.title
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
app.service('positionService', function($rootScope, $q, indexedDBexo, UUID4, userInterface, positionBackendService){

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



    //Method to save position
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
        //Phone-provided time can be wrong or obsolete (position request process can be long), use GPS-provided time
        var curTimestamp = position.timestamp;
        var curDate = moment(curDateTime).format('YYYY-MM-DD');
        var curTime = moment(curDateTime).format('HH:mm:ss');
        //Determine the time zone of the browser client, jstz.min.js required
        var timeZone = jstz.determine();
        var timeZoneName = timeZone.name();
        //.getTimezoneOffset() will return result in minutes, Drupal uses seconds
        var timeZoneOffset = curDateTime.getTimezoneOffset() * 60;


        //IndexedDB may save all JS data atypes, but for now we shouldn't put inappropriate values, like NULL, at app DB
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

            //Add new entry to $scope
            $rootScope.exo.checkins.push(newEntry);
            console.log($rootScope.exo.checkins);

            //If we're connected to the internet
            //navigator.onLine will always return True at desktop Linux, and at Chrome for Android
            if (navigator.onLine) {
                //Sync new or modified data to backend
                positionBackendService.syncTo(entryID);
            }
        });

        //Create text message to notify user about successfull check-in
        var alertBody = "You've checked-in successfully! " + '\n' +
        'Latitude: '          + position.coords.latitude          + '\n' +
        'Longitude: '         + position.coords.longitude         + '\n' +
        'Altitude: '          + position.coords.altitude          + '\n' +
        'Accuracy: '          + position.coords.accuracy          + '\n' +
        'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
        'Heading: '           + position.coords.heading           + '\n' +
        'Speed: '             + position.coords.speed             + '\n' +
        'Timestamp: '         + position.timestamp                + '\n' +
        'Measurement time: '  + curDateTime                       + '\n' +
        'Current time: '      + new Date()                        + '\n';

        //Notify user about successfull check-in
        userInterface.alert(alertBody);
    }



    //Method to test GPS sensor
    this.test = function(position){
        //Get current Date, Time, Timestamp and Timezone
        var curDateTime = new Date(position.timestamp);

        //Create text message to notify user about successfull check-in
        var alertBody = "GPS works fine! " + '\n' +
        'Latitude: '          + position.coords.latitude          + '\n' +
        'Longitude: '         + position.coords.longitude         + '\n' +
        'Altitude: '          + position.coords.altitude          + '\n' +
        'Accuracy: '          + position.coords.accuracy          + '\n' +
        'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
        'Heading: '           + position.coords.heading           + '\n' +
        'Speed: '             + position.coords.speed             + '\n' +
        'Timestamp: '         + position.timestamp                + '\n' +
        'Measurement time: '  + curDateTime                       + '\n' +
        'Current time: '      + new Date()                        + '\n';

        //Notify user about successfull check-in
        userInterface.alert(alertBody);
    }

});



//Service to sync checkin to backend
//We need it because we can't call service method from the method of this very same service, so we need two services
app.service('positionBackendService', function($rootScope, $q, indexedDBexo, backend){
    //Sync checkin to IS backend
    this.syncTo = function(UUID){

        //Example of data to send to IS to create or modify Drupal node:
        //'node[type]=activity&node[language]=en&node[title]=' + encodeURIComponent(title) +
        //'node[field_datetime][und][0][value][date]=' + curDate +
        //'&node[field_datetime][und][0][value][time]=' + curTime;

        //Get Checkin entry from DB
        indexedDBexo.getEntry("checkins", UUID).then(function(data){

            //0
            var retrievedObj = data['0'];
            //Will show us all objects we've get - at Chrome DevTools console
            console.log(retrievedObj);


            //Put all data to send to IS to modify Drupal node at this variable
            //In case Drupal Date field already has both start and end values stored, you have to send both value and value2
            //Looks like at least Decimal fields will accept emty values, like this:
            //&node[field_altitude][und][0][value]=&node[field_altitude_accuracy][und][0][value]=
            //So we can not to check whether value is here
            //Attempt to save more digits, than allowed by Drupal Field's Scale setting will give us error
            //We can put more digits, than specified in Scale setting, though, so we've to limit number of all digits in decimal number
            //We'll get error trying to limit empty value, so we've limited all numbers while adding them to app DB (it improved consistency as well)
            var dataToSend = 'node[type]=check_in&node[language]=en&node[title]=' + encodeURIComponent("Check-in") +
                             '&node[field_place_latlon][und][0][lat]=' + data['0']['latitude'] +
                             '&node[field_place_latlon][und][0][lon]=' + data['0']['longitude'] +
                             '&node[field_latlon_accuracy][und][0][value]=' + data['0']['latLonAccuracy'] +
                             '&node[field_altitude][und][0][value]=' + data['0']['altitude'] +
                             '&node[field_altitude_accuracy][und][0][value]=' + data['0']['altitudeAccuracy'] +
                             '&node[field_heading][und][0][value]=' + data['0']['heading'] +
                             '&node[field_speed][und][0][value]=' + data['0']['speed'] +
                             '&node[field_datetime_start][und][0][value][date]=' + data['0']['date'] +
                             '&node[field_datetime_start][und][0][value][time]=' + data['0']['time'] +
                             '&node[field_datetime_start][und][0][timezone][timezone]=' + data['0']['dateTimeTZ'];

            var URLpart = "/rest/node.json";
            var entryUUID = data['0']['UUID'];

            //Try to edit backend node
            //Theoretically you can use CSRF token multiple times, but this gave error: 401 (Unauthorized: CSRF validation failed)
            var backendURL = window.localStorage.getItem("backendURL");
            backend.getServicesToken(backendURL).then(function(servicesToken){
                backend.editBackendNode(entryUUID, dataToSend, URLpart).then(function(data){
                    if (data === "success") {
                        //
                        retrievedObj["lastUpdatedLocally"] = "";

                        //Modify Checkin entry at DB
                        indexedDBexo.addEntry(retrievedObj, "checkins").then(function(data){
                            console.log(data);
                        });

                        //Update entry at $rootScope
                        //.some will iterate through all array elements
                        //.some can be stopped by return keyword, and angular.forEach (or native .forEach) - can't
                        $rootScope['exo']['checkins'].some(function(value, index, array){
                            //If edited entry UUID is equal to found entry UUID
                            if (value['uuid'] == retrievedObj['uuid']){
                                //Update entry at $rootScope
                                $rootScope.exo.checkins[index] = angular.copy(retrievedObj);
                                //Stop searching through all $rootScope entries
                                return;
                            }
                        });

                        console.log("You've created/updated backend entry successfully");
                    } else {
                        console.log("You've failed to create/update backend entry");
                    }
                });
            });


        });

    }
});
