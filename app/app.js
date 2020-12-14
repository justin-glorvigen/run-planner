Vue.component('multiselect', window.VueMultiselect.default)

var vue = new Vue({
    el: '#app',
    data: {
        raceMileage: 50,
        goalMileage: 70,
        startingMileage: 15,
        mileageIncreasePerWeek: 1.1,
        longRunToShortRunFactor: 2,
        errorMessages: [],
        warningMessages: [],
        startDate: new Date().toISODateString(),
        goalDate: new Date().toISODateString(),
        shortRunDays: [{"text":"Monday","value":1},{"text":"Wednesday","value":3},{"text":"Thursday","value":4}],
        longRunDays: [{"text":"Sunday","value":0},{"text":"Saturday","value":6}],
        speedWorkDays: [{"text":"Monday","value":1},{"text":"Thursday","value":4}],
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
                vue.trainingPlan = vue.findMileageIncreaseWeeks(vue.startingMileage, vue.goalMileage, vue.mileageIncreasePerWeek, vue.longRunDays, vue.shortRunDays, vue.longRunToShortRunFactor, "short run");
                if (vue.trainingPlan.length > trainingWeeks) {
                    vue.errorMessages.push(`Unable to safely ramp up mileage that much in ${trainingWeeks} weeks. Recommended time to safely ramp up to that many miles is ${vue.trainingPlan.length}.`);
                }
    
                // Calculate the number of days needed to taper down your training
                // so you're rested for the race
                var taperWeeks = vue.calculateRaceTaper(vue.raceMileage, vue.trainingPlan[vue.trainingPlan.length - 1], vue.longRunDays, vue.shortRunDays, vue.longRunToShortRunFactor, "short run");
                if (vue.trainingPlan.length + taperWeeks > Math.floor(trainingDays / 7)) {
                    vue.errorMessages.push(`Not enough time for race taper. Recommended taper for this many miles is ${taperWeeks} week${taperWeeks <= 1 ? '' : 's'}.`);
                }
    
                if (vue.speedWorkDays.length > 0){
                    // Calculate the number of weeks left over to incorporate speed work
                    var speedworkWeeks = trainingWeeks - vue.trainingPlan.length - taperWeeks;
                    if (speedworkWeeks <= 0){
                        vue.warningMessages.push(`Mileage ramp up and taper will take up all training time, no weeks left for speedwork.`);
                    }
                }

                // Add race taper here so it's at the end of the training plan
                taperWeeks.forEach(t => {
                    vue.trainingPlan.push(t);
                });
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
        calculateWeek: function(weekType, weekMileage, longRunDays, shortRunDays, longRunToShortRunFactor, shortRunType){
            var returning = {
                desiredMileage: vue.roundMiles(weekMileage),
                type: weekType,
                days: []
            };

            // Calculation for long run mileage
            // Went a little crazy with the math but I'll do my best to explain it here.
            // sr = short run distance
            // lr = long run distance
            // x = number of long runs
            // y = number of short runs
            // tm = total weekly mileage
            // Using these acronyms we can construct the formula for calculating our run numbers like this:
            // tm = x * lr + y * sr
            // Long version: total mileage = number of long runs times long run distance plus number of short runs times short run distance
            // Since we have a long run to short run factor we can call that "f",
            // and since our long runs are a factor of a short run we know "lr = sr * f"
            // So our formula now becomes:
            // tm = x * sr * f + y * sr
            // Using a series of transforms we can solve for our short run distance,
            // and by extension, long run distance since lr = sr * f.
            // I'll admit it, I cheated (or did I just verify my own solution?). Here's the WolframAlpha solution: https://www.wolframalpha.com/input/?i=t+%3D+x*s*f%2By*s+solve+for+s
            // The formula solved for sr
            // sr = tm / (f * x + y)

            // Using the formula
            var shortRunMileage = weekMileage / (longRunToShortRunFactor * longRunDays.length + shortRunDays.length);
            // Using the result to get the long run mileage
            var longRunMileage = shortRunMileage * longRunToShortRunFactor;

            if (longRunDays.length <= 2){
                longRunDays.forEach(d => {
                    returning.days.push({
                        day: d,
                        mileage: vue.roundMiles(longRunMileage),
                        type: "long run"
                    });
                });
            } else {
                var variance = vue.roundMiles(longRunMileage * longRunDays.length / 10);

                for (var i = 0; i < longRunDays.length; i++){
                    var mileage = vue.roundMiles(longRunMileage);
                    if (i == 0){
                        mileage -= variance;
                    } else if (i == longRunDays.length - 1){
                        mileage += variance;
                    }

                    returning.days.push({
                        day: longRunDays[i],
                        mileage: mileage,
                        type: "long run"
                    });
                }
            }

            if (shortRunDays.length <= 2){
                shortRunDays.forEach(d => {
                    returning.days.push({
                        day: d,
                        mileage: vue.roundMiles(shortRunMileage),
                        type: shortRunType
                    });
                });
            } else {
                // Introduce some variance
                var variance = vue.roundMiles(shortRunMileage * shortRunDays.length / 10);
                
                for (var i = 0; i < shortRunDays.length; i++){
                    var mileage = vue.roundMiles(shortRunMileage);

                    if (i == 0){
                        mileage -= variance;
                    }else if (i == 1){
                        mileage += variance
                    }

                    returning.days.push({
                        day: shortRunDays[i],
                        mileage: mileage,
                        type: shortRunType
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
        findMileageIncreaseWeeks: function(startingMileage, goalMileage, increasePerWeek, longRunDays, shortRunDays, longRunToShortRunFactor, shortRunType){
            var currMileage = startingMileage;
            var weeks = [];

            while(currMileage < goalMileage){
                currMileage = currMileage * increasePerWeek;

                if (currMileage > goalMileage){
                    currMileage = goalMileage;
                }

                weeks.push(vue.calculateWeek("Increasing Mileage", currMileage, longRunDays, shortRunDays, longRunToShortRunFactor, shortRunType));
            }

            return weeks;
        },
        calculateRaceTaper: function(raceMileage, lastTrainingWeek, longRunDays, shortRunDays, longRunToShortRunFactor, shortRunType){
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

            closestTaperDistance.taperSchedule.forEach(t => {
                var weekMileage = vue.roundMiles(lastTrainingWeek.actualMileage * (1 - t));

                returning.push(vue.calculateWeek("Race Taper " + "-" + (t * 100) + "%", weekMileage, longRunDays, shortRunDays, longRunToShortRunFactor, shortRunType));
            });

            return returning;
        },
        downloadCSV: function(){
            
        }
    },
    mounted: function ()
    {
        // Main initialization method
        var vue = this;
        vue.goalDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 14515200000)).toISODateString(); // Default goal in 8 weeks
        vue.startDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 604800000)).toISODateString(); // Default start date next week
    }
});