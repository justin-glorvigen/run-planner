Vue.component('multiselect', window.VueMultiselect.default)

var vue = new Vue({
    el: '#app',
    data: {
        longRunToShortRunFactor: 2,
        mileageIncreasePerWeek: 1.1,
        daysToTaperPer10Miles: 1,
        startingMileage: 1,
        errorMessages: [],
        goalMileage: 2,
        startDate: new Date().toISODateString(),
        goalDate: new Date().toISODateString(),
        shortRunDays: [],
        longRunDays: [],
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
        ]
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

            // Get number of weeks between start date and end date
            var weeks = 2; // Calculate

            // Calculate the number of weeks that you'll need to
            // increase mileage in order to hit your goal mileage
            var mileageIncreaseWeeks = vue.findMileageIncreaseWeeks(vue.startingMileage, vue.goalMileage, vue.mileageIncreasePerWeek);
            if (mileageIncreaseWeeks.length > weeks){
                vue.errorMessages.push(`Unable to safely ramp up mileage that much in ${weeks} weeks. Recommended time to safely ramp up to that many miles is ${mileageIncreaseWeeks.length}.`);
            }


            // Calculate the number of days needed to taper down your training
            // so you're rested for the race
            var taperDays = vue.calculateRaceTaper(vue.goalMileage);
            if (mileageIncreaseWeeks.length + (taperDays % 7) > weeks){
                vue.errorMessages.push(`No time left for race taper. Recommended taper for this many miles is ${taperDays} day${taperDays <= 1 ? '' : 's'}.`);
            }

            // Calculate the number of weeks left over to incorporate speed work
            var speedworkWeeks = weeks - mileageIncreaseWeeks.length - Math.ceil(taperDays / 7);
            if (speedworkWeeks <= 0 && vue.speedWorkDays.length > 0){
                vue.errorMessages.push(`Mileage ramp up and taper days take up all training times, no weeks left for speedwork.`);
            }
        },
        findMileageIncreaseWeeks: function(startingMileage, goalMileage, increasePerWeek){
            var currMileage = startingMileage;
            var weeks = [];

            while(currMileage < goalMileage){
                currMileage = currMileage * increasePerWeek;

                weeks.push({
                    mileage: currMileage
                });
            }

            return weeks;
        },
        calculateRaceTaper: function(goalMileage){
            return 3;
        }
    },
    mounted: function ()
    {
        // Main initialization method
        var vue = this;
        vue.goalDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 1209600000)).toISODateString(); // Default goal in 2 weeks
        vue.startDate = vue.getFirstDayOfWeek(new Date(new Date().getTime() + 604800000)).toISODateString(); // Default start date next week
    }
});