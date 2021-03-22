Vue.component('multiselect', window.VueMultiselect.default)

var vue = new Vue({
    el: '#app',
    data: {
        raceMileage: 50,
        goalMileage: 60,
        startingMileage: 15,
        mileageIncreasePerWeek: 1.1,
        longRunToShortRunFactor: 2,
        errorMessages: [],
        warningMessages: [],
        startDate: new Date().toISODateString(),
        goalDate: new Date().toISODateString(),
        link: '',
        shortRunDays: [],
        longRunDays: [],
        speedWorkDays: [],
        trainingPlanWeeks: [],
        speedWorkThresholds: [
            {
                speedworkDayCount: 1,
                distanceMappings: [
                    {
                        weeklyMiles: 20,
                        speedworkDistance: 4
                    },
                    {
                        weeklyMiles: 15,
                        speedworkDistance: 3
                    },
                    {
                        weeklyMiles: 10,
                        speedworkDistance: 2
                    },
                    {
                        weeklyMiles: 2,
                        speedworkDistance: 1
                    }
                ]
            },
            {
                speedworkDayCount: 2,
                distanceMappings: [
                    {
                        weeklyMiles: 40,
                        speedworkDistance: 4.5
                    },
                    {
                        weeklyMiles: 30,
                        speedworkDistance: 4
                    },
                    {
                        weeklyMiles: 20,
                        speedworkDistance: 3
                    },
                    {
                        weeklyMiles: 15,
                        speedworkDistance: 2
                    },
                    {
                        weeklyMiles: 2,
                        speedworkDistance: 1
                    }
                ]
            }
        ],
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
        runDaysText: function (days) {
            return days.map(d => d.text).join(', ');
        },
        getFirstDayOfWeek: function (inputDate) {
            var msPerDay = 1000 * 60 * 60 * 24;
            var msToSubtract = inputDate.getDay() * msPerDay;

            return new Date(inputDate.getTime() - msToSubtract);
        },
        calculateTrainingPlan: function () {
            var vue = this;

            vue.link = vue.getLink();

            vue.errorMessages = [];

            if (vue.longRunDays.length <= 0 && vue.shortRunDays.length <= 0) {
                vue.errorMessages.push("Must have at least one short run and one long run per week");
            } else {
                if (vue.shortRunDays.length < 2) {
                    vue.errorMessages.push("At least 2 short run days are recommended per week");
                }

                // Get number of days between start date and end date
                var trainingDays = vue.calculateDaysBetweenDates(vue.startDate, vue.goalDate);
                var trainingWeeks = Math.floor(trainingDays / 7);

                // Calculate the number of weeks that you'll need to
                // increase mileage in order to hit your goal mileage
                vue.trainingPlan = vue.findMileageIncreaseWeeks(vue.startingMileage, vue.goalMileage, vue.mileageIncreasePerWeek, vue.longRunDays, vue.shortRunDays, vue.longRunToShortRunFactor);
                if (vue.trainingPlan.length > trainingWeeks) {
                    vue.errorMessages.push(`Unable to safely ramp up mileage that much in ${trainingWeeks} weeks. Recommended time to safely ramp up to that many miles is ${vue.trainingPlan.length}.`);
                }

                // Calculate the number of days needed to taper down your training
                // so you're rested for the race
                var taperWeeks = vue.calculateRaceTaper(vue.raceMileage, vue.trainingPlan[vue.trainingPlan.length - 1], vue.longRunDays, vue.shortRunDays, vue.longRunToShortRunFactor);
                if (vue.trainingPlan.length + taperWeeks > Math.floor(trainingDays / 7)) {
                    vue.errorMessages.push(`Not enough time for race taper. Recommended taper for this many miles is ${taperWeeks} week${taperWeeks <= 1 ? '' : 's'}.`);
                }

                if (vue.speedWorkDays.length > 0) {
                    // Calculate the number of weeks left over to incorporate speed work
                    var speedworkWeeks = trainingWeeks - vue.trainingPlan.length - taperWeeks.length;
                    if (speedworkWeeks <= 0) {
                        vue.warningMessages.push(`Mileage ramp up and taper will take up all training time, no weeks left for speedwork.`);
                    } else {
                        var populatedWeeks = vue.populateSpeedworkWeeks(speedworkWeeks, vue.goalMileage, vue.longRunDays, vue.shortRunDays, vue.speedWorkDays, vue.longRunToShortRunFactor);
                        populatedWeeks.forEach(d => {
                            vue.trainingPlan.push(d);
                        });
                    }
                } else {
                    // Add steady training weeks to ensure we hit our entire plan
                    var weeksToAdd = trainingWeeks - vue.trainingPlan.length - taperWeeks.length;

                    for (var i = 0; i < weeksToAdd; i++) {
                        // Just copy the previous week since we're steadily training
                        var weekToCopy = JSON.parse(JSON.stringify(vue.trainingPlan[vue.trainingPlan.length - 1]));
                        weekToCopy.type = "Steady Training"
                        vue.trainingPlan.push(weekToCopy);
                    }
                }

                // Add race taper here so it's at the end of the training plan
                taperWeeks.forEach(t => {
                    vue.trainingPlan.push(t);
                });

                var msPerDay = 1000 * 60 * 60 * 24;
                var trainingStartDate = new Date(Date.parse(vue.startDate) + new Date().getTimezoneOffset() * 1000 * 60);
                var currDate = vue.getFirstDayOfWeek(trainingStartDate);

                var raceDate = Date.parse(vue.goalDate);

                // Set up dates
                vue.trainingPlan.forEach(d => {
                    d.start = currDate;
                    d.end = new Date(currDate.getTime() + msPerDay * 6);

                    d.days.forEach(day => {
                        day.date = new Date(currDate.getTime() + (msPerDay * day.day.value));
                    });

                    currDate = new Date(currDate.getTime() + msPerDay * 7);

                    // Filter out training days that happen before the start date
                    d.days = d.days.filter(day => day.date.getTime() >= trainingStartDate.getTime());

                    // Filter out training days that happen after, or on, the race date.
                    d.days = d.days.filter(day => day.date.getTime() < raceDate);

                    // Re-calculate weekly mileage
                    var weeklyMileage = 0;
                    d.days.forEach(day => {
                        weeklyMileage += day.mileage;
                    });
                    d.actualMileage = weeklyMileage;
                });
            }
        },
        calculateDaysBetweenDates: function (startDate, goalDate) {
            var vue = this;

            // ms per week = ms per second * seconds per minute * minutes per hour * hours per day
            var msPerDay = 1000 * 60 * 60 * 24;

            startDate = new Date(Date.parse(startDate));
            goalDate = new Date(Date.parse(goalDate));

            var firstDayOfStartWeek = vue.getFirstDayOfWeek(startDate);
            var lastDayOfGoalWeek = new Date(vue.getFirstDayOfWeek(goalDate).getTime() + msPerDay * 6);

            // Convert days to ms timestamps
            var startTime = Date.parse(firstDayOfStartWeek);
            var endTime = Date.parse(lastDayOfGoalWeek);


            var msBetween = endTime - startTime;

            var days = Math.ceil(msBetween / msPerDay);

            return days;
        },
        calculateWeek: function (weekType, weekMileage, longRunDays, shortRunDays, longRunToShortRunFactor, speedWorkDays) {
            var vue = this;

            var desiredMileage = vue.roundMiles(weekMileage);

            var returning = {
                desiredMileage: desiredMileage,
                type: weekType,
                days: []
            };

            /*
                Calculate speedwork days last, take the speedwork mileage from short runs.
            */

            // Keep track of the speedwork distance so we know whether to replace a short run with it or not
            var speedworkMileage = 0;
            if (!speedWorkDays) {
                speedWorkDays = [];
            } else {
                var speedworkThreshold = vue.speedWorkThresholds.filter(d => d.speedworkDayCount = speedWorkDays.length);

                if (speedworkThreshold.length > 0) {
                    // Find the speedwork mileage to use
                    var speedworkDistanceMapping = speedworkThreshold[0].distanceMappings.filter(d => d.weeklyMiles < desiredMileage).sort((a, b) => b.weeklyMiles - a.weeklyMiles);
                    if (speedworkDistanceMapping.length > 0) {
                        speedworkMileage = speedworkDistanceMapping[0].speedworkDistance;
                    } else {
                        vue.errorMessages.push("Weekly mileage too short to introduce speedwork, try to increase weekly mileage before attempting to add speedwork");
                    }
                }
            }

            /* 
                Calculation for long run mileage:
                Went a little crazy with the math but I'll do my best to explain it here.
                sr = short run distance
                lr = long run distance
                x = number of long runs
                y = number of short runs
                tm = total weekly mileage
                Using these acronyms we can construct the formula for calculating our run numbers like this:
                tm = x * lr + y * sr
                Long version: total mileage = number of long runs times long run distance plus number of short runs times short run distance
                Since we have a long run to short run factor we can call that "f",
                and since our long runs are a factor of a short run we know "lr = sr * f"
                So our formula now becomes:
                tm = x * sr * f + y * sr
                Using a series of transforms we can solve for our short run distance,
                and by extension, long run distance since lr = sr * f.
                I'll admit it, I cheated (or did I just verify my own solution?). Here's the WolframAlpha solution: https://www.wolframalpha.com/input/?i=t+%3D+x*s*f%2By*s+solve+for+s
                The formula solved for sr
                sr = tm / (f * x + y)
            */

            // Using the formula
            var shortRunMileage = desiredMileage / (longRunToShortRunFactor * longRunDays.length + shortRunDays.length);

            // Using the result to get the long run mileage
            var longRunMileage = shortRunMileage * longRunToShortRunFactor;

            var daysToTakeSpeedworkMileageFromLongRuns = speedWorkDays.length - shortRunDays.length;

            if (longRunDays.length <= 2) {
                for (var i = 0; i < longRunDays.length; i++) {
                    if (daysToTakeSpeedworkMileageFromLongRuns > 0) {
                        returning.days.push({
                            day: longRunDays[i],
                            mileage: vue.roundMiles(longRunMileage - speedworkMileage),
                            type: "long run"
                        });

                        daysToTakeSpeedworkMileageFromLongRuns -= 1;
                    } else {
                        returning.days.push({
                            day: longRunDays[i],
                            mileage: vue.roundMiles(longRunMileage),
                            type: "long run"
                        });
                    }
                }
            } else {
                var variance = vue.roundMiles(longRunMileage * longRunDays.length / 10);

                for (var i = 0; i < longRunDays.length; i++) {
                    var mileage = vue.roundMiles(longRunMileage);
                    if (i == 0) {
                        mileage -= variance;
                    } else if (i == longRunDays.length - 1) {
                        mileage += variance;
                    }

                    if (daysToTakeSpeedworkMileageFromLongRuns > 0) {
                        returning.days.push({
                            day: longRunDays[i],
                            mileage: vue.roundMiles(mileage - speedworkMileage),
                            type: "long run"
                        });
                        daysToTakeSpeedworkMileageFromLongRuns -= 1;
                    } else {
                        returning.days.push({
                            day: longRunDays[i],
                            mileage: mileage,
                            type: "long run"
                        });
                    }
                }
            }


            var daysToTakeSpeedworkMileageFromShortRuns = speedWorkDays.length;
            if (shortRunDays.length <= 2) {
                for (var i = 0; i < shortRunDays.length; i++) {
                    if (daysToTakeSpeedworkMileageFromShortRuns > 0) {
                        returning.days.push({
                            day: shortRunDays[i],
                            mileage: vue.roundMiles(shortRunMileage - speedworkMileage),
                            type: "run"
                        });
                        daysToTakeSpeedworkMileageFromShortRuns -= 1;
                    } else {
                        returning.days.push({
                            day: shortRunDays[i],
                            mileage: vue.roundMiles(shortRunMileage),
                            type: "run"
                        });
                    }
                }
            } else {
                // Introduce some variance
                var variance = vue.roundMiles(shortRunMileage * shortRunDays.length / 10);

                for (var i = 0; i < shortRunDays.length; i++) {
                    var mileage = vue.roundMiles(shortRunMileage);

                    if (i == 0) {
                        mileage -= variance;
                    } else if (i == 1) {
                        mileage += variance
                    }

                    var day = shortRunDays[i];

                    var mileage = vue.roundMiles(shortRunMileage);

                    if (daysToTakeSpeedworkMileageFromShortRuns > 0) {
                        returning.days.push({
                            day: day,
                            mileage: vue.roundMiles(mileage - speedworkMileage),
                            type: "run"
                        });

                        daysToTakeSpeedworkMileageFromShortRuns -= 1;
                    } else {
                        returning.days.push({
                            day: day,
                            mileage: mileage,
                            type: "run"
                        });
                    }
                }
            }

            speedWorkDays.forEach(d => {
                returning.days.push({
                    day: d,
                    mileage: speedworkMileage,
                    type: "speed-work"
                })
            })

            returning.days = returning.days.sort((a, b) => { return a.day.value - b.day.value });

            var totalMileage = 0;
            returning.days.forEach(d => {
                totalMileage += d.mileage;
            });
            returning.actualMileage = totalMileage;

            return returning;
        },
        // Rounds miles to the closest quarter
        roundMiles: function (miles) {
            var returning = Math.round(miles * 100);

            var toRound = returning % 25;
            if (toRound > 12) {
                returning += 25 - toRound;
            } else {
                returning -= toRound;
            }

            return returning / 100;
        },
        findMileageIncreaseWeeks: function (startingMileage, goalMileage, increasePerWeek, longRunDays, shortRunDays, longRunToShortRunFactor) {
            var vue = this;

            var currMileage = startingMileage;
            var weeks = [];

            while (currMileage < goalMileage) {
                currMileage = vue.roundMiles(currMileage * increasePerWeek);

                if (currMileage > goalMileage) {
                    currMileage = goalMileage;
                }

                weeks.push(vue.calculateWeek("Increasing Mileage", currMileage, longRunDays, shortRunDays, longRunToShortRunFactor));
            }

            return weeks;
        },
        calculateRaceTaper: function (raceMileage, lastTrainingWeek, longRunDays, shortRunDays, longRunToShortRunFactor) {
            var vue = this;

            // Find taper schedule
            var closestTaperDistance = vue.taperDistanceMappings[0];

            vue.taperDistanceMappings.forEach(taperDistance => {
                var currDistance = Math.abs(closestTaperDistance.mileage - raceMileage);
                var newDistance = Math.abs(taperDistance.mileage - raceMileage);

                if (newDistance < currDistance) {
                    closestTaperDistance = taperDistance;
                }
            });

            // Now we have our race taper plan, start building the weeks
            var returning = [];

            closestTaperDistance.taperSchedule.forEach(t => {
                var weekMileage = vue.roundMiles(lastTrainingWeek.actualMileage * (1 - t));

                returning.push(vue.calculateWeek("Race Taper " + "-" + (t * 100) + "%", weekMileage, longRunDays, shortRunDays, longRunToShortRunFactor));
            });

            return returning;
        },
        populateSpeedworkWeeks: function (numberOfWeeks, goalMileage, longRunDays, shortRunDays, speedWorkDays, longRunToShortRunFactor) {
            var vue = this;

            var returning = [];

            for (var i = 0; i < numberOfWeeks; i++) {
                returning.push(vue.calculateWeek("Steady Training", goalMileage, longRunDays, shortRunDays, longRunToShortRunFactor, speedWorkDays));
            }

            return returning;
        },
        getLink: function () {
            var vue = this;

            var timezoneOffset = new Date().getTimezoneOffset() * 1000 * 60;

            var queryValues = [
                'goalDate=' + (Date.parse(vue.goalDate) + timezoneOffset),// Add 24 hours to offset the Date.parse method setting it to 12:00AM
                'startDate=' + (Date.parse(vue.startDate) + timezoneOffset),
                'startingMiles=' + vue.startingMileage,
                'raceMiles=' + vue.raceMileage,
                'goalMiles=' + vue.goalMileage,
                'longRunDays=' + vue.longRunDays.map(d => d.value).join(','),
                'shortRunDays=' + vue.shortRunDays.map(d => d.value).join(','),
                'speedworkDays=' + vue.speedWorkDays.map(d => d.value).join(',')
            ];

            return window.location.href.split("?")[0] + "?" + queryValues.join("&");
        },
        downloadCSV: function () {

        }
    },
    mounted: function () {
        // Main initialization method
        var vue = this;
        vue.goalDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 14515200000)).toISODateString(); // Default goal in 24 weeks
        vue.startDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 604800000)).toISODateString(); // Default start date next week

        var args = new URLSearchParams(window.location.search);
        if (args.get('goalDate')) {
            vue.goalDate = new Date(parseFloat(args.get('goalDate'))).toISODateString();
        }

        if (args.get('startDate')) {
            vue.startDate = new Date(parseFloat(args.get('startDate'))).toISODateString();
        }

        if (args.get('startingMiles')) {
            vue.startingMileage = args.get('startingMiles');
        }

        if (args.get('raceMiles')) {
            vue.raceMileage = args.get('raceMiles');
        }

        if (args.get('goalMiles')) {
            vue.goalMileage = args.get('goalMiles');
        }

        if (args.get('longRunDays')) {
            var dayVals = args.get('longRunDays').split(',').map(d => parseInt(d));

            vue.longRunDays = vue.daysOfTheWeek.filter(d => dayVals.indexOf(d.value) >= 0);
        }

        if (args.get('shortRunDays')) {
            var dayVals = args.get('shortRunDays').split(',').map(d => parseInt(d));

            vue.shortRunDays = vue.daysOfTheWeek.filter(d => dayVals.indexOf(d.value) >= 0);
        }

        if (args.get('speedworkDays')) {
            var dayVals = args.get('speedworkDays').split(',').map(d => parseInt(d));

            vue.speedWorkDays = vue.daysOfTheWeek.filter(d => dayVals.indexOf(d.value) >= 0);
        }

        vue.calculateTrainingPlan();
    }
});