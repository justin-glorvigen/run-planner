Vue.component('multiselect', window.VueMultiselect.default)

var vue = new Vue({
    el: '#app',
    data: {
        longRunToShortRunFactor: 2,
        mileageIncreasePerWeek: 1.1,
        daysToTaperPer10Miles: 1,
        includeSpeedWork: true,
        startingMileage: 1,
        goalMileage: 2,
        startDate: new Date().toISODateString(),
        goalDate: new Date().toISODateString(),
        shortRunDays: [],
        longRunDays: [],
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
            var vue = this;
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

            // Get number of weeks

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