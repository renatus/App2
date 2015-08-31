//Controller to work with Body condition reports
app.controller('bodyconditionsController', function ($scope, $rootScope, bodyconditionService) {
    //Get all entries from $rootScope and put them to $scope object to use all AngularJS goodness (not always possible with $rootScope)
    $scope.bodycondition = $rootScope.exo.bodycondition;



    //Method to add new Body Condition report entry to $scope and DB
    $scope.addEntry = function(bodycondition){
        bodyconditionService.save(bodycondition);

        //Clean form from now saved user-entered data
        this.bodycondition = {};
        //Remove CSS classes indicating the fact that user interacted with form
        this.bodycondition.$setPristine();
        this.bodycondition.$setUntouched();
    }

});



//Service to work with Body condition reports data
app.service('bodyconditionService', function($rootScope, indexedDBexo, UUID4, userInterface, backendSync){

    //Method to save Body condition to AngularJS model, and to IndexedDB
    this.save = function(bodycondition){

        //Drupal Date (and hence Services) module can't handle ISO 8601-formatted dates, but Views module can
        //So for now we'll use such dates as "2013-12-07 00:00:00", and in future - such as "1997-07-16T19:20+01:00"
        //Get current Date, Time, Timestamp and Timezone
        var curDateTime = new Date();
        //Unix timestamp, like "1408993213"
        var curTimestamp = moment(curDateTime).format('X');
        //Like "2013-05-30"
        var curDate = moment(curDateTime).format('YYYY-MM-DD');
        //Like "23:00:15"
        var curTime = moment(curDateTime).format('HH:mm:ss');
        //Determine the time zone of the browser client, jstz.min.js required
        var timeZone = jstz.determine();
        //Determine time zone name, like "Europe/Moscow"
        var timeZoneName = timeZone.name();
        //.getTimezoneOffset() will return result in minutes, Drupal uses seconds
        //Like "-14400"
        var timeZoneOffset = curDateTime.getTimezoneOffset() * 60;


        //IndexedDB may save all JS data types, but for now we shouldn't put inappropriate values, like NULL, to app DB
        //So we can't put Body condition object directly to DB, we should check it's properties first
        //NULL and other non-numeric values should be replaced by an empty field

        //Attempt to save more digits, than allowed by Drupal Field's Scale setting will give us error
        //We can put more digits, than specified in Scale setting, though, so we've to limit number of all digits in decimal number
        //.toPrecision(13) will round number to 13 digits, it will return string rather than number
        //ECMA-262 requires .toPrecision() precision of up to 21 digits, and Chrome 32 can get arguments between 1 and 21 (Firefox 26 - between 1 and 100)

        //If body temperature value is numerical
        if (angular.isNumber(bodycondition.temperature)) {
            var temperature = (bodycondition.temperature).toPrecision(6);
        } else {
            var temperature = "";
        }

        if (angular.isNumber(bodycondition.bloodPressureMax)) {
            var bloodPressureMax = (bodycondition.bloodPressureMax).toPrecision(6);
        } else {
            var bloodPressureMax = "";
        }

        if (angular.isNumber(bodycondition.bloodPressureMin)) {
            var bloodPressureMin = (bodycondition.bloodPressureMin).toPrecision(6);
        } else {
            var bloodPressureMin = "";
        }

        if (angular.isNumber(bodycondition.pulse)) {
            var pulse = (bodycondition.pulse).toPrecision(6);
        } else {
            var pulse = "";
        }

        if (angular.isNumber(bodycondition.mass)) {
            var mass = (bodycondition.mass).toPrecision(10);;
        } else {
            var mass = "";
        }

        if (angular.isNumber(bodycondition.height)) {
            var height = (bodycondition.height).toPrecision(10);
        } else {
            var height = "";
        }

        if (angular.isNumber(bodycondition.bloodSugar)) {
            var bloodSugar = (bodycondition.bloodSugar).toPrecision(6);
        } else {
            var bloodSugar = "";
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
            //like 36.3 (number)
            "temperature":temperature,
            //like 120 (number)
            "bloodPressureMax":bloodPressureMax,
            //like 80 (number)
            "bloodPressureMin":bloodPressureMin,
            //like 60 (number)
            "pulse":pulse,
            //like 70000 (number, gram)
            "mass":mass,
            //like 1800 (number, mm)
            "height":height,
            //like 4.5 (number, mmol/L)
            "bloodSugar":bloodSugar,
            //Backend URL probably should not be synced to backend, as it knows it's URL
            //It should be used on client to sync to right backend
            "backendURL":window.localStorage.getItem("backendURL"),
            //Unix timestamp, like "1408993213"
            "createdTimeStamp": curTimestamp,
            //Unix timestamp, like "1408993213"
            "modifiedTimeStamp": curTimestamp,
            //Mark entry as updated locally, by putting in last update timestamp
            //Looks like we should not bother about timezone here
            //Unix timestamp, like "1408993213"
            "lastUpdatedLocally":curTimestamp
		};

        //Add new entry to DB
        indexedDBexo.addEntry(newEntry, "bodyconditions").then(function(){
            console.log('Body condition report saved to DB!');

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
