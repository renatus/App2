//Service to sync entries of particular types to backend
//We need it because we can't call service method from the method of this very same service, so we need two services
//Note that service method name should be the same, as collection method (like "checkins", "activities")
app.service('backendSync', function($rootScope, $q, indexedDBexo, backend){
    //<CODETAG:NewEntityType comment="While adding new entity type to app, add it's name here, alongside 'activities'">

    //Sync checkin entry to backend
    this.checkins = function(UUID){

        //Example of data to send to IS to create or modify Drupal node:
        //'node[type]=activity&node[language]=en&node[title]=' + encodeURIComponent(title) +
        //'node[field_datetime][und][0][value][date]=' + curDate +
        //'&node[field_datetime][und][0][value][time]=' + curTime;

        //Get Checkin entry from DB
        indexedDBexo.getEntry('checkins', UUID).then(function(data){

            //Put first of retrieved objects to variable. We retrieve object by UUID, so there should be just one object.
            var retrievedObj = data['0'];

            //Put all data to send to IS to modify Drupal node at this variable
            //In case Drupal Date field already has both start and end values stored, you have to send both value and value2
            //Looks like at least Decimal fields will accept empty values, like this:
            //&node[field_altitude][und][0][value]=&node[field_altitude_accuracy][und][0][value]=
            //So we don't have to check whether value is here
            //Attempt to save more digits, than allowed by Drupal Field's Scale setting will give us error
            //We can put more digits, than specified in Scale setting, though, so we've to limit number of all digits in decimal number
            //We'll get error trying to limit empty value, so we've limited all numbers while adding them to app DB
            var dataToSend = 'node[type]=check_in&node[language]=en&node[title]=' + encodeURIComponent('Check-in') +
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

            //Last part of the URL to create or update backend entry
            var URLpart = '/rest/node.json';
            //UUID of entry we're going to update
            var entryUUID = data['0']['UUID'];

            //Try to create or edit backend node
            //Theoretically you can use CSRF token multiple times, but this gave error: 401 (Unauthorized: CSRF validation failed)
            var backendURL = window.localStorage.getItem("backendURL");
            //Get and set Drupal Services token
            backend.getServicesToken(backendURL).then(function(servicesToken){
                //Initiate node creation
                backend.editBackendNode(entryUUID, dataToSend, URLpart).then(function(data){
                    //If creation was successfull
                    if (data === "success") {
                        //Mark local entry object as synced
                        retrievedObj["lastUpdatedLocally"] = "";

                        //And modify corresponding Checkin entry at DB
                        indexedDBexo.addEntry(retrievedObj, "checkins").then(function(data){
                            //console.log(data);
                        });

                        //Update entry at $rootScope model
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
                        //If creation was not successfull
                        console.log("You've failed to create/update backend entry");
                    }
                });
            });
        });
    }



    //Sync activity entry to backend
    this.activities = function(UUID){

    };



    //Sync activity entry to backend
    this.bodyconditions = function(UUID){

        //Get Checkin entry from DB
        indexedDBexo.getEntry('bodyconditions', UUID).then(function(data){

            //Put first of retrieved objects to variable. We retrieve object by UUID, so there should be just one object.
            var retrievedObj = data['0'];

            //Put all data to send to IS to modify Drupal node at this variable
            //In case Drupal Date field already has both start and end values stored, you have to send both value and value2
            //Looks like at least Decimal fields will accept empty values, like this:
            //&node[field_altitude][und][0][value]=&node[field_altitude_accuracy][und][0][value]=
            //So we don't have to check whether value is here
            //Attempt to save more digits, than allowed by Drupal Field's Scale setting will give us error
            //We can put more digits, than specified in Scale setting, though, so we've to limit number of all digits in decimal number
            //We'll get error trying to limit empty value, so we've limited all numbers while adding them to app DB
            var dataToSend = 'node[type]=body_condition&node[language]=en&node[title]=' + encodeURIComponent('Body condition report') +
                             '&node[field_body_temperature][und][0][value]=' + data['0']['temperature'] +
                             '&node[field_datetime][und][0][value][date]=' + data['0']['date'] +
                             '&node[field_datetime][und][0][value][time]=' + data['0']['time'] +
                             '&node[field_datetime][und][0][timezone][timezone]=' + data['0']['dateTimeTZ'];

            console.log(dataToSend);

            //Last part of the URL to create or update backend entry
            var URLpart = '/rest/node.json';
            //UUID of entry we're going to update
            var entryUUID = data['0']['UUID'];

            //Try to create or edit backend node
            //Theoretically you can use CSRF token multiple times, but this gave error: 401 (Unauthorized: CSRF validation failed)
            var backendURL = window.localStorage.getItem("backendURL");
            //Get and set Drupal Services token
            backend.getServicesToken(backendURL).then(function(servicesToken){
                //Initiate node creation
                backend.editBackendNode(entryUUID, dataToSend, URLpart).then(function(data){
                    //If creation was successfull
                    if (data === "success") {
                        //Mark local entry object as synced
                        retrievedObj["lastUpdatedLocally"] = "";

                        //And modify corresponding Checkin entry at DB
                        indexedDBexo.addEntry(retrievedObj, "bodyconditions").then(function(data){
                            //console.log(data);
                        });

                        //Update entry at $rootScope model
                        //.some will iterate through all array elements
                        //.some can be stopped by return keyword, and angular.forEach (or native .forEach) - can't
                        $rootScope['exo']['bodyconditions'].some(function(value, index, array){
                            //If edited entry UUID is equal to found entry UUID
                            if (value['uuid'] == retrievedObj['uuid']){
                                //Update entry at $rootScope
                                $rootScope.exo.bodyconditions[index] = angular.copy(retrievedObj);
                                //Stop searching through all $rootScope entries
                                return;
                            }
                        });

                        console.log("You've created/updated backend entry successfully");
                    } else {
                        //If creation was not successfull
                        console.log("You've failed to create/update backend entry");
                    }
                });
            });
        });
    };

});
