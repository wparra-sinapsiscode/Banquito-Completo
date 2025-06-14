// Script to display all loan data arrays in a formatted way
import { initialLoans as monthlyLoans, initialMembersData, membersWithSavings, initialLoanRequests as monthlyRequests } from './mockData.js';
import { initialLoans as weeklyLoansv2, initialLoanRequests as weeklyRequestsv2 } from './mockDataFinal.js';
import { initialLoans as weeklyLoansv1, initialLoanRequests as weeklyRequestsv1 } from './mockDataWeekly.js';
import { initialLoans as weeklyLoansv3, initialLoanRequests as weeklyRequestsv3 } from './mockDataWeeklyFinal.js';

console.log('='.repeat(80));
console.log('BANQUITO SYSTEM - LOAN DATA ARRAYS');
console.log('='.repeat(80));

// Display Members Data
console.log('\n1. MEMBERS DATA (initialMembersData)');
console.log('-'.repeat(80));
console.log(`Total Members: ${initialMembersData.length}`);
console.log('\nFirst 5 members:');
initialMembersData.slice(0, 5).forEach(member => {
  console.log(`  ID: ${member.id}, Name: ${member.name}, DNI: ${member.dni}, Shares: ${member.shares}, Guarantee: S/${member.guarantee}, Credit Rating: ${member.creditRating} (Score: ${member.creditScore})`);
});
console.log('  ... and', initialMembersData.length - 5, 'more members');

// Display Members with Savings Plans
console.log('\n2. MEMBERS WITH SAVINGS PLANS (membersWithSavings)');
console.log('-'.repeat(80));
console.log(`Total Members with Savings: ${membersWithSavings.length}`);
console.log('\nFirst 3 members with savings:');
membersWithSavings.slice(0, 3).forEach(member => {
  console.log(`  ID: ${member.id}, Name: ${member.name}, Savings Plan: ${member.savingsPlan.enabled ? 'Enabled' : 'Disabled'}, Plan Days: ${member.savingsPlan.planDays}, TEA: ${member.savingsPlan.TEA * 100}%`);
});

// Display Monthly Loans (mockData.js)
console.log('\n3. MONTHLY PAYMENT LOANS (mockData.js - initialLoans)');
console.log('-'.repeat(80));
console.log(`Total Loans: ${monthlyLoans.length}`);
console.log('\nFirst 5 loans:');
monthlyLoans.slice(0, 5).forEach(loan => {
  console.log(`  ID: ${loan.id}, Member: ${loan.memberName}, Amount: S/${loan.originalAmount}, Remaining: S/${loan.remainingAmount}, Monthly Payment: S/${loan.monthlyPayment}, Status: ${loan.status}`);
});
console.log('  ... and', monthlyLoans.length - 5, 'more loans');

// Display Weekly Loans v1 (mockDataWeekly.js)
console.log('\n4. WEEKLY PAYMENT LOANS v1 (mockDataWeekly.js - initialLoans)');
console.log('-'.repeat(80));
console.log(`Total Loans: ${weeklyLoansv1.length}`);
weeklyLoansv1.forEach(loan => {
  console.log(`  ID: ${loan.id}, Member: ${loan.memberName}, Amount: S/${loan.originalAmount}, Weekly Payment: S/${loan.weeklyPayment}, Total Weeks: ${loan.installments}`);
});

// Display Weekly Loans v2 (mockDataFinal.js)
console.log('\n5. WEEKLY PAYMENT LOANS v2 (mockDataFinal.js - initialLoans)');
console.log('-'.repeat(80));
console.log(`Total Loans: ${weeklyLoansv2.length}`);
weeklyLoansv2.forEach(loan => {
  console.log(`  ID: ${loan.id}, Member: ${loan.memberName}, Amount: S/${loan.originalAmount}, Weekly Payment: S/${loan.weeklyPayment}, Total Weeks: ${loan.totalWeeks}`);
});

// Display Weekly Loans v3 (mockDataWeeklyFinal.js)
console.log('\n6. WEEKLY PAYMENT LOANS v3 (mockDataWeeklyFinal.js - initialLoans)');
console.log('-'.repeat(80));
console.log(`Total Loans: ${weeklyLoansv3.length}`);
weeklyLoansv3.forEach(loan => {
  console.log(`  ID: ${loan.id}, Member: ${loan.memberName}, Amount: S/${loan.originalAmount}, Weekly Payment: S/${loan.weeklyPayment}, Total Weeks: ${loan.totalWeeks}`);
});

// Display Monthly Loan Requests
console.log('\n7. MONTHLY LOAN REQUESTS (mockData.js - initialLoanRequests)');
console.log('-'.repeat(80));
console.log(`Total Requests: ${monthlyRequests.length}`);
console.log('\nLoan requests by status:');
const monthlyStatusCount = monthlyRequests.reduce((acc, req) => {
  acc[req.status] = (acc[req.status] || 0) + 1;
  return acc;
}, {});
Object.entries(monthlyStatusCount).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});
console.log('\nFirst 5 requests:');
monthlyRequests.slice(0, 5).forEach(req => {
  console.log(`  ID: ${req.id}, Member: ${req.memberName}, Amount: S/${req.amount}, Purpose: ${req.purpose}, Status: ${req.status}`);
});

// Display Weekly Loan Requests v1
console.log('\n8. WEEKLY LOAN REQUESTS v1 (mockDataWeekly.js - initialLoanRequests)');
console.log('-'.repeat(80));
console.log(`Total Requests: ${weeklyRequestsv1.length}`);
weeklyRequestsv1.forEach(req => {
  console.log(`  ID: ${req.id}, Member: ${req.memberName}, Amount: S/${req.amount}, Weeks: ${req.installments}, Status: ${req.status}`);
});

// Display Weekly Loan Requests v2
console.log('\n9. WEEKLY LOAN REQUESTS v2 (mockDataFinal.js - initialLoanRequests)');
console.log('-'.repeat(80));
console.log(`Total Requests: ${weeklyRequestsv2.length}`);
console.log('\nFirst 5 requests:');
weeklyRequestsv2.slice(0, 5).forEach(req => {
  console.log(`  ID: ${req.id}, Member: ${req.memberName}, Amount: S/${req.amount}, Weeks: ${req.totalWeeks}, Status: ${req.status}`);
});

// Display Weekly Loan Requests v3
console.log('\n10. WEEKLY LOAN REQUESTS v3 (mockDataWeeklyFinal.js - initialLoanRequests)');
console.log('-'.repeat(80));
console.log(`Total Requests: ${weeklyRequestsv3.length}`);
weeklyRequestsv3.forEach(req => {
  console.log(`  ID: ${req.id}, Member: ${req.memberName}, Amount: S/${req.amount}, Weeks: ${req.totalWeeks}, Status: ${req.status}`);
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total Members: ${initialMembersData.length}`);
console.log(`Members with Savings Plans: ${membersWithSavings.length}`);
console.log('\nLoans by payment frequency:');
console.log(`  Monthly Payment Loans: ${monthlyLoans.length}`);
console.log(`  Weekly Payment Loans (v1): ${weeklyLoansv1.length}`);
console.log(`  Weekly Payment Loans (v2): ${weeklyLoansv2.length}`);
console.log(`  Weekly Payment Loans (v3): ${weeklyLoansv3.length}`);
console.log('\nLoan Requests:');
console.log(`  Monthly Requests: ${monthlyRequests.length}`);
console.log(`  Weekly Requests (v1): ${weeklyRequestsv1.length}`);
console.log(`  Weekly Requests (v2): ${weeklyRequestsv2.length}`);
console.log(`  Weekly Requests (v3): ${weeklyRequestsv3.length}`);

console.log('\n' + '='.repeat(80));