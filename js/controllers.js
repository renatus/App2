var phonecatApp = angular.module('startApp', ['exoFilters']);
 
phonecatApp.controller('StartCtrl', function ($scope) {
	$scope.phones = [
		{'name': 'Nexus S',
		 'snippet': 'Fast just got faster with Nexus S.'},
		{'name': 'Motorola XOOM™ with Wi-Fi',
		 'snippet': 'The Next, Next Generation tablet.'},
		{'name': 'MOTOROLA XOOM™',
		 'snippet': 'The Next, Next Generation tablet.'}
	];
	
	$scope.activities = [
		{"nid":"6650","language":"English","title":"End an agreements with Stream ISP","status":"Completed","statusRAW":"completed","priority":"Low","priorityRAW":"1000","strategicImportance":"Low","strategicImportanceRAW":"1000","difficultyPlanned":"Hard","difficultyPlannedRAW":"3000","difficulty":"Hard","difficultyRAW":"3000","group":"Flat 524, Biryulyovo, flat 464, MTS, Internet","groupRAW":"742, 760, 1501, 472","dateTimePlannedStart":"2014-03-01 11:00:50","dateTimePlannedEnd":"2014-03-19 18:00:24","dateTimePlannedTZ":"Europe/Moscow Europe/Moscow","dateTimePlannedOffset":"14400 14400","dateTimeStart":"2014-03-07 04:01:53","dateTimeEnd":"2014-03-07 04:01:56","dateTimeTZ":"Europe/Moscow Europe/Moscow","dateTimeOffset":"14400 14400","lastUpdated":"1394150475","bodySummary":""},
		{"nid":"6090","language":"Russian","title":"\u041e\u043f\u043b\u0430\u0442\u0430 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442\u0430, \u041c\u0422\u0421, +7(916)5477868","status":"Completed","statusRAW":"completed","priority":"Major","priorityRAW":"3000","strategicImportance":"Low","strategicImportanceRAW":"1000","difficultyPlanned":"Normal","difficultyPlannedRAW":"2000","difficulty":"Normal","difficultyRAW":"2000","group":"Internet, Payments, Phone, MTS","groupRAW":"472, 743, 1191, 1501","dateTimePlannedStart":"2014-03-31 00:00:43","dateTimePlannedEnd":"2014-04-03 23:54:19","dateTimePlannedTZ":"Europe/Moscow Europe/Moscow","dateTimePlannedOffset":"14400 14400","dateTimeStart":"2014-03-07 04:02:30","dateTimeEnd":"2014-03-07 04:02:33","dateTimeTZ":"Europe/Moscow Europe/Moscow","dateTimeOffset":"14400 14400","lastUpdated":"1394150513","bodySummary":""},
		{"nid":"3188","language":"English","title":"Renew domain exocortex.pp.ua","status":"Active","statusRAW":"active","priority":"Critical","priorityRAW":"4000","strategicImportance":"Low","strategicImportanceRAW":"1000","difficultyPlanned":"Normal","difficultyPlannedRAW":"2000","difficulty":"Normal","difficultyRAW":"2000","group":"Domains, Internet","groupRAW":"1431, 472","dateTimePlannedStart":"2014-04-02 03:46:07","dateTimePlannedEnd":"2014-04-04 23:48:58","dateTimePlannedTZ":"Europe/Moscow Europe/Moscow","dateTimePlannedOffset":"14400 14400","dateTimeStart":"2014-03-07 03:44:04","dateTimeEnd":"2014-03-07 03:44:04","dateTimeTZ":"Europe/Moscow Europe/Moscow","dateTimeOffset":"14400 14400","lastUpdated":"1394149604","bodySummary":""},
		{"nid":"6533","language":"English","title":"Digitize VHS film from primary school","status":"Completed","statusRAW":"completed","priority":"Low","priorityRAW":"1000","strategicImportance":"Normal","strategicImportanceRAW":"2000","difficultyPlanned":"Extra","difficultyPlannedRAW":"4000","difficulty":"Extra","difficultyRAW":"4000","group":"1828, Education, Video, Digitizing","groupRAW":"496, 489, 2357, 6534","dateTimePlannedStart":"2014-04-30 00:00:51","dateTimePlannedEnd":"2014-04-30 23:11:30","dateTimePlannedTZ":"Europe/Moscow Europe/Moscow","dateTimePlannedOffset":"14400 14400","dateTimeStart":"2014-03-07 03:46:06","dateTimeEnd":"2014-03-07 03:46:22","dateTimeTZ":"Europe/Moscow Europe/Moscow","dateTimeOffset":"14400 14400","lastUpdated":"1394149582","bodySummary":""},
		{"nid":"4327","language":"English","title":"Renew domain selenokhod.com","status":"Completed","statusRAW":"completed","priority":"Critical","priorityRAW":"4000","strategicImportance":"Normal","strategicImportanceRAW":"2000","difficultyPlanned":"Normal","difficultyPlannedRAW":"2000","difficulty":"Normal","difficultyRAW":"2000","group":"Domains, Internet, Payments, Selenokhod","groupRAW":"1431, 472, 743, 479","dateTimePlannedStart":"2014-06-30 00:00:45","dateTimePlannedEnd":"2014-07-30 23:06:26","dateTimePlannedTZ":"Europe/Moscow Europe/Moscow","dateTimePlannedOffset":"14400 14400","dateTimeStart":"2014-03-07 04:02:49","dateTimeEnd":"2014-03-07 04:02:52","dateTimeTZ":"Europe/Moscow Europe/Moscow","dateTimeOffset":"14400 14400","lastUpdated":"1394150531","bodySummary":""}
	];
    
    
    
    $scope.filterFn = function(activity){
        
        if(activity.status == "Active"){
            return true; // this will be listed in the results
        }
        
        return false; // otherwise it won't be within the results
    };

	
   
});



    angular.module('exoFilters', []).filter('reverse', function() {
        return function(input, uppercase) {
            input = input || '';
            var out = "";
            //if(input){
                for (var i = 0; i < input.length; i++) {
                    out = input.charAt(i) + out;
                }
            //}
            
            // conditional based on optional argument
            if (uppercase) {
                out = out.toUpperCase();
            }
            
            return out;
        };
    });

/*
filter('custfilter', function () {
    return function (movies, genres) {
        var items = {
            genres: genres,
            out: []
        };
        angular.forEach(movies, function (value, key) {
            if (this.genres[value.genre] === true) {
                this.out.push(value);
            }
        }, items);
        return items.out;
    };
});
*/