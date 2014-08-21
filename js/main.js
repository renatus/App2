//Modules theoretically should be used to divide huge app in a logical parts
//Say, activities, checkins, health reports etc. may be handled by different modules
//In practice you can't nest ng-app directives in your HTML code
//Even if you'll put two ng-app directives to tags, that reside on a single page, but not as parent and child, only first one will work by default (there are workarounds, though)
//So we only use "exoApp" module for all parts of our app
//Multiple dependencies of the module should be declared like this: ['exoFilters', 'exoApp']);
var app = angular.module('exoApp', ['ngRoute']);



//Code to be executed on app loading
//You can't call a service from .config
app.config(['$routeProvider',
  //Set pre-defined URLs and URL patterns for your app
  //<CODETAG:NewEntityType comment="While adding new entity type to app, add it's name here, alongside 'activities'">
  function($routeProvider) {
      $routeProvider.
      //Page for a single activity
      //You can call a page with URL like this: http://yourdomain.com/#/activities/123
      when('/activities/:activityId', {
          //HTML template for this URL pattern
          templateUrl: 'templates/activity.html',
          //Angular controller for this URL pattern
          //showActivityController is a child of activitiesController, as showActivityController uses data from $scope of latter
          //So we should set activitiesController here, and showActivityController - at single activity page template .html file
          controller: 'activitiesController'
      }).

      //Page for activities list
      when('/activities', {
          //HTML template for this URL pattern
          templateUrl: 'templates/activities.html'
      }).

      //Login form page
      when('/login', {
          //HTML template for this URL pattern
          templateUrl: 'templates/login.html',
          //Angular controller for this URL pattern
          //controller: 'loginController'
      }).
      
      //If there is no such a page
      otherwise({
          //Redirect user to
          redirectTo: '/',
          //HTML template for this URL pattern
          templateUrl: 'templates/frontpage.html'
      });
}]);



//Code to be executed on app loading
//You can call a service from .run
app.run(function($rootScope, indexedDBexo) {

    //Create subobject for app's model
    $rootScope.exo = {};

    //Open app's IndexedDB database
    //There will be no problems, in case you'll call indexedDBexo.open() method again
    //<CODETAG:NewEntityType comment="While adding new entity type to app, add it's name here, alongside 'activities'">
    indexedDBexo.open().then(function(){

        //Get all entries from DB and put them to $rootScope subobject
        //We should store model at $rootScope to be able to get data outside of perticular controller
        //To use all Angular's goodness, we will duplicate appropriate subobjects from $rootScope to $scope of particular controller
        //As far as objects are copied by reference, memory consumption should not increase
        //And all manipulations will be mirrored between $scope and $rootScope automatically

        //Get all Activities from DB and put them to $rootScope subobject
        indexedDBexo.getEntriesSubset("activities").then(function(data){
            $rootScope.exo.activities = data;
            //Will show us all objects we've get - at Chrome DevTools console
            //console.log(data);
        });

        //Get all Check-ins from DB and put them to $rootScope subobject
        indexedDBexo.getEntriesSubset("checkins").then(function(data){
            $rootScope.exo.checkins = data;
            //Will show us all objects we've get - at Chrome DevTools console
            //console.log(data);
        });
    });



    //If there is NO previously saved backend domain, use webapp domain itself
    if (!(window.localStorage.getItem("backendURL"))) {
        //Get webapp domain
        var appURL = window.location.protocol + "//" + window.location.hostname;
        //Save webapp domain to local storage
        window.localStorage.setItem("backendURL", appURL);
    }

});



//Service to work with IndexedDB
app.service('indexedDBexo', function($window, $q){
	
	//IndexedDB database name
	var dbName = "ExocortexDB";
	//Database version, should be increased, when structure updates, should be of integer type
	var dbVersion = 11;
	var exoDB = {};
	var indexedDB = window.indexedDB;
	
	exoDB.indexedDB = {};
	exoDB.indexedDB.db = null;
	
	//Handle DB-related errors
	exoDB.indexedDB.onerror = function(e) {
		console.log(e);
	};
	
	
	
	//Function to open DB and upgrade it's data structure, if needed
    //This function should contain names of all types of entries we're going to store at DB, as it defines DB structure
	this.open = function() {
		var deferred = $q.defer();
		
		//Request to open database, it will return IDBOpenDBRequest object
		var request = indexedDB.open(dbName, dbVersion);
		
        //If request was successfull 
		request.onsuccess = function(e) {
			console.log ("DB " + dbName + " was opened and ready for work");
			exoDB.indexedDB.db = e.target.result;
			deferred.resolve();
		}
		
        //If DB version changed, i.e. we need to upgrade it's structure
        //<CODETAG:NewEntityType comment="While adding new entity type to app, add it's name here, alongside 'activities'">
		request.onupgradeneeded = function(e) {
			exoDB.indexedDB.db = e.target.result;
			var db = exoDB.indexedDB.db;
			console.log ("Going to upgrade DB from version " + e.oldVersion + " to version " + e.newVersion);
			
			//If there is Object store with the same name at DB from previous revision,
			//we'll face error while trying to upgrade DB
			//We should delete existing Object store (and all it's data, of course)
			try {
                //Store for activities
				if (db.objectStoreNames && db.objectStoreNames.contains("activities")) {
					db.deleteObjectStore("activities");
				}
                
                //Store for check-ins
                if (db.objectStoreNames && db.objectStoreNames.contains("checkins")) {
					db.deleteObjectStore("checkins");
				}
			}
			catch (err) {
				console.log("Error in objectStoreNames: " + err);
			}
			
			//Create object store
			//Object Store is a storage for objects, instead of tables at SQL databases
			//We do not define objects structure here other than "fields" for keyPath, and for indexes
			//While adding objects, you can omit fields, including indexing ones, but keyPath field should be filled
			//We can make one of it's "fields" (with unique values) an in-line key with keyPath

            //Store for activities
			var store = db.createObjectStore("activities", {keyPath: "uuid"});
			// Create an index to search customers by text field. We may have duplicates so we can't use a unique index.
			store.createIndex("activities", "activities", {unique: false});
            
            //Store for check-ins
            var store = db.createObjectStore("checkins", {keyPath: "uuid"});
			// Create an index to search customers by text field. We may have duplicates so we can't use a unique index.
			store.createIndex("checkins", "checkins", {unique: false});
			
			//Or we can make unique integer out-of-line keys (1,2,3 ...) with keyGenerator, enabled by {autoIncrement: true}
			//var store = db.createObjectStore("store2", {autoIncrement: true});
			//console.log("Onupgradeneeded: "+ JSON.stringify(store));
		}
        //</CODETAG:NewEntityType>
		
        //If request failed
		request.onfailure = function(e) {
			console.error("Failed to open DB: " + e);
			deferred.reject();
		}
		
        //If request gave us error
		request.onerror = function(e) {
			console.error("Error while opening DB: " + e);
			deferred.reject();
		}
		
		return deferred.promise;
	};
	
	
	
	//Add or edit entry in DB
    //This function may be used to work with entry of any type
    //"exEntry" argument should contain object with appropriate structure to add to DB
    //"entryType" argument should contain entry type name (it is a DB "table" name as well), like "activities"
    //While adding objects, you can omit fields, including indexing ones, but "uuid" field should be filled
	this.addEntry = function(exEntry, entryType){
		var deferred = $q.defer();
		
		//Database table name
		var dbTableName = entryType;
		var db = exoDB.indexedDB.db;
		//Create transaction, define Object stores it will cover
		var transact = exoDB.indexedDB.db.transaction(dbTableName, "readwrite");
		var store = transact.objectStore(dbTableName);
        
        //We should put an object to IndexedDB
        //AngularJS works with objects, so we can just put them to DB without alteration
		
		//Request to store data at DB
		var request = store.put(exEntry);
		
        //If request was successfull 
		request.onsuccess = function(e) {
			console.log('Data added to DB');
			deferred.resolve();
		};
		
        //If request gave us error
		request.onerror = function(e) {
			console.error("Error Adding an item: ", e);
			deferred.reject();
		};
		
		return deferred.promise;
	};
    
    
    
    //Delete entry in DB
    //This function may be used to work with entry of any type
    //"exEntry" argument should contain object with appropriate structure to add to DB
    //"entryType" argument should contain entry type name (it is a DB "table" name as well), like "activities"
	this.deleteEntry = function(exEntry, entryType){
		var deferred = $q.defer();
		
		//Database table name
		var dbTableName = entryType;
		var db = exoDB.indexedDB.db;
		//Create transaction, define Object stores it will cover
		var transact = exoDB.indexedDB.db.transaction(dbTableName, "readwrite");
		var store = transact.objectStore(dbTableName);
        
        //Request to delete data from DB
        var request = store.delete(exEntry.uuid);
        
        //If request was successfull
		request.onsuccess = function(e) {
			console.log('Entry deleted from DB');
			deferred.resolve();
		};
		
        //If request gave us error
		request.onerror = function(e) {
			console.error("Error deleting an entry: ", e);
			deferred.reject();
		};
		
		return deferred.promise;
    };
    
    
    
    //Get particular item of particular type, say, some activity
    //"entryType" argument should contain entry type name (it is a DB "table" name as well), like "activities"
    this.getEntry = function(entryType, UUID) {
        var deferred = $q.defer();

        //Array for entries, extracted from DB
        var entriesExtracted = [];

        //Database table name
        var dbTableName = entryType;
        var db = exoDB.indexedDB.db;
        //Create transaction
        var transact = db.transaction(dbTableName, "readonly");
        var store = transact.objectStore(dbTableName);

        // Get everything in the store
        //keyRange is a continuous interval over keys, for example greater than X and smaller than Y
        var keyRange = IDBKeyRange.only(UUID);
        //Cursor is a mechanism for iterating over multiple records within a key range
        var cursorRequest = store.openCursor(keyRange);

        //If request was successfull
        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            //If we've iterated through all extracted entries
            if (result === null || result === undefined) {
                //Return array with these entries
                deferred.resolve(entriesExtracted);
            } else {
                if (result){
                    //Add extracted entry to array for such entries
                    entriesExtracted.push(result.value);
                    //Continue to next entry
                    result.continue();
                }
            }
        };

        //If request gave us error
        cursorRequest.onerror = function(e){
            console.log(e.value);
            deferred.reject("Something went wrong!!!");
        };

        return deferred.promise;
    };



    //Get all items of particular type, say, all activities
    //"entryType" argument should contain entry type name (it is a DB "table" name as well), like "activities"
    this.getEntriesSubset = function(entryType) {
        var deferred = $q.defer();
        
        //Array for entries, extracted from DB
        var entriesExtracted = [];
        
        //Database table name
        var dbTableName = entryType;
        var db = exoDB.indexedDB.db;
        //Create transaction
        var transact = db.transaction(dbTableName, "readonly");
        var store = transact.objectStore(dbTableName);
        
        // Get everything in the store
        //keyRange is a continuous interval over keys, for example greater than X and smaller than Y
        var keyRange = IDBKeyRange.lowerBound(0);
        //Cursor is a mechanism for iterating over multiple records within a key range
        var cursorRequest = store.openCursor(keyRange);
        
        //If request was successfull
        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            //If we've iterated through all extracted entries
            if (result === null || result === undefined) {
                //Return array with these entries
                deferred.resolve(entriesExtracted);
            } else {
                if (result){
                    //Add extracted entry to array for such entries
                    entriesExtracted.push(result.value);
                    //Continue to next entry
                    result.continue();
                }
            }
        };
        
        //If request gave us error
        cursorRequest.onerror = function(e){
            console.log(e.value);
            deferred.reject("Something went wrong!!!");
        };
        
        return deferred.promise;
    };
	
});



//Generate UUID version 4 (based on random or pseudo-random numbers), something like 20fbd631-75ce-4d27-a920-35ad76608dd7
//Version 4 UUIDs have the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where x is any hexadecimal digit and y is one of 8, 9, a, or b.
//First number of a forth part determines the variant (currently only 1 in use); If it is one of 8,9,a,b, it is correct
//0-7 are reserved for backward compatibility, c,d are reserved for Microsoft, and e,f are reserved for future use)
//First number of a third part determines version - in our case it should be 4, as we use UUID version 4
app.service('UUID4', function(){
    this.generate = function(){
        //Square brackets means we should find any character between the brackets (not necessary exact sequence)
        // /g modifier means we should search for all x an y symbols, not just the first one
        //All found x symbols will be replaced with randomly picked hexadecimal digits (1-9, a-f) one by one
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            
            //Math.random will give us not that random results, so UUID collisions are possible
            //It is preferable to use window.crypto.getRandomValues() function - it gives cryptographically-grade pseudo-random values
            //window.crypto.getRandomValues() is not available in older browsers, so we should fallback to Math.random() if needed
            //randNum variable should contain number between 0 and 15
            var randNum = "";
            //if window.crypto.getRandomValues() is available
            if (window.crypto){
                //Create one-element array (counting starts from 1, not from 0).
                var randArr = new Uint32Array(1);
                //Each array element will be populated with random value (like 3479190651), so you can get many numbers in a time.
                window.crypto.getRandomValues(randArr);
                //% will give us division remainder, in our case it will be a number between 0 and 15
                randNum = randArr[0] % 16;
            } else {
                //Math.random() will give us pseudorandom number between 0 and 1
                // |0 - bitwise operation OR, it will drop fraction part of the number
                randNum = Math.random() * 16|0;
            }
            
            //v = c == 'x'  - if current replaceable symbol is not equal to x
            //r : (r&0x3|0x8)  - v will be populated with hexadecimal number between 8 and 11 (i.e. 8, 9, a or b)
            var r = randNum, v = c == 'x' ? r : (r&0x3|0x8);
            //Conversion of hexadecimal number to string (i.e. to one of these symbols: 1-9, a-f)
            return v.toString(16);
        });
        
        return uuid;
        
    };
});



//Controller to start communication with server, when user initiated it from Login page
app.controller('serverInteract', function ($scope, $q, backend, userInterface) {
    //Prepopulate some of Login page input fields
    $scope.pageLogin = {};

    //Populate Backend domain textfield
    //backendURL at local storage is populated on app start, but storage may be cleared later, so we check if it is filled
    if (window.localStorage.getItem("backendURL")) {
		//If there is previously saved backend domain, propose it to user
		$scope.pageLogin.backendURL = window.localStorage.getItem("backendURL");
    } else {
        //If there is NO previously saved backend domain, propose webapp domain itself to user
        $scope.pageLogin.backendURL = window.location.protocol + "//" + window.location.hostname;
    }

    //Populate Username textfield
    if (window.localStorage.getItem("backendUserName")) {
		//If there is previously saved username, propose it to user
		$scope.pageLogin.name = window.localStorage.getItem("backendUserName");
    }

    
    
    //Method to initiate logging process, when user pressed Login button
    $scope.login = function(pageLogin){
        //Save domain we're trying to use (doesn't matter, was it user-entered)
        window.localStorage.setItem("backendURL", pageLogin.backendURL);
        //Save username we're trying to use
        window.localStorage.setItem("backendUserName", pageLogin.name);

        //Theoretically you can use CSRF token multiple times, but this gave error: 401 (Unauthorized: CSRF validation failed)
        backend.getServicesToken(pageLogin.backendURL).then(function(servicesToken){
            //Login to server
            backend.login(pageLogin.backendURL, pageLogin.name, pageLogin.password).then(function(serverReply){
                //console.log(serverReply);
                userInterface.alert(serverReply);
            });
            
        });
    }

    //Method to initiate logout process, when user pressed Logout button
    $scope.logout = function(){
        var backendURL = window.localStorage.getItem("backendURL");

        //If there is known server URL
        if (backendURL) {
            //Theoretically you can use CSRF token multiple times, but this gave error: 401 (Unauthorized: CSRF validation failed)
            backend.getServicesToken(backendURL).then(function(servicesToken){
                //Logout from server
                backend.logout(backendURL).then(function(serverReply){
                    //console.log(serverReply);
                    userInterface.alert(serverReply);
                });
            });
        } else {
            //Notify user about missing server URL
            userInterface.alert("Can't log out, server URL is not known");
        }
    }
});



//Service to work with remote server
app.service('backend', function($q, $http, $rootScope){
    
    //Get Drupal Services token, needed to communicate with server (security measure implemented by Services module)
    //backendDomain argument should contain server domain without trailing slash, like "http://yoursite.com"
    //Theoretically you can use CSRF token multiple times, but this gave error: 401 (Unauthorized: CSRF validation failed)
    //It's not clear, was it because token was the same, or $http.defaults.headers.common expired somehow
	this.getServicesToken = function(backendDomain){
        var deferred = $q.defer();    
        
        //Make HTTP request
        $http({
            url: backendDomain + "/services/session/token",
            method: "GET",
        }).success(function(data, status, headers, config) {
            //If we've successfully got data (i.e. token)
            //Set token as default - we don't have to set it at request header itself
            $http.defaults.headers.common['X-CSRF-Token'] = data;
            //Return token
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("There was an error while trying to get Services token from server");
        });
        
        return deferred.promise;
    }
    
    //Login to remote server
    //backendDomain argument should contain server domain without trailing slash, like "http://yoursite.com"
    //userLogin argument should contain backend user login
    //userPass argument should contain backend user password
	this.login = function(backendDomain, userLogin, userPass){
        var deferred = $q.defer();    
        
        //Make HTTP request
        $http({
            url: backendDomain + "/rest/user/login.json",
            method: "POST",
            //headers: {'X-CSRF-Token': },
            data: {
                "username":userLogin,
                "password":userPass
            }
        }).success(function(data, status, headers, config) {
            //If we've successfully logged in
            deferred.resolve("You've logged in successfully");
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("Login attemp failed");
        });
        
        return deferred.promise;
        
    }
    
    //Logout from remote service
    //backendDomain argument should contain server domain without trailing slash, like "http://yoursite.com"
	this.logout = function(backendDomain){
        var deferred = $q.defer();    
        
        //Make HTTP request
        $http({
            url: backendDomain + "/rest/user/logout.json",
            method: "POST"
        }).success(function(data, status, headers, config) {
            //If we've successfully logged out
            deferred.resolve("You've logged out successfully");
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("Logout attemp failed");
        });
        
        return deferred.promise;
        
    }



    //Send JSON data to create or modify backend node
    //dataToSend should be JSON data to modify Drupal node
    //"URLpart" argument should contain last part of URL to put data, to add note it'll be "/rest/node.json"
    //To edit node, URLpart should contain last part of the node URL at IS, like "/rest/node/123.json"

    //fuctionOnSuccess should contain function name (in specific format) to call after this function execution will be completed
    this.editBackendNode = function(entryID, dataToSend, URLpart) {
        var backendURL = window.localStorage.getItem("backendURL");

        var deferred = $q.defer();

        //Make HTTP request
        $http({
            url: backendURL + URLpart,
            method: "POST",
            //"application/x-www-form-urlencoded" is Internet media type for encoding key-value pairs
            //Each key-value pair is separated by an '&' character, and each key is separated from its value by an '=' character
            //Keys and values are escaped by replacing spaces with the '+' character
            //URL encoding used on all other non-alphanumeric characters
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            //headers: {'X-CSRF-Token': },
            data: dataToSend
        }).success(function(data, status, headers, config) {
            //If we've successfully created/updated backend entry
            deferred.resolve("success");
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("fail");
        });

        return deferred.promise;

    };

});



//Service to sync checkin to backend
//We need it because we can't call service method from the method of this very same service, so we need two services
app.service('backendSyncAll', function($rootScope, backendSync){
    //Iterate throug all entries in all collections to order sync of all unsynced entries to server
    this.syncAllTo = function() {
        //for/in loops through the properties of an object and return names of that properties in i variable
        //i will hold collection name, like "activities" or "checkins"
        //Each collection contains array of individual entries (which are JS objects themselves)
        for (var i in $rootScope.exo){
            //.some will iterate through all array elements (i.e. individual entries)
            //.some can be stopped by return keyword, and angular.forEach (or native .forEach) - can't
            $rootScope['exo'][i].some(function(value, index, array){
                if (value['lastUpdatedLocally']) {
                    console.log(i);
                    console.log(value['uuid']);
                    backendSync[i](value['uuid']);
                }
            });
        }
    }
});



//Service to sync checkin to backend
//We need it because we can't call service method from the method of this very same service, so we need two services
app.service('backendSync', function($rootScope, $q, indexedDBexo, backend){
    //Sync checkin to IS backend
    this.checkins = function(UUID){

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



    //Sync checkin to IS backend
    this.activities = function(UUID){

    };

});



//Service to work with random interface elements
app.service('userInterface', function($window){

	//Method to notify user about something by Alert
    //alertBody argument should contain message text
	this.alert = function(alertBody) {
        //Show alert message to the user
        $window.alert(alertBody);
    }

});



//Directive to make buttons and other UI elements work like <a> tag
//For example, you may create a button, that will open new page being clicked
//http://stackoverflow.com/questions/15847726/is-there-a-simple-way-to-use-button-to-navigate-page-as-a-link-does-in-angularjs
//$location service parses the URL in the browser address bar (using window.location) and makes it available to your app
app.directive('exoHref', function ($location) {
    return function (scope, element, attrs) {

        var URLpath;

        attrs.$observe('exoHref', function(data) {
            URLpath = data;
        });

        element.bind( 'click', function() {
            scope.$apply(function() {
                //.path method returns current url when called without parameter, and change path URL when called with parameter
                $location.path(URLpath);
            });
        });

    };
});



//Controller to show number of all unsynced entries at app
app.controller('allEntriesController', function($scope, $rootScope, backendSyncAll) {

    //We should watch for changes at model to react when it is fully loaded from DB, or changed by user actions
    //Number of unsynced entries will be updated, right after it was changed
    //$watch({}, true) is the most computationally-expensive observer, but you have to use it to get correct result
    $rootScope.$watch("exo", function(newValue, oldValue) {

        //Variable to store numbers of unsynced entries
        var numOfUnsyncedEntries = 0;

        //for/in loops through the properties of an object and return names of that properties in i variable
        //i will hold collection name, like "activities" or "checkins"
        //Each collection contains array of individual entries (which are JS objects themselves)
        for (var i in $rootScope.exo){
            //.some will iterate through all array elements (i.e. individual entries)
            //.some can be stopped by return keyword, and angular.forEach (or native .forEach) - can't
            $rootScope['exo'][i].some(function(value, index, array){
                if (value['lastUpdatedLocally']) {
                    numOfUnsyncedEntries++;
                }
            });
        }

        //Display number of locally-modified unsynced entries
        $scope.numOfUnsyncedEntries = numOfUnsyncedEntries;

    }, true);



    //Button to sync all entries was pressed
    $scope.syncAllTo = function(){
        backendSyncAll.syncAllTo();
    }

});
