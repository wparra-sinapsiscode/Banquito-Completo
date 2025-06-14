// Test script to verify payment schedule generation
const { generateMockPaymentSchedule } = require('./src/data/mockDataFinal.js');

// Test case: Edward's loan with required date July 2nd, 2025
const loanAmount = 3000;
const totalWeeks = 12;
const monthlyInterestRate = 5;
const requiredDate = '2025-07-02'; // July 2nd, 2025 (user's required date)

console.log('Testing payment schedule generation...');
console.log('Loan details:');
console.log(`- Amount: S/ ${loanAmount}`);
console.log(`- Total weeks: ${totalWeeks}`);
console.log(`- Monthly interest rate: ${monthlyInterestRate}%`);
console.log(`- Required date: ${requiredDate}`);
console.log('');

try {
  const schedule = generateMockPaymentSchedule(loanAmount, totalWeeks, monthlyInterestRate, requiredDate);
  
  console.log('Generated payment schedule:');
  console.log('Week | Due Date     | Amount  | Capital | Interest | Balance');
  console.log('-----|-------------|---------|---------|----------|--------');
  
  schedule.slice(0, 5).forEach(payment => {
    console.log(`${payment.week.toString().padStart(4)} | ${payment.dueDate} | S/ ${payment.weeklyPayment.toString().padStart(4)} | S/ ${payment.capitalPayment.toString().padStart(4)} | S/ ${payment.interestPayment.toString().padStart(5)} | S/ ${payment.remainingBalance.toString().padStart(4)}`);
  });
  
  if (schedule.length > 5) {
    console.log('... (showing first 5 weeks)');
  }
  
  console.log('');
  console.log(`First payment due: ${schedule[0].dueDate} (${new Date(schedule[0].dueDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})`);
  console.log(`Second payment due: ${schedule[1].dueDate} (${new Date(schedule[1].dueDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})`);
  
} catch (error) {
  console.error('Error generating schedule:', error);
}