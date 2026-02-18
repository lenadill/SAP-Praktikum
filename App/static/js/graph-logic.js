export function calc_turnover(revenue, outgoings) {
  let count_revenue = revenue.length;
  let count_outgoings = outgoings.length;
  let turnover = [];

  if (count_revenue != count_outgoings) {
    throw new Error("Anzahl Einnahmen != Anzahl Ausgaben");
  }

  for (let i = 0; i < count_revenue; i++) {
    let sum = revenue[i] - outgoings[i];
    turnover.push(sum);
  }

  return turnover;
}

//console.log(calc_turnover([2],[1]))
