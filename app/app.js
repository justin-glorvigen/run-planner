Vue.component('multiselect', window.VueMultiselect.default)

var vue = new Vue({
    el: '#app',
    data: {
        raceMileage: 13.1,
        goalMileage: 21,
        startingMileage: 10,
        mileageIncreasePerWeek: 1.1,
        longRunToShortRunFactor: 2,
        errorMessages: [],
        warningMessages: [],
        startDate: new Date().toISODateString(),
        goalDate: new Date().toISODateString(),
        shortRunDays: [{"text":"Monday","value":1},{"text":"Wednesday","value":3}],
        longRunDays: [{"text":"Sunday","value":0},{"text":"Saturday","value":6}],
        speedWorkDays: [],
        trainingPlanWeeks: [],
        daysOfTheWeek: [
            {
                text: "Sunday",
                value: 0
            },
            {
                text: "Monday",
                value: 1
            },
            {
                text: "Tuesday",
                value: 2
            },
            {
                text: "Wednesday",
                value: 3
            },
            {
                text: "Thursday",
                value: 4
            },
            {
                text: "Friday",
                value: 5
            },
            {
                text: "Saturday",
                value: 6
            }
        ],
        taperDistanceMappings: [
            {
                mileage: 100,
                taperSchedule: [
                    .2,
                    .4,
                    .6
                ]
            },
            {
                mileage: 62.1,
                taperSchedule: [
                    .2,
                    .4,
                    .6
                ]
            },
            {
                mileage: 50,
                taperSchedule: [
                    .2,
                    .4,
                    .6
                ]
            },
            {
                mileage: 31,
                taperSchedule: [
                    .2,
                    .4,
                    .6
                ]
            },
            {
                mileage: 26.2,
                taperSchedule: [
                    .2,
                    .4,
                    .6
                ]
            },
            {
                mileage: 18.6,
                taperSchedule: [
                    .3,
                    .5
                ]
            },
            {
                mileage: 15.5,
                taperSchedule: [
                    .3,
                    .5
                ]
            },
            {
                mileage: 13.1,
                taperSchedule: [
                    .3,
                    .5
                ]
            },
            {
                mileage: 6.2,
                taperSchedule: [
                    .2,
                    .5
                ]
            },
            {
                mileage: 3.1,
                taperSchedule: [
                    .2,
                    .5
                ]
            }
        ],
        trainingPlan: []
    },
    methods: {
        runDaysText: function(days){
            return days.map(d => d.text).join(', ');
        },
        getFirstDayOfWeek: function(inputDate){
            var currentDayOfWeek = inputDate.getDay();
            var msPerDay = 1000 * 60 * 60 * 24;
            var msToSubtract = (currentDayOfWeek - 7) * msPerDay; // Using 7 here even though currentDayOfWeek is 0-based because we want Sunday to start the week

            return new Date(inputDate.getTime() + msToSubtract);
        },
        calculateTrainingPlan: function(){
            var vue = this;

            vue.errorMessages = [];

            if (vue.longRunDays.length <= 0 && vue.shortRunDays.length <= 0){
                vue.errorMessages.push("Must have at least one short run and one long run per week");
            } else {
                if (vue.longRunDays.length < 2){
                    vue.errorMessages.push("At least 2 long run days are recommended per week");
                }
    
                if (vue.shortRunDays.length < 2){
                    vue.errorMessages.push("At least 2 short run days are recommended per week");
                }
    
                // Get number of days between start date and end date
                var trainingDays = vue.calculateDaysBetweenDates(vue.startDate, vue.goalDate);
                var trainingWeeks = Math.floor(trainingDays / 7);
    
                // Calculate the number of weeks that you'll need to
                // increase mileage in order to hit your goal mileage
                var mileageIncreaseWeeks = vue.findMileageIncreaseWeeks(vue.startingMileage, vue.goalMileage, vue.mileageIncreasePerWeek, vue.longRunDays, vue.shortRunDays, vue.longRunToShortRunFactor);
                if (mileageIncreaseWeeks.length > trainingWeeks){
                    vue.errorMessages.push(`Unable to safely ramp up mileage that much in ${trainingWeeks} weeks. Recommended time to safely ramp up to that many miles is ${mileageIncreaseWeeks.length}.`);
                }
    
                // Calculate the number of days needed to taper down your training
                // so you're rested for the race
                var taperWeeks = vue.calculateRaceTaper(vue.raceMileage, vue.longRunDays, vue.shortRunDays, vue.longRunToShortRunFactor);
                if (mileageIncreaseWeeks.length + taperWeeks > Math.floor(trainingDays / 7)) {
                    vue.errorMessages.push(`Not enough time for race taper. Recommended taper for this many miles is ${taperWeeks} week${taperWeeks <= 1 ? '' : 's'}.`);
                }
    
                if (vue.speedWorkDays.length > 0){
                    // Calculate the number of weeks left over to incorporate speed work
                    var speedworkWeeks = trainingWeeks - mileageIncreaseWeeks.length - taperWeeks;
                    if (speedworkWeeks <= 0){
                        vue.warningMessages.push(`Mileage ramp up and taper will take up all training time, no weeks left for speedwork.`);
                    }
                }

                vue.trainingPlan = mileageIncreaseWeeks;
                console.log(JSON.stringify(vue.trainingPlan));
            }
        },
        calculateDaysBetweenDates: function(startDate, goalDate){
            var vue = this;

            startDate = new Date(Date.parse(startDate));
            goalDate = new Date(Date.parse(goalDate));

            // We're treating the goal week as not a full week of training
            // so calculate weeks between start week and first day of end week
            var firstDayOfStartWeek = vue.getFirstDayOfWeek(startDate);
            var firstDayOfGoalWeek = vue.getFirstDayOfWeek(goalDate);

            // Convert days to ms timestamps
            var startTime = Date.parse(firstDayOfStartWeek);
            var endTime = Date.parse(firstDayOfGoalWeek);

            // ms per week = ms per second * seconds per minute * minutes per hour * hours per day
            var msPerWeek = 1000 * 60 * 60 * 24;

            var msBetween = endTime - startTime;

            var weeks = Math.ceil(msBetween / msPerWeek);

            return weeks;
        },
        calculateWeek: function(weekMileage, longRunDays, shortRunDays, longRunToShortRunFactor){
            var returning = {
                desiredMileage: vue.roundMiles(weekMileage),
                days: []
            };

            // Calculation for long run mileage
            // longRunMileage = shortRunMileage * longRunToShortRunFactor
            // Total Week Mileage = longRunMileage + shortRunMileage
            // Given the previous 2, we get this formula:
            // longRunMileage = Total Week Mileage / (longRunToShortRunFactor + 1) * longRunToShortRunFactor

            var longRunMileage = weekMileage / (longRunToShortRunFactor + 1) * longRunToShortRunFactor;
            var shortRunMileage = weekMileage - longRunMileage;

            if (longRunDays.length <= 2){
                longRunDays.forEach(d => {
                    returning.days.push({
                        day: d,
                        mileage: vue.roundMiles(longRunMileage / longRunDays.length)
                    });
                });
            } else {
                var variance = vue.roundMiles(longRunMileage / 10);

                for (var i = 0; i < longRunDays.length; i++){
                    var mileage = vue.roundMiles(longRunMileage / longRunDays.length);
                    if (i == 0){
                        mileage -= variance;
                    } else if (i == longRunDays.length - 1){
                        mileage += variance;
                    }

                    returning.days.push({
                        day: longRunDays[i],
                        mileage: mileage
                    });
                }
            }

            if (shortRunDays.length <= 2){
                shortRunDays.forEach(d => {
                    returning.days.push({
                        day: d,
                        mileage: vue.roundMiles(shortRunMileage / shortRunDays.length)
                    });
                });
            } else {
                // Introduce some variance
                var variance = vue.roundMiles(shortRunMileage / 5);
                
                for (var i = 0; i < shortRunDays.length; i++){
                    var mileage = vue.roundMiles(shortRunMileage / shortRunDays.length);

                    if (i == 0){
                        mileage -= variance;
                    }else if (i == shortRunDays.length - 1){
                        mileage += variance
                    }

                    returning.days.push({
                        day: shortRunDays[i],
                        mileage: mileage
                    });
                }
            }

            returning.days = returning.days.sort((a, b) => { return a.day.value - b.day.value });

            var totalMileage = 0;
            returning.days.forEach(d => {
                totalMileage += d.mileage;
            });
            returning.actualMileage = totalMileage;

            return returning;
        },
        // Rounds miles to the closest quarter
        roundMiles: function(miles){
            var returning = Math.round(miles * 100);

            var toRound = returning % 25;
            if (toRound > 12){
                returning += 25 - toRound;
            } else {
                returning -= toRound;
            }

            return returning / 100;
        },
        findMileageIncreaseWeeks: function(startingMileage, goalMileage, increasePerWeek, longRunDays, shortRunDays, longRunToShortRunFactor){
            var currMileage = startingMileage;
            var weeks = [];

            while(currMileage < goalMileage){
                currMileage = currMileage * increasePerWeek;

                if (currMileage > goalMileage){
                    currMileage = goalMileage;
                }

                weeks.push(vue.calculateWeek(currMileage, longRunDays, shortRunDays, longRunToShortRunFactor));
            }

            return weeks;
        },
        calculateRaceTaper: function(raceMileage, lastTrainingWeek){
            var vue = this;

            // Find taper schedule
            var closestTaperDistance = vue.taperDistanceMappings[0];

            vue.taperDistanceMappings.forEach(taperDistance => {
                var currDistance = Math.abs(closestTaperDistance.mileage - raceMileage);
                var newDistance = Math.abs(taperDistance.mileage - raceMileage);

                if (newDistance < currDistance){
                    closestTaperDistance = taperDistance;
                }
            });

            // Now we have our race taper plan, start building the weeks
            var returning = [];



        },
        downloadCSV: function(){
            
        }
    },
    mounted: function ()
    {
        // Main initialization method
        var vue = this;
        vue.goalDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 5443200000)).toISODateString(); // Default goal in 8 weeks
        vue.startDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 604800000)).toISODateString(); // Default start date next week
    }
});