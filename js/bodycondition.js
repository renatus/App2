//Controller to work with activities
app.controller('bodyconditionsController', function ($scope, $rootScope, $q, $routeParams, indexedDBexo, UUID4, bodyconditionService) {
    //Get all entries from $rootScope and put them to $scope object to use all AngularJS goodness (not always possible with $rootScope)
    $scope.bodycondition = $rootScope.exo.bodycondition;



    //Method to add new Body Condition report entry to $scope and DB
    $scope.addEntry = function(bodycondition){
        console.log(bodycondition.temperature);
        bodyconditionService.save(bodycondition);
    }

});



//Service to work with Body condition reports data
app.service('bodyconditionService', function($rootScope, indexedDBexo, UUID4, userInterface, backendSync){

    //Method to save position to AngularJS model, and to IndexedDB
    this.save = function(bodycondition){
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
        var curDateTime = new Date();
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
        if (angular.isNumber(bodycondition.temperature)) {
            var temperature = (bodycondition.temperature).toPrecision(21);;
        } else {
            var temperature = "";
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
            //like 36.3. (Number)
            "temperature":temperature,
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
        indexedDBexo.addEntry(newEntry, "bodyconditions").then(function(){
            console.log('Check-in saved to DB!');

            //Add new entry to $rootScope
            $rootScope.exo.bodyconditions.push(newEntry);

            //If we're connected to the internet
            //navigator.onLine will always return True at desktop Linux, and at Chrome for Android
            if (navigator.onLine) {
                //Sync new or modified data to backend
                backendSync.bodyconditions(entryID);
            }

            //Create text message to notify user about successfull check-in
            var alertBody = "You've added Body condition report successfully!";

            //Notify user about successfull check-in
            userInterface.alert(alertBody);
        });
    }
});
