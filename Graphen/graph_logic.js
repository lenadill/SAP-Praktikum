const revenue = [12000,13000,15000,14000,13000,12000,11000,8000,13000,10000,14000,13000]
const outgoings = [10000,12000,11000,15000,14000,10000,8000,8000,13000,12000,10000,9000]


function calc_turnover(revenue,outgoings){

let count_revenue = revenue.length;
let count_outgoings = outgoings.length;
var turnover = []

if (count_revenue != count_outgoings) {
    throw new Error("Anzahl Einnahmen != Anzahl Ausgaben");
    
}

for (let i = 0; i < count_revenue; i++) {
    sum = revenue[i] - outgoings[i]
    turnover.push(sum)
  console.log(sum)
}

return turnover
}

console.log(calc_turnover(revenue,outgoings))