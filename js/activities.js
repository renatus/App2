//Controller to work with activities
app.controller('activitiesController', function ($scope, $q, $routeParams, indexedDBexo, UUID4) {
    
    //You can populate scope by hands if needed. This is just example, app uses different activity data structure and populates it from IndexedDB.
	//$scope.activities = [
	//	{"nid":"6650","langcode":"en","title":"End an agreements with Stream ISP"},
	//	{"nid":"3188","langcode":"en","title":"Renew domain exocortex.pp.ua"}
	//];
    	
	
	
    //Open DB, get all entries and put them to $scope object
	$scope.init = function(){
        console.log("Init started");
		indexedDBexo.open().then(function(){            
            indexedDBexo.getEntriesSubset("activities").then(function(data){
                //Even if you only have one type of entries, it's better not to add them directly to scope, but use $scope as a container for models
                //In this case, our model is contained in "activities"
				$scope.activities = data;
                //Will show us all objects we've get - at Chrome DevTools console
                console.log(data);
			});			
		});
	}
	
	$scope.init();
    
    
    
    //Add new activity entry to $scope and DB        
    //You can get user-entered field value without passing object to function with construction like $scope.activity.title
    $scope.addEntry = function(activity){
        var curTimestamp = new Date().getTime();
        //Get universally unique identifier for a new entry
        var entryID = UUID4.generate();
        //Entry language code (like 'en')
        var langcode = activity.langcode;
        
        //Create entry object
        var newEntry = {
            "uuid": entryID,
            //Entry is new, so revision number is "0"
            "lastVersion": 0,
            "0": {
                "title": {},
                "langcode": $scope.activity.langcode,
                "createdTimeStamp": curTimestamp,
                "modifiedTimeStamp": curTimestamp
            }
		};
        //Set entry title
        //Entry is new, so revision number is "0"
        newEntry["0"]["title"][langcode] = activity.title;        
        
        //Clean form from now saved user-entered data
        this.activity = {};
        
        //Add new entry to DB
        indexedDBexo.addEntry(newEntry, "activities").then(function(){
            console.log('Activity saved to DB!');
        });
        
        //Add new entry to $scope
        $scope.activities.push(newEntry);
    }
    
    
    
    //Edit activity entry at $scope and DB 
    $scope.editEntry = function(activity, langcode){
        var curTimestamp = new Date().getTime();
        //Get revision number of now-previous entry revision
        var prevVersion = activity["lastVersion"];
        //Generate current entry revision number
        var curVersion = activity["lastVersion"] + 1;
        
        //Create temporary object to populate and push to $scope and DB
        activity[curVersion] = {};
        //At first current revision will be the same as previous
        activity[curVersion] = angular.copy(activity[activity["lastVersion"]]);
        //Timestamp of a moment entry was modified
        activity[curVersion]["modifiedTimeStamp"] = curTimestamp;
        
        //If user have changed entry's language, we should change it for all language-specific properties
        //without creation dupes, such as en: "Title" ru: "Title"
        var oldLangcode = activity[activity["lastVersion"]]["langcode"];
        if (oldLangcode != langcode){
            //Set entry's new langcode
            activity[curVersion]["langcode"] = langcode;
            //Create title copy with different langcode
            activity[curVersion]["title"][langcode] = activity[curVersion]["title"][oldLangcode];
            //Title value is not an object, so it'll not be copied by reference, so it's safe to delete original title value in a new revision
            delete activity[curVersion]["title"][oldLangcode];
        }
        
        //Set entry's new revision number
        activity["lastVersion"] = curVersion;
        //Restore now-previous version, as it was modified while user edited activity
        activity[prevVersion] = angular.copy(this.editActivityLastRev);
        
        
        //Update entry at DB
        indexedDBexo.addEntry(activity, "activities").then(function(){
            console.log('Activity edited!');
        });
        
        //Update entry at $scope
        for (var i = 0; i < $scope.activities.length; i++){
            //If edited activity UUID is equal to found activity UUID
            if ($scope.activities[i].uuid == activity.uuid){        
                //Update entry at $scope
                $scope.activities[i] = angular.copy(activity);
                //Stop searching through all $scope entries
                break;
            }
        }
        
        //Clean form from now saved user-entered data
        delete this.editActivityLastRev;
        //Delete temporary object to populate and push to $scope and DB
        delete activity;   
    }
    
    
    
    //Delete activity entry at $scope and DB 
    $scope.deleteEntry = function(activity){
        //Delete entry at DB
        indexedDBexo.deleteEntry(activity, "activities").then(function(){
            //Delete entry at $scope
            $scope.activities.splice($scope.activities.indexOf(activity), 1 );
            console.log('Activity deleted!');
        });
    } 
    
    
    
    //Filter to hide activities with title "not show" from ng-repeat list
    $scope.filterNot123 = function(activity){
        //If filter condition is met, in this case, entry's title is "not show"
        if (activity[activity["lastVersion"]]["title"][activity[activity["lastVersion"]]["langcode"]] == "not show"){
            //This entry will not be listed in the results
            return false; 
        }
        
        //This entry will be within the results
        return true; 
    };
    
});



//Controller to show single activity on a subpage
app.controller('showActivityController', function($scope, $routeParams) {
    //Get parameter value from the URL
    var activityID = $routeParams.activityId;
    //Set current activity ID
    $scope.activityID = activityID;
    
    //We should watch for changes at activity to show it when it is fully loaded from DB
    //Loading from DB is async, so $scope.activities will be empty in case we're loadind activity page from the start
    //Activity will be updated, right after it was changed
    $scope.$watch("activities", function(newValue, oldValue) {
        //If activity is fully loaded
        if ($scope.activities){
            //Search through all activities
            for (var i = 0; i < $scope.activities.length; i++){
                //If watched activity UUID is equal to found activity UUID
                if ($scope.activities[i].uuid == activityID){
                    //Copy found activity object to temporary subobject
                    $scope.activity = angular.copy($scope.activities[i]);
                    //Stop searching through all $scope entries
                    break;
                }
            }
        } 
    });
});



//Directive to generate activity edit form
app.directive("editActivity", function() {

    return {
        //Directive can be used as (element) Attribute or (custom) Element
        restrict: "AE",
        replace: true,
        //template: editorTemplate,
        //Form HTML template
        templateUrl: "templates/activity-edit.html",
        controller: function($scope) {
            //We have to copy activity subobject to bind it to edit form - to prevent changes from taking immediate effect, prior to pressing Save button
            //If we'll modify activity directly, entry and edit form may disappear, if modified entry should be hidden by ng-repeat filters
            $scope.editActivity = angular.copy($scope.activity);
            $scope.editActivityLangcode = angular.copy($scope['activity'][$scope['activity']['lastVersion']]['langcode']);
            $scope.editActivityLastRev = angular.copy($scope['activity'][$scope['activity']['lastVersion']]);
            
        }
    };
});



//Filter to sort entries at ng-repeat list by title (title should be numeric)
//Entries with non-numeric titles will be shown as well, but without proper sorting
//"reverse" argument may be equal to "ascend" or "descend" - in latter case sorting order should be reversed
//orderBy standard filter only works with arrays, not with objects
app.filter('orderObjectByINT', function(){
    return function(input, attribute, reverse) {
        //If input is not object, we can't process it properly
        if (!angular.isObject(input)) return input;
            
        //Temporary array for sorting
        var array = [];
        for (var objectKey in input) {
            //Push input object arguments to array one by one
            array.push(input[objectKey]);
        }
        
        array.sort(function(a, b){            
            a = parseInt(a[a['lastVersion']][attribute][a[a['lastVersion']]['langcode']]);
            b = parseInt(b[b['lastVersion']][attribute][b[b['lastVersion']]['langcode']]);
            return a - b;
        });
        
        //If user asked for reverse sorting order, reverse it
        if (reverse == 'descend') array.reverse();
        
        //Return array of sorted entries
        return array;
    }
});

//Filter to sort entries at ng-repeat list by title (title should be textual)
//Entries with numeric titles will be shown as well, but sorted as a text ones (i.e. 12 will be placed ahead of 2)
//"reverse" argument may be equal to "ascend" or "descend" - in latter case sorting order should be reversed
//orderBy standard filter only works with arrays, not with objects
app.filter('orderObjectByTXT', function(){
    return function(input, attribute, reverse) {
        //If input is not object, we can't process it properly
        if (!angular.isObject(input)) return input;
            
        //Temporary array for sorting
        var array = [];
        for (var objectKey in input) {
            //Push input object arguments to array one by one
            array.push(input[objectKey]);
        }
        
        array.sort(function(a, b){            
            //.toString() will convert numbers to text, and they'll be sorted in order like: 1, 12, 1218, 2, 24, 3, 4, 5, 6...
            var alc = a[a['lastVersion']][attribute][a[a['lastVersion']]['langcode']].toString().toLowerCase();
            var blc = b[b['lastVersion']][attribute][b[b['lastVersion']]['langcode']].toString().toLowerCase();
            
            return alc > blc ? 1 : alc < blc ? -1 : 0;
        });
        
        //If user asked for reverse sorting order, reverse it
        if (reverse == 'descend') array.reverse();
        
        //Return array of sorted entries
        return array;
    }
});
