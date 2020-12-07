Date.prototype.toISODateString = function(){
    var year = this.getFullYear();
    var month = this.getMonth() + 1;
    var date = this.getDate();
    if (month.toString().length < 2){
        month = "0" + month;
    }
    if (date.toString().length < 2){
        date = "0" + date;
    }
    return `${year}-${month}-${date}`;
}