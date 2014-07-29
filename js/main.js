//Modules are used to divide huge app in a logical parts - say, activities, checkins, health reports etc. may be handled by different modules
//"exoApp" is a basic module to handle tasks, common to other modules (authentication, work with DB, etc.)
//It should be declared as a dependency for other modules, thanks to that we don't have to add ng-app="exoApp" property to use it's controllers
//Multiple dependencies should be declared like this: ['exoFilters', 'exoApp']);
var app = angular.module('exoApp', ['ngRoute']);



//Set pre-defined URLs and URL patterns for your app
app.config(['$routeProvider',
  function($routeProvider) {
      $routeProvider.
      //Page for a single activity
      //You can call a page with URL like this: http://yourdomain.com/#/activities/123
      when('/activities/:activityId', {
          //HTML template for this URL pattern
          templateUrl: 'templates/activity.html',
          //Angular controller for this URL pattern
          controller: 'showActivityController'
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
          redirectTo: '/'
      });
}]);



//Service to work with IndexedDB
app.service('indexedDBexo', function($window, $q){
	
	//IndexedDB database name
	var dbName = "ExocortexDB";
	//Database version, should be increased, when structure updates, should be of integer type
	var dbVersion = 9;
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
				if (db.objectStoreNames && db.objectStoreNames.contains("activities")) {
					db.deleteObjectStore("activities");
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
			var store = db.createObjectStore("activities", {keyPath: "uuid"});
			// Create an index to search customers by text field. We may have duplicates so we can't use a unique index.
			store.createIndex("activities", "activities", {unique: false});
			
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



//Controller to start communication with server, when user initiated it
app.controller('serverInteract', function ($scope, $q, backend) {
    //Method to initiate logging process, when user pressed Login button
    $scope.login = function(user){
        backend.getServicesToken(user.backendURL).then(function(servicesToken){
            console.log(servicesToken);
            backend.login(user.backendURL, user.name, user.password).then(function(serverReply){
                console.log(serverReply);
            });
            
        });
    }
    
    //Method to initiate logout process, when user pressed Logout button
    $scope.logout = function(user){
        backend.logout(user.backendURL).then(function(serverReply){
            console.log(serverReply);
        });
    }
});



//Service to work with remote server
app.service('backend', function($q, $http){
    
    //Get Drupal Services token, needed to communicate with server (security measure implemented by Services module)
    //backendDomain argument should contain server domain without trailing slash, like "http://yoursite.com"
	this.getServicesToken = function(backendDomain){
        var deferred = $q.defer();    
        
        $http({
            url: backendDomain + "/services/session/token",
            method: "GET",
            //data: {"foo":"bar"}
        }).success(function(data, status, headers, config) {
            //If we've successfully got data (i.e. token), return it
            $http.defaults.headers.common['X-CSRF-Token'] = data;
            deferred.resolve(data);
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("There was an error while trying to get Services token from server");
        });
        
        return deferred.promise;
    }
    
    //Get Drupal Services token, needed to communicate with server (security measure implemented by Services module)
    //backendDomain argument should contain server domain without trailing slash, like "http://yoursite.com"
	this.login = function(backendDomain, userLogin, userPass){
        console.log("Logging in");
        
        var deferred = $q.defer();    
        
        $http({
            url: backendDomain + "/rest/user/login.json",
            method: "POST",
            data: {
                "username":userLogin,
                "password":userPass
            }
        }).success(function(data, status, headers, config) {
            //If we've successfully got data (i.e. token), return it
            deferred.resolve("You've logged in successfully");
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("Login attemp failed");
        });
        
        return deferred.promise;
        
    }
    
    //Get Drupal Services token, needed to communicate with server (security measure implemented by Services module)
    //backendDomain argument should contain server domain without trailing slash, like "http://yoursite.com"
	this.logout = function(backendDomain, userLogin, userPass){
        console.log("Logging out");
        var deferred = $q.defer();    
        
        $http({
            url: backendDomain + "/rest/user/logout.json",
            method: "POST"
        }).success(function(data, status, headers, config) {
            //If we've successfully got data (i.e. token), return it
            deferred.resolve("You've logged out successfully");
        }).error(function(data, status, headers, config) {
            //If there were error, show error message
            console.log(status);
            deferred.reject("Logout attemp failed");
        });
        
        return deferred.promise;
        
    }
});